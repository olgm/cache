/**
 * Cache — Harvester role (generalist bootstrap).
 *
 * The economy's lifeblood before containers exist: mines the nearest source and
 * delivers straight to spawn/extensions (then towers, then the controller
 * container / storage). Once a source gains a container, dedicated miners +
 * haulers take over and the harvester target count drops to zero, so these
 * generalists naturally age out. Falls back to upgrading if every sink is full,
 * so harvested energy is never wasted.
 *
 * STATIC-MINING IDLE GUARD: when the harvester's assigned source has both a
 * container AND a dedicated miner, the harvester can never win the harvest race
 * — the miner drains the source's full 10 e/tick regeneration every tick, so
 * the harvester would call harvest() → ERR_NOT_ENOUGH_ENERGY → wait → repeat,
 * burning CPU for zero gain.  Instead, the harvester skips mining entirely and
 * simply waits — O(1) CPU vs the harvest()+movement path.  When the target
 * count is 0 (normal post-bootstrap), these harvesters are not replaced and
 * naturally age out after ~1500 ticks.
 */
export declare function runHarvester(creep: Creep): void;
