/**
 * Cache — Miner role (static container mining).
 *
 * A miner is assigned to one source (creep.memory.sourceId) and parks on the
 * container beside it, harvesting continuously. With ~5 WORK it drains the
 * source's full 10 energy/tick. Energy is transferred into the container (and
 * overflow drops onto its tile, where haulers pick it up), so the miner itself
 * never travels to base — that is the hauler's job. This decoupling is what lets
 * the economy scale past a handful of tiny generalists.
 */
export declare function runMiner(creep: Creep): void;
