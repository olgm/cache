"use strict";
/**
 * Cache v0.0.5 — Creep census.
 *
 * A single pass over Game.creeps per tick that collects all the
 * information every module needs, avoiding 8+ separate O(n) iterations.
 *
 * Invalidation: flushCensus() is called from main.ts at the start of each tick.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushCensus = flushCensus;
exports.getCensus = getCensus;
exports.ensureCensus = ensureCensus;
// ---------------------------------------------------------------------------
// Per-tick state
// ---------------------------------------------------------------------------
let _census = null;
let _censusTick = -1;
/** Invalidate the per-tick census. Call once at the top of the main loop. */
function flushCensus() {
    _census = null;
    _censusTick = -1;
}
/**
 * Return the current tick's creep census.
 * Builds it lazily on first access — but the caller (main.ts) should
 * trigger building via ensureCensus() early to avoid mid-tick build cost.
 */
function getCensus() {
    var _a, _b, _c;
    if (_censusTick === Game.time && _census)
        return _census;
    const census = {
        roleCounts: {},
        hasActiveClaimer: false,
        hasActiveScout: false,
        harvestersBySource: {},
        haulersByRoom: {},
    };
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        const role = c.memory.role;
        if (role) {
            census.roleCounts[role] = ((_a = census.roleCounts[role]) !== null && _a !== void 0 ? _a : 0) + 1;
        }
        if (role === "claimer" && !c.memory.claimed) {
            census.hasActiveClaimer = true;
        }
        if (role === "scout") {
            census.hasActiveScout = true;
        }
        if (role === "remoteHarvester" && c.memory.sourceId) {
            const sid = String(c.memory.sourceId);
            census.harvestersBySource[sid] = ((_b = census.harvestersBySource[sid]) !== null && _b !== void 0 ? _b : 0) + 1;
        }
        if (role === "remoteHauler" && c.memory.targetRoom) {
            census.haulersByRoom[c.memory.targetRoom] =
                ((_c = census.haulersByRoom[c.memory.targetRoom]) !== null && _c !== void 0 ? _c : 0) + 1;
        }
    }
    _census = census;
    _censusTick = Game.time;
    return census;
}
/** Force-build the census now (call early in main loop). */
function ensureCensus() {
    return getCensus();
}
//# sourceMappingURL=creepCensus.js.map