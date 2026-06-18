/**
 * Cache — Claimer role.
 *
 * Travels to its target room and claims the controller, then helps upgrade it
 * (signalling presence and starting RCL progress) until it expires. The
 * expansion gate guarantees GCL headroom before a claimer is ever spawned, so a
 * claim should always succeed.
 */
export declare function runClaimer(creep: Creep): void;
