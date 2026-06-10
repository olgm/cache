/**
 * Cache v0.0.4 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 *
 * v0.0.4: Integrated expansion and remote-mining spawn requests.
 * After base roles are satisfied, checks for claimers, scouts,
 * remote harvesters, and remote haulers.
 */
/**
 * Main entry: run spawn logic for every owned spawn.
 * Called once per tick from the main loop.
 */
export declare function runSpawnManager(): void;
