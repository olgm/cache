/**
 * Cache v0.2.0 — Remote scout role.
 *
 * Cheap MOVE-only creep dispatched by the remote-mining manager to
 * visit adjacent rooms and cache source info (knownSources) so that
 * remote ops can start even when the room goes dark.
 *
 * Behavior:
 *   1. Move to target room (creep.memory.targetRoom).
 *   2. On arrival, record all sources into Memory.remoteMining.knownSources.
 *   3. Pick the next unexplored adjacent room — or if none remain, return
 *      home and recycle/suicide.
 */
export declare function runRemoteScout(creep: Creep): void;
