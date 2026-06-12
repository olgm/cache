/**
 * Cache v0.1.2 — Remote hauler role.
 *
 * Moves between a home room and a remote room, picking up dropped energy
 * from remote harvesters and delivering it to spawn/extension/storage.
 *
 * v0.1.2 improvements:
 *   - Tracks energy delivered in Memory.remoteMining for productivity metrics.
 *   - Picks up energy from tombstones & ruins in the remote room.
 *   - Lowered minimum pickup threshold (20e instead of 50e).
 *   - Uses room-level cached structure list + findClosestByRange instead of
 *     per-creep findClosestByPath in the home room (big CPU saving).
 *   - Caches inter-room paths in creep memory (25-tick reuse).
 *   - Uses findClosestByRange for dropped energy instead of findClosestByPath.
 */
export declare function runRemoteHauler(creep: Creep): void;
