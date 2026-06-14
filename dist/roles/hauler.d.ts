/**
 * Cache — Hauler role (logistics).
 *
 * Ferries energy from source containers / dropped piles to where it is needed:
 * spawn & extensions first (so the colony keeps spawning), then towers, then the
 * controller container (upgrader supply), then storage as the overflow buffer.
 * Under attack, towers jump to the front of the queue.
 *
 * Coordination: haulers reserve their target container so two don't converge on
 * the same one — the first to claim it gets it, others pick a different source.
 * The threshold for collection is dynamic: when no container has ≥50 energy, the
 * hauler picks the fullest available (even if < 50) and waits there, eliminating
 * the idle gap that low-WORK miners create during early-game.
 */
export declare function runHauler(creep: Creep): void;
