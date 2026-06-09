"use strict";
/**
 * Cache v0.0.1 — Simple tick-scoped cache to avoid repeated Game API calls.
 * All entries are invalidated at the start of each tick.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushCache = flushCache;
exports.cached = cached;
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
//# sourceMappingURL=cache.js.map