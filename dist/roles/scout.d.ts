/**
 * Cache — Scout role.
 *
 * A disposable 1-MOVE creep that maps the rooms adjacent to its home, recording
 * intel the expansion manager uses to pick a claim target. When every neighbour
 * has fresh intel it idles at home (cheap) until the intel goes stale, then
 * resumes — so we don't respawn scouts needlessly.
 */
export declare function runScout(creep: Creep): void;
