/**
 * Cache v0.0.1 — Simple tick-scoped cache to avoid repeated Game API calls.
 * All entries are invalidated at the start of each tick.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, any>();

let currentTick = 0;

/** Call once per tick to invalidate stale entries. */
export function flushCache(): void {
  if (Game.time !== currentTick) {
    store.clear();
    currentTick = Game.time;
  }
}

/** Cache-averse get: stores result of fn under key for the remainder of the tick. */
export function cached<T>(key: string, fn: () => T): T {
  flushCache();
  if (store.has(key)) return store.get(key) as T;
  const val = fn();
  store.set(key, val);
  return val;
}
