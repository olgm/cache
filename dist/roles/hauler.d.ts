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
/**
 * During a source-pipeline outage (every source container dry — a miner gap or a
 * full economy collapse) a hauler should ferry energy from STORAGE to the spawn
 * so the colony keeps spawning. Without this, storage — the colony's largest
 * buffer — cannot fuel recovery (`collect` otherwise only pulls from source
 * containers / piles / tombstones), so a 0-miner collapse escaped only on luck:
 * residual container energy (the 2026-06-27 near-death). True iff storage has
 * energy AND a non-storage sink (spawn / extensions / towers) needs it. Pure +
 * exported for unit testing.
 */
export declare function shouldRefillFromStorage(storageEnergy: number, spawnExtTowerFree: number): boolean;
export declare function runHauler(creep: Creep): void;
