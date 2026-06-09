/**
 * Cache v0.0.1 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 */
/**
 * Main entry: run spawn logic for every owned spawn.
 * Called once per tick from the main loop.
 */
export declare function runSpawnManager(): void;
