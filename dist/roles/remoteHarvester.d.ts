/**
 * Cache v0.1.1 — Remote harvester role.
 *
 * Moves to a remote source in an adjacent room and harvests energy.
 * Stays at the source and drops energy for the hauler to pick up.
 * Returns home if the source is depleted or the room is hostile.
 *
 * v0.1.1: Added inter-room path caching (25-tick reuse) to avoid
 * per-tick moveTo pathfinding.
 */
export declare function runRemoteHarvester(creep: Creep): void;
