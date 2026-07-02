"use strict";
/**
 * Cache — Spawn manager (per-room, prioritized, self-healing).
 *
 * For each owned room with a free spawn it spawns the highest-priority missing
 * creep, sizing the body to the room's full energy capacity (so creeps grow with
 * the colony) and waiting until that body is affordable rather than producing
 * runts. The exception is the emergency path: if the room's energy-delivery
 * pipeline has collapsed (no harvesters AND no miners-or-haulers), it
 * immediately spawns a self-sufficient harvester sized to whatever energy is on
 * hand — the safety net that lets a colony recover from a wipe.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSpawnManager = runSpawnManager;
exports.pickEconomyRole = pickEconomyRole;
exports.economyBudget = economyBudget;
const types_1 = require("../types");
const config_1 = require("../config");
const census_1 = require("../utils/census");
const roomData_1 = require("../utils/roomData");
const expansion_1 = require("../expansion");
const remoteMining_1 = require("./remoteMining");
let nextId = 0;
function bodyCost(body) {
    let c = 0;
    for (const p of body)
        c += types_1.BODY_COST[p];
    return c;
}
function runSpawnManager() {
    const census = (0, census_1.buildCensus)();
    for (const room of (0, roomData_1.myRooms)()) {
        try {
            runRoom(room, census);
        }
        catch (e) {
            console.log(`CACHE spawn error in ${room.name}: ${e === null || e === void 0 ? void 0 : e.message}`);
        }
    }
}
/**
 * Consecutive ticks the spawn may want a creep it cannot afford before it gives
 * up waiting and builds a smaller, affordable one. Long enough that a healthy
 * room's normal refill wait never trips it; short enough to escape a population
 * collapse in minutes rather than hours.
 */
const SPAWN_STALL_LIMIT = 50;
function runRoom(room, census) {
    const data = (0, roomData_1.getRoomData)(room);
    // A spawn that is mid-build is making progress — never count it as stalled.
    if (data.spawns.some((s) => s.spawning))
        room.memory.spawnStall = 0;
    const idleSpawns = data.spawns.filter((s) => !s.spawning);
    if (idleSpawns.length === 0)
        return;
    const targets = (0, config_1.roleTargets)(data, census.byRoom[room.name] || {});
    // Merge the remoteHarvester target into the economy role targets so it competes
    // by priority (priority 4.5, between builder and upgrader) instead of being gated
    // behind a fully-satisfied economy.  Without this, the spawn loop never reaches
    // step 3 (remote mining) when any economy role is under target — the common
    // case where upgraders are perpetually 1-2 below their desired count, blocking
    // remoteHarvester spawning forever.
    const remoteTarget = (0, remoteMining_1.remoteHarvesterTargetForRoom)(room);
    if (remoteTarget > 0)
        targets.remoteHarvester = remoteTarget;
    // Merge pioneer target when an expansion room needs bootstrapping.  Pioneers
    // must compete in the economy priority order (at priority 3, above builders
    // and upgraders).  Gating them behind a fully-satisfied economy (old step 3)
    // starved W44N38 of its first spawn for thousands of ticks: the home room
    // perpetually wanted one more upgrader, so the spawn never reached the
    // expansion step, and the claimed room sat at RCL 1 with zero pioneers.
    // PIONEERS_PER_ROOM (3) is defined in expansion.ts; we replicate it here to
    // keep the spawning module self-contained.
    const PIONEERS_PER_ROOM = 3;
    const expMem = Memory.expansion;
    if (expMem && expMem.state === "bootstrapping" && expMem.targetRoom) {
        let pioneersForTarget = 0;
        for (const name in Game.creeps) {
            const c = Game.creeps[name];
            if (c.memory.role === "pioneer" && c.memory.targetRoom === expMem.targetRoom) {
                pioneersForTarget++;
            }
        }
        if (pioneersForTarget < PIONEERS_PER_ROOM) {
            targets.pioneer = PIONEERS_PER_ROOM;
        }
    }
    // Per-tick reservations so two idle spawns don't duplicate a role / source.
    const reserved = {};
    const reservedSources = new Set();
    // Recovery: the spawn has wanted a creep it could not afford for too long
    // (a hauler/population collapse). Size bodies to energy on hand until it gets
    // going again, so it never idles forever waiting for a body it can't fund.
    const recovering = (room.memory.spawnStall || 0) >= SPAWN_STALL_LIMIT;
    // Did the spawn want an economy creep this tick but fail to afford it?
    let stuck = false;
    for (const spawn of idleSpawns) {
        // 1. Emergency: the delivery pipeline has collapsed — recover NOW.
        if (needsEmergency(room.name, census, reserved)) {
            if (spawnEmergency(spawn, room, data))
                bump(reserved, "harvester");
            else
                stuck = true;
            continue;
        }
        // 2. Economy roles + remoteHarvester, by priority.
        const role = pickEconomyRole(targets, census, room.name, reserved);
        if (role) {
            if (trySpawnRole(spawn, room, data, role, census, reserved, reservedSources, recovering)) {
                bump(reserved, role);
            }
            else {
                stuck = true;
            }
            continue;
        }
        // 3. Expansion (scout / claimer / pioneer) once the economy is satisfied.
        const req = (0, expansion_1.getExpansionSpawnRequest)(room, data);
        if (req && data.energyAvailable >= bodyCost(req.body)) {
            spawnRequest(spawn, req);
        }
    }
    // Count consecutive stalled ticks; any successful spawn (or nothing wanted)
    // clears it. Crossing SPAWN_STALL_LIMIT flips on recovery sizing next tick.
    room.memory.spawnStall = stuck ? (room.memory.spawnStall || 0) + 1 : 0;
}
// ---------------------------------------------------------------------------
// Emergency bootstrap
// ---------------------------------------------------------------------------
/**
 * True when no one can refill the spawn: there are zero harvesters AND
 * (zero miners OR zero haulers). In either case energy stops reaching the spawn,
 * so we must spawn a self-sufficient harvester immediately.
 */
function needsEmergency(home, census, reserved) {
    const harvesters = (0, census_1.roleCount)(census, home, "harvester") + (reserved.harvester || 0);
    if (harvesters > 0)
        return false;
    const miners = (0, census_1.roleCount)(census, home, "miner") + (reserved.miner || 0);
    const haulers = (0, census_1.roleCount)(census, home, "hauler") + (reserved.hauler || 0);
    return miners === 0 || haulers === 0;
}
function spawnEmergency(spawn, room, data) {
    // Size to energy ON HAND (don't wait for capacity we can't fill).
    const budget = Math.max(types_1.BODY_COST.work + types_1.BODY_COST.carry + types_1.BODY_COST.move, data.energyAvailable);
    const body = (0, config_1.bodyForRole)("harvester", budget, data.rcl);
    if (data.energyAvailable < bodyCost(body))
        return false;
    return spawn.spawnCreep(body, name("harvester"), {
        memory: { role: "harvester", homeRoom: room.name, bootstrap: true },
    }) === OK;
}
// ---------------------------------------------------------------------------
// Economy roles
// ---------------------------------------------------------------------------
/**
 * Pick the highest-priority role this room is under target on (or null if all
 * are satisfied). Exported for unit testing — it is the seam where the
 * ROLE_PRIORITY ordering decides whether builders ever get spawned ahead of the
 * upgrader fleet (see spawn-priority.test).
 *
 * Includes four starvation guards that prevent higher-priority roles from
 * consuming every spawn cycle forever:
 *
 * 1. Builder-starvation guard: when construction sites exist and zero builders
 *    are alive or reserved, builder priority is temporarily elevated to 1.5
 *    (above hauler at 2, below miner at 1) so at least one builder spawns.
 *
 * 2. Storage-emergency guard: when a room at RCL 4+ has no built storage, the
 *    builder corps is elevated to 1.5 until the FULL builder target is met
 *    (not just until the first builder), so the 2-3 builders needed for a
 *    30 000-energy storage actually materialise.
 *
 * 3. Bootstrapping-pioneer guard: when the expansion system is actively
 *    bootstrapping a claimed room with no spawn, pioneer priority is elevated
 *    to 1.2 (above storage-emergency builder at 1.5 and hauler at 2, below
 *    miner at 1) so pioneers are not starved by the home room's demands.
 *
 * 4. Upgrader-starvation guard: when GCL ≤ 2 (every control point gates
 *    multi-room expansion) and the upgrader corps is below a minimum floor
 *    (scaled by RCL), upgrader priority is temporarily elevated to 2.5 (above
 *    hauler at 2, below miner at 1) so at least the floor count of upgraders
 *    is maintained.  Without this, a hauler target that is perpetually 2-3
 *    short of its ceiling (the common RCL 5 state) consumes every spawn cycle
 *    and the upgrader count never reaches even its modest floor — control
 *    points flatline, GCL stalls, and the colony deadlocks.  Once the floor is
 *    reached the guard deactivates and normal ordering resumes.
 */
function pickEconomyRole(targets, census, home, reserved) {
    var _a, _b, _c, _d, _e;
    const roles = Object.keys(targets).filter((r) => (targets[r] || 0) > 0);
    // Builder-starvation guard: when construction sites exist and no builder is
    // alive or reserved this tick, temporarily elevate builder priority so at
    // least one builder gets spawned to work the sites.
    const builderTarget = targets.builder || 0;
    const builderCount = (0, census_1.roleCount)(census, home, "builder") + (reserved.builder || 0);
    const builderStarved = builderTarget > 0 && builderCount === 0;
    // Storage-emergency guard: when a room at RCL 4+ has no storage, the builder
    // corps must be elevated above haulers in spawn priority until the FULL
    // builder target is met, not just until one builder exists.  Without this,
    // the builder-starvation guard deactivates the moment a single builder spawns,
    // builder drops to priority 4, and hauler (priority 2) consumes every spawn
    // cycle — so the 2-3 builders needed to finish a 30 000-energy storage never
    // materialise, and storage sits at progress 0 forever.  Once storage exists
    // the guard deactivates and normal priority ordering resumes.
    // Guarded behind a typeof check for Node.js test compatibility.
    let storageEmergency = false;
    if (typeof Game !== "undefined") {
        const room = Game.rooms[home];
        const rcl = (_b = (_a = room === null || room === void 0 ? void 0 : room.controller) === null || _a === void 0 ? void 0 : _a.level) !== null && _b !== void 0 ? _b : 0;
        const hasStorage = !!(room === null || room === void 0 ? void 0 : room.storage);
        storageEmergency = rcl >= 4 && !hasStorage && builderTarget > 0 && builderCount < builderTarget;
    }
    // Bootstrapping-pioneer guard: when the expansion system is actively
    // bootstrapping a claimed room that has no spawn, pioneer priority is
    // elevated above hauler so the home room's hauler demand doesn't starve
    // the expansion.  At 1.7, pioneer beats hauler (2) but still loses to a
    // storage-emergency builder (1.5) — home construction wins, then pioneers
    // get the next spawn cycle.  Without this, W44N38 sits at RCL 1 with zero
    // pioneers forever because the home room perpetually needs one more hauler.
    // Guarded behind a typeof check for Node.js test compatibility.
    let bootstrappingPioneer = false;
    if (typeof Game !== "undefined") {
        const pioneerTarget = targets.pioneer || 0;
        const pioneerCount = (0, census_1.roleCount)(census, home, "pioneer") + (reserved.pioneer || 0);
        bootstrappingPioneer =
            (((_c = Memory.expansion) === null || _c === void 0 ? void 0 : _c.state) === "bootstrapping") &&
                pioneerTarget > 0 &&
                pioneerCount < pioneerTarget;
    }
    // Upgrader-starvation guard: when GCL is low (≤ 2) every control point
    // gates expansion — maintain a minimum upgrader corps so control points
    // keep flowing even while higher-priority roles (haulers) are under target.
    const upgraderTarget = targets.upgrader || 0;
    const upgraderCount = (0, census_1.roleCount)(census, home, "upgrader") + (reserved.upgrader || 0);
    // Minimum floor: at RCL ≥ 5 the economy is mature enough to feed 3 upgraders
    // without strain; at RCL 3-4, 2; at RCL 1-2 the GCL push already elevates
    // the target through config.ts, so we use a lower floor.
    // Guarded behind a typeof check so the function remains callable in Node.js
    // test environments where the Screeps `Game` global does not exist.
    let upgraderStarved = false;
    if (typeof Game !== "undefined") {
        const room = Game.rooms[home];
        const rcl = (_e = (_d = room === null || room === void 0 ? void 0 : room.controller) === null || _d === void 0 ? void 0 : _d.level) !== null && _e !== void 0 ? _e : 0;
        const upgraderFloor = rcl >= 5 ? 3 : rcl >= 3 ? 2 : 1;
        upgraderStarved =
            Game.gcl.level <= 2 && upgraderTarget > 0 && upgraderCount < upgraderFloor;
    }
    roles.sort((a, b) => {
        let pa = config_1.ROLE_PRIORITY[a];
        let pb = config_1.ROLE_PRIORITY[b];
        if (builderStarved || storageEmergency) {
            // Elevate builder to 1.5: above hauler(2) + pioneer(3), below miner(1).
            // The storageEmergency variant fires until the full target is met, not
            // just until the first builder spawns, so storage construction gets the
            // full builder corps it needs.
            if (a === "builder")
                pa = 1.5;
            if (b === "builder")
                pb = 1.5;
        }
        if (bootstrappingPioneer) {
            // Elevate pioneer to 1.2: above storage-emergency builder(1.5) AND
            // hauler(2), below miner(1).  A claimed room without a spawn generates
            // ZERO control points and eventually downgrades — the pioneer that
            // builds the spawn unlocks the new room's entire economy, which is a
            // force-multiplier worth more than one extra builder cycle in the home
            // room.  Once the spawn exists the bootstrapping state resolves and
            // the priority bump deactivates.
            if (a === "pioneer")
                pa = 1.2;
            if (b === "pioneer")
                pb = 1.2;
        }
        if (upgraderStarved) {
            // Elevate upgrader to 2.5: above hauler(2), below miner(1).
            // Builder at 1.5 (when starved) still outranks upgrader at 2.5,
            // so construction-critical builders always come first.
            if (a === "upgrader")
                pa = 2.5;
            if (b === "upgrader")
                pb = 2.5;
        }
        return pa - pb;
    });
    for (const role of roles) {
        const want = targets[role] || 0;
        const have = (0, census_1.roleCount)(census, home, role) + (reserved[role] || 0);
        if (have < want)
            return role;
    }
    return null;
}
/**
 * Spawn-energy budget for a normal economy creep.
 *
 * Capacity-sized (energyCapacityAvailable) in normal operation — bigger creeps
 * are more efficient, and a healthy hauler fleet keeps the spawn topped up so we
 * can afford them. But sized to energy ON HAND in two cases where waiting for a
 * full body would stall forever:
 *   - bootstrap: no source container yet, so the room cannot fill its capacity;
 *   - degraded: post-bootstrap but the hauler fleet has collapsed to zero, so
 *     energy no longer reaches the spawn (immediate trigger);
 *   - recovering: the spawn has been stalled (wanting an unaffordable creep) past
 *     SPAWN_STALL_LIMIT — the robust escape that also covers a partial collapse
 *     (e.g. one tiny hauler), where `degraded` has already switched off but the
 *     room still can't fill a capacity body. Without it the colony plateaus at a
 *     few creeps for hours (the observed RCL5 collapse: a full-capacity body of
 *     1800 was unaffordable, so nothing spawned and nothing recovered).
 * In all three, sizing to available lets the spawn produce a smaller creep NOW,
 * which restarts energy flow and recovers (mirrors the emergency-bootstrap path).
 */
function economyBudget(data, haulers, recovering) {
    const bootstrapping = data.sources.every((s) => !s.container);
    const degraded = !bootstrapping && haulers === 0;
    if (bootstrapping || degraded || recovering) {
        return Math.max(types_1.BODY_COST.work + types_1.BODY_COST.carry + types_1.BODY_COST.move, data.energyAvailable);
    }
    return data.energyCapacity;
}
function trySpawnRole(spawn, room, data, role, census, reserved, reservedSources, recovering) {
    // Size the body to what the colony can actually fund right now (see
    // economyBudget): capacity-sized in normal operation, but sized to energy on
    // hand during bootstrap, a hauler collapse, or a prolonged stall.
    //
    // CRITICAL FALLBACK: when the capacity budget produces a body the spawn cannot
    // yet afford, we retry with an available-energy budget immediately instead of
    // waiting for the 50-tick stall recovery.  The stall counter is reset every
    // time ANY creep spawns (e.g. replacing a dying builder), so a room that can
    // always fund a 300e builder but never an 1800e upgrader would cycle forever
    // — the spawn would never reach recovery and zero upgraders would be spawned
    // (the observed "RCL 5, 0 upgraders" pathology).
    const haulers = (0, census_1.roleCount)(census, room.name, "hauler") + (reserved.hauler || 0);
    const budget = economyBudget(data, haulers, recovering);
    let body = (0, config_1.bodyForRole)(role, budget, data.rcl);
    if (data.energyAvailable < bodyCost(body)) {
        // Fall back to an available-energy body: a smaller creep NOW is infinitely
        // better than an idle spawn waiting for capacity it may never reach.
        body = (0, config_1.bodyForRole)(role, data.energyAvailable, data.rcl);
    }
    if (data.energyAvailable < bodyCost(body))
        return false; // can't afford even the minimal body
    const memory = { role, homeRoom: room.name };
    if (role === "miner") {
        const sid = pickFreeContainerSource(data, census, reservedSources);
        if (!sid)
            return false;
        memory.sourceId = sid;
        reservedSources.add(sid);
    }
    if (role === "remoteHarvester") {
        // Remote harvesters need sourceId and targetRoom so the role runner knows
        // where to mine and where to deliver.  Without these the creep idles
        // forever — the runtime symptom of the bug this block fixes.
        const rmMem = (0, remoteMining_1.ensureRemoteMiningMemory)(room.name);
        const source = (0, remoteMining_1.pickRemoteSource)(room.name, rmMem);
        if (!source)
            return false;
        memory.sourceId = source.id;
        memory.targetRoom = source.room;
    }
    if (role === "pioneer") {
        // Pioneers need targetRoom so they travel to the expansion room.
        // This is normally set by getExpansionSpawnRequest, but when pioneers
        // compete in the economy priority loop (above) they come through
        // trySpawnRole directly — the expansion memory is the source of truth.
        const expMem = Memory.expansion;
        if (expMem && expMem.targetRoom) {
            memory.targetRoom = expMem.targetRoom;
        }
    }
    return spawn.spawnCreep(body, name(role), { memory }) === OK;
}
/** A source with a container but no miner assigned (and not reserved this tick). */
function pickFreeContainerSource(data, census, reservedSources) {
    for (const sd of data.sources) {
        if (!sd.container)
            continue;
        const id = sd.source.id;
        if ((census.minersBySource[id] || 0) > 0)
            continue;
        if (reservedSources.has(id))
            continue;
        return id;
    }
    return null;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function spawnRequest(spawn, req) {
    spawn.spawnCreep(req.body, name(req.memory.role), { memory: req.memory });
}
function name(role) {
    return `${role}_${Game.time}_${nextId++}`;
}
function bump(reserved, role) {
    reserved[role] = (reserved[role] || 0) + 1;
}
//# sourceMappingURL=spawning.js.map