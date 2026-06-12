"use strict";
/**
 * Cache v0.0.5 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 *
 * v0.0.5: Uses creep census (single Game.creeps pass) instead of
 * per-role countRole() loops. Eliminates 3 redundant iterations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSpawnManager = runSpawnManager;
const types_1 = require("./types");
const expansion_1 = require("./expansion");
const remoteMining_1 = require("./remoteMining");
const creepCensus_1 = require("./utils/creepCensus");
/** Compute the total energy cost of a body plan. */
function bodyCost(body) {
    let total = 0;
    for (const part of body) {
        total += types_1.BODY_COST[part];
    }
    return total;
}
/**
 * Choose the next creep role to spawn.
 * Returns null when all target counts are met.
 * Uses the pre-built creep census (no Game.creeps iteration).
 *
 * When `starvingRemote` is true, only consider harvester (skip builder/upgrader)
 * to conserve energy for the remote harvester spawn.
 */
function pickRole(starvingRemote = false) {
    var _a;
    const census = (0, creepCensus_1.getCensus)();
    let bestRole = null;
    let bestPriority = Infinity;
    const rolesToConsider = starvingRemote
        ? ["harvester"]
        : ["harvester", "builder", "upgrader"];
    for (const role of rolesToConsider) {
        const current = (_a = census.roleCounts[role]) !== null && _a !== void 0 ? _a : 0;
        if (current >= types_1.TARGET_COUNTS[role])
            continue;
        const priority = types_1.ROLE_PRIORITY[role];
        if (priority < bestPriority) {
            bestPriority = priority;
            bestRole = role;
        }
    }
    return bestRole;
}
/** Unique incremental id for creep naming. */
let nextId = 1;
/**
 * Try to spawn an expansion or remote-mining creep.
 * Returns true if a spawn was queued.
 */
function trySpawnSpecial(spawn) {
    // 1. Remote mining (remoteHarvester / remoteHauler) — produces energy, try first
    const remoteReq = (0, remoteMining_1.getRemoteMiningSpawnRequest)();
    if (remoteReq) {
        const cost = bodyCost(remoteReq.body);
        if (spawn.room.energyAvailable >= cost) {
            const name = `${remoteReq.role}_${nextId++}_${Game.time}`;
            const ret = spawn.spawnCreep(remoteReq.body, name, {
                memory: { role: remoteReq.role },
            });
            if (ret === OK) {
                (0, remoteMining_1.onRemoteMiningSpawn)(remoteReq.role, name, remoteReq.targetId, remoteReq.homeRoom);
                return true;
            }
        }
    }
    // 2. Expansion (claimer/scout)
    const expReq = (0, expansion_1.getExpansionSpawnRequest)();
    if (expReq) {
        const cost = bodyCost(expReq.body);
        if (spawn.room.energyAvailable >= cost) {
            const name = `${expReq.role}_${nextId++}_${Game.time}`;
            const ret = spawn.spawnCreep(expReq.body, name, {
                memory: { role: expReq.role },
            });
            if (ret === OK) {
                (0, expansion_1.onExpansionSpawn)(expReq.role, name);
                return true;
            }
        }
    }
    return false;
}
/**
 * Return true if any active remote op currently has zero harvesters.
 * Used to boost priority — an op with no harvester produces zero energy
 * and needs urgent attention.
 */
function remoteOpNeedsHarvester() {
    var _a, _b;
    const ops = (_a = Memory.remoteMining) === null || _a === void 0 ? void 0 : _a.ops;
    if (!ops)
        return false;
    for (const key in ops) {
        const op = ops[key];
        if (op.state !== "active")
            continue;
        // Check via census whether any harvester is assigned to this op's sources
        const census = (0, creepCensus_1.getCensus)();
        for (const src of op.sources) {
            if (((_b = census.harvestersBySource[src.id]) !== null && _b !== void 0 ? _b : 0) === 0)
                return true;
        }
    }
    return false;
}
/**
 * Run the spawn manager for a single spawn.
 * Attempts to spawn the highest-priority missing creep.
 *
 * Strategy: interleave base roles with remote-mining spawns.
 * If a remote op is starving (0 harvesters), remote spawns compete
 * every tick.  Otherwise, remote spawns compete every 3rd tick.
 * This avoids the chicken-and-egg deadlock where base roles never
 * fully satisfy and remote mining never starts.
 */
function runSpawn(spawn) {
    var _a;
    if (spawn.spawning)
        return; // already busy
    const census = (0, creepCensus_1.getCensus)();
    const hasHarvester = ((_a = census.roleCounts["harvester"]) !== null && _a !== void 0 ? _a : 0) > 0;
    const starvingRemote = remoteOpNeedsHarvester();
    // Allow remote-mining spawns to compete with base roles:
    //   - every tick if a remote op is starving (0 harvesters)
    //   - every 3rd tick otherwise (but only if we have a harvester)
    const tryRemoteNow = (starvingRemote && hasHarvester) ||
        (hasHarvester && Game.time % 3 === 0);
    if (tryRemoteNow) {
        if (trySpawnSpecial(spawn))
            return;
    }
    // Satisfy base roles (harvester, builder, upgrader) —
    // but if a remote op is starving, only spawn harvesters (not builders/upgraders)
    // to preserve energy for the remote harvester.
    const role = pickRole(starvingRemote);
    if (role) {
        const body = types_1.TIER1_BODIES[role];
        if (!body)
            return;
        const cost = bodyCost(body);
        if (spawn.room.energyAvailable < cost)
            return; // not enough energy
        const name = `${role[0].toUpperCase()}${role.slice(1)}_${nextId++}_${Game.time}`;
        const ret = spawn.spawnCreep(body, name, {
            memory: { role },
        });
        if (ret === OK) {
            // Successfully queued.
        }
        return;
    }
    // Base roles satisfied — try expansion / remote-mining spawns
    trySpawnSpecial(spawn);
}
/**
 * Main entry: run spawn logic for every owned spawn.
 * Called once per tick from the main loop.
 */
function runSpawnManager() {
    for (const name in Game.spawns) {
        runSpawn(Game.spawns[name]);
    }
}
//# sourceMappingURL=spawnManager.js.map