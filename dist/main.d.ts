/**
 * Cache v0.0.1 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache flush
 *   2. Spawn management
 *   3. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */
/**
 * Main loop function — the Screeps runtime calls this every tick.
 */
export declare function loop(): void;
