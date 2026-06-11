/**
 * Cache v0.0.5 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 *
 * v0.0.5: Uses creep census (single Game.creeps pass) instead of
 * per-role countRole() loops. Eliminates 3 redundant iterations.
 */
/**
 * Main entry: run spawn logic for every owned spawn.
 * Called once per tick from the main loop.
 */
export declare function runSpawnManager(): void;
