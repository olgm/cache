/**
 * Cache v0.0.2 — Tick-scoped cache + room-level structure caching.
 * All entries are invalidated at the start of each tick.
 */
/** Call once per tick to invalidate stale entries. */
export declare function flushCache(): void;
/** Cache-averse get: stores result of fn under key for the remainder of the tick. */
export declare function cached<T>(key: string, fn: () => T): T;
/** Filter: structures that accept energy (spawns + extensions). */
export declare function F_ENERGY_SINK(s: AnyOwnedStructure): boolean;
/**
 * Return a cached array of my structures in the room matching a filter.
 * Cached per-room per-tick to avoid repeated find() calls.
 */
export declare function roomStructures(room: Room, filter: (s: AnyOwnedStructure) => boolean): AnyOwnedStructure[];
