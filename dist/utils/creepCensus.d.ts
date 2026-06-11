/**
 * Cache v0.0.5 — Creep census.
 *
 * A single pass over Game.creeps per tick that collects all the
 * information every module needs, avoiding 8+ separate O(n) iterations.
 *
 * Invalidation: flushCensus() is called from main.ts at the start of each tick.
 */
export interface CreepCensus {
    /** Count of living creeps per role. */
    roleCounts: Record<string, number>;
    /** True if an unclaimed claimer is alive. */
    hasActiveClaimer: boolean;
    /** True if a scout is alive. */
    hasActiveScout: boolean;
    /** Count of remote harvesters per source id. */
    harvestersBySource: Record<string, number>;
    /** Count of remote haulers per target room name. */
    haulersByRoom: Record<string, number>;
}
/** Invalidate the per-tick census. Call once at the top of the main loop. */
export declare function flushCensus(): void;
/**
 * Return the current tick's creep census.
 * Builds it lazily on first access — but the caller (main.ts) should
 * trigger building via ensureCensus() early to avoid mid-tick build cost.
 */
export declare function getCensus(): CreepCensus;
/** Force-build the census now (call early in main loop). */
export declare function ensureCensus(): CreepCensus;
