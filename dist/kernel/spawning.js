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
const types_1 = require("../types");
const config_1 = require("../config");
const census_1 = require("../utils/census");
const roomData_1 = require("../utils/roomData");
const expansion_1 = require("../expansion");
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
function runRoom(room, census) {
    const data = (0, roomData_1.getRoomData)(room);
    const idleSpawns = data.spawns.filter((s) => !s.spawning);
    if (idleSpawns.length === 0)
        return;
    const targets = (0, config_1.roleTargets)(data, census.byRoom[room.name] || {});
    // Per-tick reservations so two idle spawns don't duplicate a role / source.
    const reserved = {};
    const reservedSources = new Set();
    for (const spawn of idleSpawns) {
        // 1. Emergency: the delivery pipeline has collapsed — recover NOW.
        if (needsEmergency(room.name, census, reserved)) {
            if (spawnEmergency(spawn, room, data))
                bump(reserved, "harvester");
            continue;
        }
        // 2. Economy roles, by priority.
        const role = pickEconomyRole(targets, census, room.name, reserved);
        if (role) {
            if (trySpawnRole(spawn, room, data, role, census, reserved, reservedSources)) {
                bump(reserved, role);
            }
            continue;
        }
        // 3. Expansion (scout / claimer / pioneer) once the economy is satisfied.
        const req = (0, expansion_1.getExpansionSpawnRequest)(room, data);
        if (req && data.energyAvailable >= bodyCost(req.body)) {
            spawnRequest(spawn, req);
        }
    }
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
 */
function pickEconomyRole(targets, census, home, reserved) {
    const roles = Object.keys(targets).filter((r) => (targets[r] || 0) > 0);
    roles.sort((a, b) => config_1.ROLE_PRIORITY[a] - config_1.ROLE_PRIORITY[b]);
    for (const role of roles) {
        const want = targets[role] || 0;
        const have = (0, census_1.roleCount)(census, home, role) + (reserved[role] || 0);
        if (have < want)
            return role;
    }
    return null;
}
function trySpawnRole(spawn, room, data, role, census, reserved, reservedSources) {
    // Bootstrap regime: until a source container exists (static mining), the colony
    // often cannot fill its full energy capacity — yet insisting on a capacity-sized
    // body means the next economy creep (critically, a BUILDER) never becomes
    // affordable, so the source containers never get built and the bootstrap never
    // ends. While bootstrapping, size to energy ON HAND (like the emergency path) so
    // the workforce keeps growing; revert to capacity-sized creeps for efficiency
    // once static mining is online.
    const bootstrapping = data.sources.every((s) => !s.container);
    const budget = bootstrapping
        ? Math.max(types_1.BODY_COST.work + types_1.BODY_COST.carry + types_1.BODY_COST.move, data.energyAvailable)
        : data.energyCapacity;
    const body = (0, config_1.bodyForRole)(role, budget, data.rcl);
    if (data.energyAvailable < bodyCost(body))
        return false; // can't afford even this
    const memory = { role, homeRoom: room.name };
    if (role === "miner") {
        const sid = pickFreeContainerSource(data, census, reservedSources);
        if (!sid)
            return false;
        memory.sourceId = sid;
        reservedSources.add(sid);
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