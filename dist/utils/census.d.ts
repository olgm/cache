/**
 * Cache — creep census.
 *
 * One pass over Game.creeps per tick, producing every count the spawn manager
 * and expansion manager need: per-home-room role counts, miners-per-source, and
 * colony-wide role totals. Spawning creeps are already present in Game.creeps,
 * so they are counted — this prevents double-spawning a role mid-spawn.
 */
export interface Census {
    /** homeRoom → role → count. */
    byRoom: Record<string, Record<string, number>>;
    /** homeRoom → total creep count. */
    totalByRoom: Record<string, number>;
    /** sourceId → assigned miner count. */
    minersBySource: Record<string, number>;
    /** Colony-wide role → count. */
    global: Record<string, number>;
}
/** Home room a creep belongs to (memory, falling back to its current room). */
export declare function homeRoomOf(creep: Creep): string;
export declare function buildCensus(): Census;
/** Count of a role assigned to a home room (0 if none). */
export declare function roleCount(census: Census, home: string, role: string): number;
