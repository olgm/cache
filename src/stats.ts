/**
 * Cache — Memory.stats telemetry writer.
 *
 * SPARSE (the autonomous overseer) steers ENTIRELY off Memory.stats: it polls
 * `GET /api/user/memory?path=stats`, decodes it, and runs its eval + phase model
 * + diagnosis on the result. If the bot does not WRITE Memory.stats every tick,
 * SPARSE is blind and steers on a fossil snapshot — which is exactly what
 * happened (the stats tick froze for days while the bot kept playing). So this
 * MUST run, and it must run every tick.
 *
 * The shape mirrors what SPARSE's `parseStats` reads: a freshness `tick`, nested
 * `gcl`/`cpu`, and per-room `{rcl, rclProgress, income1k, …}`. Only OWNED rooms
 * are reported, so a transient scouted/reserved room (e.g. a one-tick scout
 * outpost) never pollutes the colony-health averages or becomes a phantom
 * "weakest room". The caller wraps this in try/catch, so a stats failure can
 * never break the tick.
 */

import { CacheStats } from "./types";

/** Max energy a source yields per tick (its regen rate: 3000 energy / 300 ticks). */
const SOURCE_MAX_PER_TICK = 10;

/**
 * Estimate a room's CURRENT harvest throughput per ~1000 ticks. For each source,
 * sum the WORK parts of my creeps adjacent to it (each WORK harvests
 * HARVEST_POWER=2 energy/tick), cap at the source regen rate, and scale to a
 * 1000-tick window. A fully-mined source reaches ~10000 — the scale SPARSE's
 * eval treats as "healthy", so this number rises honestly as the economy grows.
 */
function roomIncome1k(room: Room): number {
  let total = 0;
  for (const source of room.find(FIND_SOURCES)) {
    let work = 0;
    for (const creep of source.pos.findInRange(FIND_MY_CREEPS, 1)) {
      work += creep.getActiveBodyparts(WORK);
    }
    total += Math.min(work * HARVEST_POWER, SOURCE_MAX_PER_TICK) * 1000;
  }
  return total;
}

/** Build and persist the Memory.stats telemetry blob for the current tick. */
export function writeStats(): void {
  const creepsByRole: Record<string, number> = {};
  const creepsByRoom: Record<string, number> = {};
  for (const name in Game.creeps) {
    const c = Game.creeps[name];
    const role = (c.memory.role as string) || "unknown";
    creepsByRole[role] = (creepsByRole[role] || 0) + 1;
    creepsByRoom[c.room.name] = (creepsByRoom[c.room.name] || 0) + 1;
  }

  let spawnQueues = 0;
  for (const name in Game.spawns) {
    if (Game.spawns[name].spawning) spawnQueues++;
  }

  const rooms: CacheStats["rooms"] = {};
  for (const name in Game.rooms) {
    const room = Game.rooms[name];
    const ctrl = room.controller;
    // Only OWNED rooms count toward colony health; skip scouted/reserved rooms.
    if (!ctrl || !ctrl.my) continue;
    rooms[name] = {
      rcl: ctrl.level,
      rclProgress: ctrl.progress || 0,
      rclProgressTotal: ctrl.progressTotal || 0,
      energy: room.energyAvailable,
      energyCapacity: room.energyCapacityAvailable,
      storage: room.storage ? room.storage.store[RESOURCE_ENERGY] : 0,
      hostiles: room.find(FIND_HOSTILE_CREEPS).length,
      myCreeps: creepsByRoom[name] || 0,
      income1k: roomIncome1k(room),
    };
  }

  const stats: CacheStats = {
    tick: Game.time,
    time: Date.now(),
    gcl: {
      level: Game.gcl.level,
      progress: Game.gcl.progress,
      progressTotal: Game.gcl.progressTotal,
    },
    gpl: {
      level: Game.gpl.level,
      progress: Game.gpl.progress,
      progressTotal: Game.gpl.progressTotal,
    },
    cpu: {
      used: Game.cpu.getUsed(),
      limit: Game.cpu.limit,
      bucket: Game.cpu.bucket,
    },
    credits: (Game.market && Game.market.credits) || 0,
    shard: (Game.shard && Game.shard.name) || "",
    rooms,
    creepsByRole,
    spawnQueues,
  };

  Memory.stats = stats;
}
