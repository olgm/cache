/**
 * Cache — Hauler role (logistics).
 *
 * Ferries energy from source containers / dropped piles to where it is needed:
 * spawn & extensions first (so the colony keeps spawning), then towers, then the
 * controller container (upgrader supply), then storage as the overflow buffer.
 * Under attack, towers jump to the front of the queue.
 */
export declare function runHauler(creep: Creep): void;
