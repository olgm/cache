/**
 * Cache v0.0.3 — Claimer role.
 *
 * Moves to the target room (stored in creep.memory.targetRoom) and claims
 * the controller.  Once the claim succeeds the creep flags itself as done
 * (creep.memory.claimed = true) and the expansion manager can move on.
 *
 * After claiming the creep switches to upgrading the new controller to
 * kick-start GCL progress in the new room.
 */
export declare function runClaimer(creep: Creep): void;
