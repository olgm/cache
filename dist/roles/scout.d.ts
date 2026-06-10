/**
 * Cache v0.0.3 — Scout role.
 *
 * Travels to the target room (creep.memory.targetRoom), records intel via
 * the expansion manager, and returns or scouts the next unknown adjacent
 * room.  Scouts are cheap MOVE-only creeps designed to be disposable.
 */
export declare function runScout(creep: Creep): void;
