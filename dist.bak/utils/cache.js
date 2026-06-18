"use strict";
/**
 * Cache v0.0.2 — Tick-scoped cache + room-level structure caching.
 * All entries are invalidated at the start of each tick.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushCache = flushCache;
exports.cached = cached;
exports.F_ENERGY_SINK = F_ENERGY_SINK;
exports.roomStructures = roomStructures;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map();
let currentTick = 0;
/** Call once per tick to invalidate stale entries. */
function flushCache() {
    if (Game.time !== currentTick) {
        store.clear();
        currentTick = Game.time;
    }
}
/** Cache-averse get: stores result of fn under key for the remainder of the tick. */
function cached(key, fn) {
    flushCache();
    if (store.has(key))
        return store.get(key);
    const val = fn();
    store.set(key, val);
    return val;
}
// ---------------------------------------------------------------------------
// Room-level structure caching
// ---------------------------------------------------------------------------
/** Filter: structures that accept energy (spawns + extensions). */
function F_ENERGY_SINK(s) {
    return ((s.structureType === STRUCTURE_SPAWN ||
        s.structureType === STRUCTURE_EXTENSION) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
}
/**
 * Return a cached array of my structures in the room matching a filter.
 * Cached per-room per-tick to avoid repeated find() calls.
 */
function roomStructures(room, filter) {
    const key = `rs_${room.name}`;
    // Cached structures per room (unfiltered)
    let all = store.get(key);
    if (!all) {
        all = room.find(FIND_MY_STRUCTURES);
        store.set(key, all);
    }
    // Filter from cached list
    return all.filter(filter);
}
//# sourceMappingURL=cache.js.map