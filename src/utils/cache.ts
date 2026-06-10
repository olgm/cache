/**
 * Cache v0.0.2 — Tick-scoped cache + room-level structure caching.
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

// ---------------------------------------------------------------------------
// Room-level structure caching
// ---------------------------------------------------------------------------

/** Filter: structures that accept energy (spawns + extensions). */
export function F_ENERGY_SINK(s: AnyOwnedStructure): boolean {
  return (
    (s.structureType === STRUCTURE_SPAWN ||
      s.structureType === STRUCTURE_EXTENSION) &&
    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  );
}

/**
 * Return a cached array of my structures in the room matching a filter.
 * Cached per-room per-tick to avoid repeated find() calls.
 */
export function roomStructures(
  room: Room,
  filter: (s: AnyOwnedStructure) => boolean,
): AnyOwnedStructure[] {
  const key = `rs_${room.name}`;
  // Cached structures per room (unfiltered)
  let all = store.get(key) as AnyOwnedStructure[] | undefined;
  if (!all) {
    all = room.find(FIND_MY_STRUCTURES);
    store.set(key, all);
  }
  // Filter from cached list
  return all.filter(filter);
}
