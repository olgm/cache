/**
 * Cache — Pioneer role.
 *
 * Bootstraps a freshly-claimed room: travels there, mines the local sources, and
 * builds construction sites — most importantly the first spawn (placed by the
 * construction planner). When there's nothing to build it upgrades the
 * controller so the room doesn't downgrade. Once the room has its own spawn the
 * expansion manager stops sending pioneers and the new colony runs itself.
 */
export declare function runPioneer(creep: Creep): void;
