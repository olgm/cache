/**
 * Cache v0.0.5 — Creep census.
 *
 * A single pass over Game.creeps per tick that collects all the
 * information every module needs, avoiding 8+ separate O(n) iterations.
 *
 * Invalidation: flushCensus() is called from main.ts at the start of each tick.
 */

import { CreepRole } from "../types";

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

// ---------------------------------------------------------------------------
// Per-tick state
// ---------------------------------------------------------------------------

let _census: CreepCensus | null = null;
let _censusTick = -1;

/** Invalidate the per-tick census. Call once at the top of the main loop. */
export function flushCensus(): void {
  _census = null;
  _censusTick = -1;
}

/**
 * Return the current tick's creep census.
 * Builds it lazily on first access — but the caller (main.ts) should
 * trigger building via ensureCensus() early to avoid mid-tick build cost.
 */
export function getCensus(): CreepCensus {
  if (_censusTick === Game.time && _census) return _census;

  const census: CreepCensus = {
    roleCounts: {},
    hasActiveClaimer: false,
    hasActiveScout: false,
    harvestersBySource: {},
    haulersByRoom: {},
  };

  for (const name in Game.creeps) {
    const c = Game.creeps[name];
    const role = c.memory.role as CreepRole | undefined;

    if (role) {
      census.roleCounts[role] = (census.roleCounts[role] ?? 0) + 1;
    }

    if (role === "claimer" && !c.memory.claimed) {
      census.hasActiveClaimer = true;
    }
    if (role === "scout") {
      census.hasActiveScout = true;
    }
    if (role === "remoteHarvester" && c.memory.sourceId) {
      const sid = String(c.memory.sourceId);
      census.harvestersBySource[sid] = (census.harvestersBySource[sid] ?? 0) + 1;
    }
    if (role === "remoteHauler" && c.memory.targetRoom) {
      census.haulersByRoom[c.memory.targetRoom] =
        (census.haulersByRoom[c.memory.targetRoom] ?? 0) + 1;
    }
  }

  _census = census;
  _censusTick = Game.time;
  return census;
}

/** Force-build the census now (call early in main loop). */
export function ensureCensus(): CreepCensus {
  return getCensus();
}
