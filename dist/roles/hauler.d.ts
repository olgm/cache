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
 * The threshold for collection is dynamic: when no container has ≥25 energy, the
 * hauler picks the fullest available and waits there, eliminating the idle gap
 * that low-WORK miners create during early-game.
 *
 * Target selection is proximity-weighted: among containers above threshold the
 * hauler picks the CLOSEST one with enough energy, not just the fullest — this
 * cuts travel time and raises throughput.
 */
export declare function runHauler(creep: Creep): void;
