/**
 * Cache v0.0.5 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache & census flush
 *   2. Expansion & remote-mining maintenance
 *   3. Spawn management (includes expansion/remote requests)
 *   4. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */
/**
 * Main loop function — the Screeps runtime calls this every tick.
 */
export declare function loop(): void;
