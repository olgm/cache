/**
 * Cache — Builder role.
 *
 * Builds construction sites in a sensible order (spawn → tower → extension →
 * container → storage → road → rampart → wall), and when there is nothing to
 * build, performs light repairs the towers don't cover (decayed roads/containers
 * and freshly-built ramparts). Idle builders help upgrade so they never waste a
 * tick. Gathers energy from buffers (never from spawn/extensions).
 */
export declare function runBuilder(creep: Creep): void;
