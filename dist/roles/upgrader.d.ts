/**
 * Cache v0.1.0 — Upgrader role.
 *
 * Withdraws energy from the best available source (dropped → storage/container
 * → spawn/extensions) and upgrades the room controller.
 *
 * CPU optimisations:
 *   - Path caching (25-tick reuse) avoids per-tick pathfinding.
 *   - Cached room structure lookups replace findClosestByPath.
 *   - findClosestByRange used for final source selection within a room.
 *   - Dropped energy checked first (cheapest pickup, zero withdraw cost).
 */
export declare function runUpgrader(creep: Creep): void;
