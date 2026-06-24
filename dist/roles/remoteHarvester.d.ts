/**
 * Cache — Remote harvester role.
 *
 * Travels to an unowned adjacent room, harvests a source, and brings energy back
 * to the home room.  Uses the same travel helper as other roles so path reuse
 * works across ticks.
 *
 * Body: heavy on WORK + CARRY (2:1 ratio of CARRY to WORK), with enough MOVE
 * to stay mobile even on plains — a remote harvester must walk between rooms,
 * so move efficiency matters more than for a static miner.
 */
export declare function runRemoteHarvester(creep: Creep): void;
