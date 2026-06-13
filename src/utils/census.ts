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

let _census: Census | null = null;
let _tick = -1;

/** Home room a creep belongs to (memory, falling back to its current room). */
export function homeRoomOf(creep: Creep): string {
  return creep.memory.homeRoom || creep.room.name;
}

export function buildCensus(): Census {
  if (_tick === Game.time && _census) return _census;

  const census: Census = {
    byRoom: {},
    totalByRoom: {},
    minersBySource: {},
    global: {},
  };

  for (const name in Game.creeps) {
    const c = Game.creeps[name];
    const role = c.memory.role;
    if (!role) continue;
    const home = homeRoomOf(c);

    if (!census.byRoom[home]) census.byRoom[home] = {};
    census.byRoom[home][role] = (census.byRoom[home][role] || 0) + 1;
    census.totalByRoom[home] = (census.totalByRoom[home] || 0) + 1;
    census.global[role] = (census.global[role] || 0) + 1;

    if (role === "miner" && c.memory.sourceId) {
      const sid = c.memory.sourceId as string;
      census.minersBySource[sid] = (census.minersBySource[sid] || 0) + 1;
    }
  }

  _census = census;
  _tick = Game.time;
  return census;
}

/** Count of a role assigned to a home room (0 if none). */
export function roleCount(census: Census, home: string, role: string): number {
  const r = census.byRoom[home];
  return (r && r[role]) || 0;
}
