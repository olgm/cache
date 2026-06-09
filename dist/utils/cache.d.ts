/**
 * Cache v0.0.1 — Simple tick-scoped cache to avoid repeated Game API calls.
 * All entries are invalidated at the start of each tick.
 */
/** Call once per tick to invalidate stale entries. */
export declare function flushCache(): void;
/** Cache-averse get: stores result of fn under key for the remainder of the tick. */
export declare function cached<T>(key: string, fn: () => T): T;
