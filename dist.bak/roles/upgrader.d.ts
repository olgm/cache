/**
 * Cache — Upgrader role.
 *
 * Fills from the controller container (its dedicated supply) when present, then
 * the general energy pool, and upgrades the room controller. Controller upgrades
 * are what earn both RCL and GCL progress, so a healthy economy keeps several
 * upgraders busy — the target count scales with surplus (storage) energy.
 *
 * Key design: when the controller container exists, the upgrader parks beside it
 * even when empty — walking across the room to a source container costs ticks
 * that are better spent waiting for the next hauler delivery.  The controller
 * container is the most efficient supply path because haulers bring energy right
 * to the upgrader's workstation.
 *
 * Starvation guard: if the upgrader has been parked at the controller container
 * for too long without energy arriving (haulers are behind or dead), it times
 * out and gathers from elsewhere rather than idling forever.  The idle counter
 * resets as soon as the creep picks up any energy, even a single tick's worth.
 */
export declare function runUpgrader(creep: Creep): void;
