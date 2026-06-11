"use strict";
/**
 * Cache v0.1.0 — Remote-mining manager.
 *
 * Drives exploitation of sources in adjacent (non-owned) rooms:
 *   1. Evaluate adjacent rooms for viable remote sources (use expansion intel).
 *   2. When a viable source is found, transition to "active" and request
 *      remoteHarvester + remoteHauler spawns.
 *   3. Maintain the right number of creeps per remote source; withdraw when
 *      a remote room becomes hostile or depletes.
 *
 * State persisted in Memory.remoteMining.
 *
 * v0.1.2 — GCL gate lowered + energy-aware bodies + harvest tracking.
 *
 * Design constraints:
 *   - Only adjacent rooms (range 1) for now — keeps pathing cheap.
 *   - Allow 1 remote op at GCL 1 (bootstrap the energy economy).
 *   - Scale body plans to room energy capacity.
 *   - Track energy harvested per remote op for effectiveness metrics.
 *   - Re-evaluate each active remote every 300 ticks to catch changes
 *     (hostile incursion, source drained, etc.).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRemoteMiningManager = runRemoteMiningManager;
exports.getRemoteMiningSpawnRequest = getRemoteMiningSpawnRequest;
exports.onRemoteMiningSpawn = onRemoteMiningSpawn;
exports.activeRemoteOpCount = activeRemoteOpCount;
const types_1 = require("./types");
const creepCensus_1 = require("./utils/creepCensus");
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
/** Re-evaluate an active remote op every N ticks. */
const REEVAL_INTERVAL = 300;
/** Max remote ops we maintain. Scales with GCL. */
function maxRemoteOps() {
    // GCL 0–1 → 1 (bootstrap energy economy early)
    // GCL 2   → 2
    // GCL 3+  → 3
    const gcl = Game.gcl.level;
    if (gcl < 1)
        return 1; // even at GCL 0 (pre-tick 1) allow
    if (gcl < 2)
        return 1;
    if (gcl < 3)
        return 2;
    return 3;
}
/** Max number of remote harvesters per source. */
const MAX_HARVESTERS_PER_SOURCE = 1;
/** Max number of remote haulers per source. */
const MAX_HAULERS_PER_SOURCE = 1;
/** Distance threshold: a source is considered "close enough" if the
 *  estimated travel distance from home room is <= this many rooms away.
 *  We limit to range 1 (adjacent only) for now. */
const MAX_ROOM_RANGE = 1;
// ---------------------------------------------------------------------------
// Energy-aware body selection
// ---------------------------------------------------------------------------
/**
 * Body tiers for remote harvesters, keyed by energy capacity floor.
 * Picked so the body cost fits in the room's energy capacity.
 * Tiers (cost → body):
 *   200+ → [WORK, MOVE]               (cheap, 150e)
 *   300+ → [WORK, WORK, MOVE]          (250e)
 *   450+ → [WORK, WORK, MOVE, MOVE]    (300e)
 *
 * At very low levels we use 1 WORK — still better than nothing.
 */
function selectRemoteHarvesterBody(energyCapacity) {
    if (energyCapacity >= 450)
        return [WORK, WORK, MOVE, MOVE];
    if (energyCapacity >= 300)
        return [WORK, WORK, MOVE];
    return [WORK, MOVE]; // floor: 200e capacity (RCL 1 spawns are 300 so this is safe)
}
/**
 * Body tiers for remote haulers, keyed by energy capacity floor.
 * Tiers (cost → body):
 *   200+ → [CARRY, MOVE]               (100e)
 *   300+ → [CARRY, CARRY, MOVE, MOVE]  (200e)
 *   450+ → [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] (300e)
 */
function selectRemoteHaulerBody(energyCapacity) {
    if (energyCapacity >= 450)
        return [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    if (energyCapacity >= 300)
        return [CARRY, CARRY, MOVE, MOVE];
    return [CARRY, MOVE];
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Ensure Memory.remoteMining exists. */
function ensureMem() {
    if (!Memory.remoteMining || !Memory.remoteMining.ops) {
        Memory.remoteMining = (0, types_1.defaultRemoteMiningMemory)();
    }
    return Memory.remoteMining;
}
/** Return adjacent room names. */
function adjacentRooms(roomName) {
    const exits = Game.map.describeExits(roomName);
    return exits ? Object.values(exits) : [];
}
/** Check that we have recent intel on a room. */
function hasIntel(roomName) {
    if (Game.rooms[roomName])
        return true;
    const mem = Memory.expansion;
    if ((mem === null || mem === void 0 ? void 0 : mem.scoutedRooms) && mem.scoutedRooms[roomName]) {
        return Game.time - mem.scoutedRooms[roomName] < 1500;
    }
    return false;
}
/** Count living creeps of a given role. */
function countRole(role) {
    let count = 0;
    for (const name in Game.creeps) {
        if (Game.creeps[name].memory.role === role)
            count++;
    }
    return count;
}
/**
 * Count living remote harvesters assigned to a specific source id.
 * Uses the pre-built creep census (single Game.creeps pass).
 */
function countHarvestersForSource(sourceId) {
    var _a;
    return (_a = (0, creepCensus_1.getCensus)().harvestersBySource[sourceId]) !== null && _a !== void 0 ? _a : 0;
}
/**
 * Count living remote haulers assigned to a specific remote room.
 * Uses the pre-built creep census (single Game.creeps pass).
 */
function countHaulersForRoom(roomName) {
    var _a;
    return (_a = (0, creepCensus_1.getCensus)().haulersByRoom[roomName]) !== null && _a !== void 0 ? _a : 0;
}
/**
 * Get the effective energy capacity for spawning across all owned spawns.
 * Used to select appropriately sized remote bodies.
 */
function effectiveEnergyCapacity() {
    let maxCap = 0;
    for (const name in Game.spawns) {
        const cap = Game.spawns[name].room.energyCapacityAvailable;
        if (cap > maxCap)
            maxCap = cap;
    }
    if (maxCap === 0)
        maxCap = 300; // fallback for edge cases
    return maxCap;
}
// ---------------------------------------------------------------------------
// Room evaluation
// ---------------------------------------------------------------------------
/**
 * Evaluate a remote room for viable sources.
 * Returns an array of RemoteSourceInfo for sources worth exploiting,
 * or empty if the room is unsuitable.
 *
 * A source is viable if:
 *   - The room is visible (has intel)
 *   - No hostile creeps present
 *   - No keeper lairs
 *   - Enough space around the source
 */
function evaluateRemoteRoom(room, homeRoom) {
    // Skip if hostile presence
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0)
        return [];
    // Skip keeper lair rooms
    const keeperLairs = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR,
    });
    if (keeperLairs.length > 0)
        return [];
    // If the room is owned by someone else, skip (for now — later we can contest)
    if (room.controller && room.controller.owner && !room.controller.my) {
        return [];
    }
    const sources = room.find(FIND_SOURCES);
    const out = [];
    for (const src of sources) {
        // Skip if already depleted (shouldn't happen for normal sources, but safe)
        if (src.energy === 0 && src.ticksToRegeneration === undefined)
            continue;
        out.push({
            id: src.id,
            x: src.pos.x,
            y: src.pos.y,
            roomName: room.name,
            assignedHarvesters: MAX_HARVESTERS_PER_SOURCE,
            assignedHaulers: MAX_HAULERS_PER_SOURCE,
        });
    }
    return out;
}
/**
 * Find the best source candidate across all owned rooms.
 * For each owned room, look at adjacent rooms with intel and score them.
 *
 * Two evaluation paths:
 *   1. Room is currently visible → full evaluateRemoteRoom (hostile/keeper checks).
 *   2. Room not visible but scouted → use Memory.expansion.scoutedSources.
 */
function findBestRemoteSource() {
    var _a, _b;
    const ops = ensureMem().ops;
    // Best source we've found across all rooms
    let best = null;
    let bestScore = -Infinity;
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room.controller || !room.controller.my)
            continue;
        const adj = adjacentRooms(roomName);
        for (const adjName of adj) {
            // Skip if we already have an active op for this room
            if (ops[adjName] && ops[adjName].state === "active")
                continue;
            const adjRoom = Game.rooms[adjName];
            let sources = [];
            if (adjRoom) {
                // Path 1: room is currently visible — full evaluation with safety checks
                sources = evaluateRemoteRoom(adjRoom, roomName);
            }
            else if (hasIntel(adjName)) {
                // Path 2: room not visible but we have scouted source data
                const scoutedSrcs = (_b = (_a = Memory.expansion) === null || _a === void 0 ? void 0 : _a.scoutedSources) === null || _b === void 0 ? void 0 : _b[adjName];
                if (scoutedSrcs && scoutedSrcs.length > 0) {
                    // Use scouted positions; can't verify hostiles/keepers but that's
                    // acceptable — the remoteHarvester will flee if things go bad
                    // (future enhancement).
                    for (const ss of scoutedSrcs) {
                        sources.push({
                            id: ss.id,
                            x: ss.x,
                            y: ss.y,
                            roomName: adjName,
                            assignedHarvesters: MAX_HARVESTERS_PER_SOURCE,
                            assignedHaulers: MAX_HAULERS_PER_SOURCE,
                        });
                    }
                }
            }
            for (const src of sources) {
                // Score: prefer rooms with more sources, closer to home
                let score = 100;
                // Bonus for each source in the room
                score += sources.length * 50;
                // Slight penalty for non-visible rooms (can't verify safety)
                if (!adjRoom)
                    score -= 20;
                // Bonus for shorter distance (approximate with range)
                const dist = Game.map.getRoomLinearDistance(roomName, adjName);
                score -= dist * 20;
                if (score > bestScore) {
                    bestScore = score;
                    best = { homeRoom: roomName, source: src };
                }
            }
        }
    }
    return best;
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Run remote-mining maintenance each tick.
 * Called from the main loop *before* spawn management.
 *
 * Evaluates new remote sources and maintains existing operations.
 */
function runRemoteMiningManager() {
    const mem = ensureMem();
    const maxOps = maxRemoteOps();
    // Count active ops
    const activeOps = Object.values(mem.ops).filter((o) => o.state === "active");
    const activeCount = activeOps.length;
    // 1. Re-evaluate existing active ops periodically
    for (const op of activeOps) {
        if (Game.time - op.lastEval > REEVAL_INTERVAL) {
            op.lastEval = Game.time;
            const room = Game.rooms[op.roomName];
            if (!room || !hasIntel(op.roomName)) {
                // Room no longer visible — keep the op but update timestamp
                continue;
            }
            // Check for hostiles
            const hostiles = room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                // Withdraw from this remote — stop spawning, let creeps die
                op.state = "idle";
                console.log(`RemoteMining: withdrawing from ${op.roomName} (hostiles)`);
                continue;
            }
            // Refresh source info
            const freshSources = evaluateRemoteRoom(room, op.homeRoom);
            if (freshSources.length === 0) {
                op.state = "idle";
                console.log(`RemoteMining: withdrawing from ${op.roomName} (no viable sources)`);
                continue;
            }
            // Merge: update assigned counts, add new sources
            for (const fs of freshSources) {
                const existing = op.sources.find((s) => s.id === fs.id);
                if (!existing) {
                    op.sources.push(fs);
                }
                else {
                    existing.assignedHarvesters = fs.assignedHarvesters;
                    existing.assignedHaulers = fs.assignedHaulers;
                }
            }
            // Remove sources no longer present
            op.sources = op.sources.filter((s) => freshSources.some((fs) => fs.id === s.id));
        }
    }
    // 2. Prune idle entries older than 3000 ticks
    for (const key in mem.ops) {
        const op = mem.ops[key];
        if (op.state === "idle" && Game.time - op.lastEval > 3000) {
            delete mem.ops[key];
        }
    }
    // 3. If we can have more ops, try to find a new one
    if (activeCount < maxOps) {
        const best = findBestRemoteSource();
        if (best) {
            // Check that we don't already have an op for this room
            if (!mem.ops[best.source.roomName]) {
                const op = {
                    roomName: best.source.roomName,
                    state: "active",
                    homeRoom: best.homeRoom,
                    sources: [best.source],
                    lastEval: Game.time,
                    totalHauled: 0,
                    lastHaulTick: 0,
                };
                mem.ops[best.source.roomName] = op;
                console.log(`RemoteMining: establishing op on ${best.source.roomName} ` +
                    `(source ${best.source.id}) served by ${best.homeRoom}`);
            }
        }
    }
}
/**
 * Return a spawn request for remote mining, or null if none needed.
 * Called by the spawn manager when normal targets are met.
 *
 * Checks each active remote op for missing harvesters/haulers.
 * Uses energy-aware body selection based on room capacity.
 */
function getRemoteMiningSpawnRequest() {
    const mem = ensureMem();
    for (const key in mem.ops) {
        const op = mem.ops[key];
        if (op.state !== "active")
            continue;
        for (const src of op.sources) {
            // Check for missing harvesters
            const hCount = countHarvestersForSource(src.id);
            if (hCount < src.assignedHarvesters) {
                const cap = effectiveEnergyCapacity();
                return {
                    role: "remoteHarvester",
                    body: selectRemoteHarvesterBody(cap),
                    priority: 3,
                    targetId: src.id,
                };
            }
            // Check for missing haulers
            const haulCount = countHaulersForRoom(op.roomName);
            if (haulCount < src.assignedHaulers) {
                const cap = effectiveEnergyCapacity();
                return {
                    role: "remoteHauler",
                    body: selectRemoteHaulerBody(cap),
                    priority: 4,
                    targetId: op.roomName,
                    homeRoom: op.homeRoom,
                };
            }
        }
    }
    return null;
}
/**
 * Called by the spawn manager after a remote creep is successfully spawned,
 * so we can store source/target info in its memory.
 */
function onRemoteMiningSpawn(role, creepName, targetId, homeRoom) {
    const creep = Game.creeps[creepName];
    if (!creep)
        return;
    if (role === "remoteHarvester" && targetId) {
        creep.memory.sourceId = targetId;
        // Also store the room name so the harvester knows where to go
        const src = Game.getObjectById(targetId);
        if (src) {
            creep.memory.targetRoom = src.room.name;
        }
    }
    if (role === "remoteHauler" && targetId) {
        creep.memory.targetRoom = targetId;
        creep.memory.homeRoom = homeRoom;
    }
}
/**
 * Return the number of active remote ops.
 */
function activeRemoteOpCount() {
    const mem = ensureMem();
    return Object.values(mem.ops).filter((o) => o.state === "active").length;
}
//# sourceMappingURL=remoteMining.js.map