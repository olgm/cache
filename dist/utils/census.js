"use strict";
/**
 * Cache — creep census.
 *
 * One pass over Game.creeps per tick, producing every count the spawn manager
 * and expansion manager need: per-home-room role counts, miners-per-source, and
 * colony-wide role totals. Spawning creeps are already present in Game.creeps,
 * so they are counted — this prevents double-spawning a role mid-spawn.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeRoomOf = homeRoomOf;
exports.buildCensus = buildCensus;
exports.roleCount = roleCount;
let _census = null;
let _tick = -1;
/** Home room a creep belongs to (memory, falling back to its current room). */
function homeRoomOf(creep) {
    return creep.memory.homeRoom || creep.room.name;
}
function buildCensus() {
    if (_tick === Game.time && _census)
        return _census;
    const census = {
        byRoom: {},
        totalByRoom: {},
        minersBySource: {},
        global: {},
    };
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        const role = c.memory.role;
        if (!role)
            continue;
        const home = homeRoomOf(c);
        if (!census.byRoom[home])
            census.byRoom[home] = {};
        census.byRoom[home][role] = (census.byRoom[home][role] || 0) + 1;
        census.totalByRoom[home] = (census.totalByRoom[home] || 0) + 1;
        census.global[role] = (census.global[role] || 0) + 1;
        if (role === "miner" && c.memory.sourceId) {
            const sid = c.memory.sourceId;
            census.minersBySource[sid] = (census.minersBySource[sid] || 0) + 1;
        }
    }
    _census = census;
    _tick = Game.time;
    return census;
}
/** Count of a role assigned to a home room (0 if none). */
function roleCount(census, home, role) {
    const r = census.byRoom[home];
    return (r && r[role]) || 0;
}
//# sourceMappingURL=census.js.map