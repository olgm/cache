/**
 * Cache — economy tunables: dynamic body builders + RCL-scaled role targets.
 *
 * Bodies scale with `energyCapacityAvailable` (so creeps grow as the room builds
 * extensions), and target counts scale with RCL, source/container count, storage
 * energy and construction load. This is the single biggest lever for climbing
 * out of the "5 tiny creeps forever" trap the old hardcoded plan was stuck in.
 */

import { BODY_COST, CreepRole } from "./types";
import { RoomData } from "./utils/roomData";

/** Hard limit: a creep may have at most 50 body parts. */
const MAX_PARTS = 50;

function unitCost(unit: BodyPartConstant[]): number {
  let c = 0;
  for (const p of unit) c += BODY_COST[p];
  return c;
}

/**
 * Repeat a unit pattern as many times as `budget` energy and `maxRepeat` allow,
 * never exceeding 50 parts. Always returns at least one unit (callers guarantee
 * affordability, or accept an undersized emergency creep).
 */
function repeat(unit: BodyPartConstant[], budget: number, maxRepeat: number): BodyPartConstant[] {
  const cost = unitCost(unit);
  let n = Math.floor(budget / cost);
  if (n > maxRepeat) n = maxRepeat;
  while (n * unit.length > MAX_PARTS) n--;
  if (n < 1) n = 1;
  const body: BodyPartConstant[] = [];
  for (let i = 0; i < n; i++) body.push(...unit);
  return body;
}

// ---------------------------------------------------------------------------
// Per-role body builders (all driven by an energy budget)
// ---------------------------------------------------------------------------

/**
 * Stationary container miner: maximise WORK (up to 5 — a full source drain at
 * 10 energy/tick) plus one CARRY (to fill its container) and proportional MOVE.
 */
export function minerBody(budget: number): BodyPartConstant[] {
  for (let w = 5; w >= 1; w--) {
    const m = Math.min(3, Math.max(1, Math.ceil(w / 2)));
    const cost = w * BODY_COST.work + BODY_COST.carry + m * BODY_COST.move;
    if (cost <= budget) {
      const body: BodyPartConstant[] = [];
      for (let i = 0; i < w; i++) body.push(WORK);
      body.push(CARRY);
      for (let i = 0; i < m; i++) body.push(MOVE);
      return body;
    }
  }
  return [WORK, CARRY, MOVE];
}

/** Hauler: CARRY/MOVE at a 2:1 ratio (assumes roads; half-speed when loaded off-road). */
export function haulerBody(budget: number): BodyPartConstant[] {
  return repeat([CARRY, CARRY, MOVE], budget, 8); // up to 16 CARRY = 800 capacity
}

/**
 * Spend any leftover budget (after whole units) on extra WORK then a MOVE, so a
 * creep uses its FULL energy capacity instead of leaving a fraction of a unit
 * unspent. This matters most during the cap=300 bootstrap, where [WORK,CARRY,
 * MOVE] (200e, 1 WORK) wastes 100e — filling it to 2 WORK halves the time to
 * build the first extensions, which is the whole early-game bottleneck.
 */
function fillWork(body: BodyPartConstant[], leftover: number): BodyPartConstant[] {
  let left = leftover;
  while (left >= BODY_COST.work && body.length < MAX_PARTS) {
    body.push(WORK);
    left -= BODY_COST.work;
  }
  if (left >= BODY_COST.move && body.length < MAX_PARTS) body.push(MOVE);
  return body;
}

/** Generalist worker (harvester bootstrap / builder): balanced, budget-filling. */
export function workerBody(budget: number, maxRepeat: number): BodyPartConstant[] {
  const unitCostV = unitCost([WORK, CARRY, MOVE]);
  const n = Math.max(1, Math.min(maxRepeat, Math.floor(budget / unitCostV)));
  const body = repeat([WORK, CARRY, MOVE], budget, maxRepeat);
  // Only fill when the BUDGET (not maxRepeat) was the binding constraint, so
  // size-capped roles stay balanced.
  return n < maxRepeat ? fillWork(body, budget - n * unitCostV) : body;
}

/**
 * Upgrader: balanced WORK:CARRY for high uptime. Each unit is 1 WORK + 1 CARRY
 * + 1 MOVE (200e), giving a 1:1 work-to-carry ratio that keeps the creep
 * upgrading for ~50 ticks between refills instead of the 12-25 ticks a 2:1
 * ratio gives — halving the number of refill trips and nearly doubling the
 * effective energy→control-point conversion rate. Capped at 15 WORK total
 * because a controller accepts at most 15 energy/tick of upgrade at RCL8.
 */
export function upgraderBody(budget: number, rcl: number): BodyPartConstant[] {
  const unit: BodyPartConstant[] = [WORK, CARRY, MOVE]; // 1:1:1, 200e
  const maxByCap = rcl >= 8 ? 4 : 8;
  const uc = unitCost(unit);
  const n = Math.max(1, Math.min(maxByCap, Math.floor(budget / uc)));
  const body = repeat(unit, budget, maxByCap);
  // Fill remaining budget with spare WORK+CARRY pairs, then any final MOVE.
  let left = budget - n * uc;
  while (left >= BODY_COST.work + BODY_COST.carry && body.length < MAX_PARTS - 1) {
    body.push(WORK, CARRY);
    left -= BODY_COST.work + BODY_COST.carry;
  }
  if (left >= BODY_COST.move && body.length < MAX_PARTS) body.push(MOVE);
  return body;
}

/** Melee defender: ATTACK with 1:1 MOVE so it stays mobile while fighting. */
export function defenderBody(budget: number): BodyPartConstant[] {
  return repeat([ATTACK, MOVE], budget, 10);
}

/** Scout: a single MOVE — disposable intel gatherer. */
export function scoutBody(): BodyPartConstant[] {
  return [MOVE];
}

/** Claimer: one CLAIM + MOVE (600+50 = 650e; needs RCL2+ capacity). */
export function claimerBody(budget: number): BodyPartConstant[] {
  if (budget >= 1300) return [CLAIM, CLAIM, MOVE, MOVE];
  return [CLAIM, MOVE];
}

/** Pioneer: a big mobile generalist that bootstraps a freshly-claimed room. */
export function pioneerBody(budget: number): BodyPartConstant[] {
  return workerBody(Math.min(budget, 1500), 6);
}

// ---------------------------------------------------------------------------
// Role target counts (desired population per owned room)
// ---------------------------------------------------------------------------

export type RoleTargets = Partial<Record<CreepRole, number>>;

/**
 * Compute the desired creep population for a room from its current state.
 * Expansion roles (scout/claimer/pioneer) are NOT included here — the expansion
 * manager requests those separately. `current` is the room's live role counts,
 * used to keep an invariant the desired-state alone can't express.
 */
export function roleTargets(data: RoomData, current: Record<string, number>): RoleTargets {
  const { rcl, sources, storage, constructionSites, hostiles, towers } = data;
  const sourceCount = sources.length;
  const withContainer = sources.filter((s) => s.container).length;
  const totalOpenSlots = sources.reduce((sum, s) => sum + s.openSlots, 0);
  const liveHaulers = current.hauler || 0;

  const targets: RoleTargets = {};

  // --- Mining: dedicated miners on container-equipped sources ---
  targets.miner = withContainer;

  // --- Generalist harvesters: cover sources that have no container yet, and
  //     carry the whole economy during the RCL1-2 bootstrap before containers
  //     exist. Capped by the open tiles around the uncovered sources. ---
  const uncovered = sourceCount - withContainer;
  if (withContainer === 0) {
    // Pure bootstrap: 2-3 generalists per source, bounded by mining slots.
    targets.harvester = Math.min(sourceCount * 3, totalOpenSlots, 6);
  } else if (uncovered > 0) {
    targets.harvester = Math.min(uncovered * 2, totalOpenSlots);
  } else {
    // Fully container-mined: miners + haulers run the economy, so generalists
    // are not needed — EXCEPT we always keep one alive until a hauler exists.
    // A harvester is the only OTHER creep that refills the spawn; without this
    // floor, a simultaneous hauler die-off with a low spawn would deadlock
    // (no filler can be afforded from an empty spawn). This floor guarantees a
    // self-sufficient spawn-filler is always present through the transition.
    targets.harvester = liveHaulers > 0 ? 0 : 1;
  }

  // --- Haulers: move energy from source containers to sinks. ---
  if (withContainer > 0) {
    let haulers = Math.max(withContainer, rcl >= 3 ? 2 : 1);
    if (storage) haulers += 1;
    targets.hauler = Math.min(haulers, sourceCount * 2 + 1);
  } else {
    targets.hauler = 0;
  }

  // --- Upgraders: baseline scaled by RCL, surplus energy, and waste detection. ---
  // GCL progress is earned by controller upgrades — each energy unit spent
  // upgrading yields 1 control point.  The more upgraders we keep busy, the
  // faster GCL grows and the sooner we can expand to a second room.  At low
  // RCL energy production often outstrips spawn+extension sink capacity; we
  // detect that waste and route it into the controller.
  {
    let upg = 1;
    if (rcl >= 8) {
      upg = 1; // capped at 15 energy/tick — one fat upgrader is enough
    } else if (storage) {
      const e = storage.store[RESOURCE_ENERGY];
      upg = Math.min(6, 2 + Math.floor(e / 12000));
    } else {
      // No storage yet: scale by RCL and containerization.  At RCL 3–4 with two
      // container-mined sources the colony produces ~20 energy/tick net; each
      // RCL-3 upgrader (3 WORK) burns 3 energy/tick upgrading, so 4–5 upgraders
      // convert most surplus into control points — accelerating both RCL and GCL.
      if (rcl >= 6) upg = 5;
      else if (rcl >= 4) upg = 4;
      else if (rcl >= 3) upg = withContainer > 0 ? 4 : 3;
      else upg = withContainer > 0 ? 2 : 1; // RCL 1-2: bootstrap
    }

    // GCL push: when GCL is low (1–3) expansion is gated by control points,
    // not rooms, so every spare joule must go into the controller.  Add a
    // permanent +1 upgrader at GCL 1–2, tapering at GCL 3.
    if (Game.gcl.level <= 2) upg += 1;
    else if (Game.gcl.level === 3) upg = Math.max(upg, 3);

    // Waste detection: when spawn+extensions are near full (>60%), harvested
    // energy has nowhere to go — bump the upgrader target so surplus becomes
    // control points instead of decaying in containers or being lost to capped
    // buffers.  Only applies when there's no storage (storage absorbs surplus).
    // At >90% fill the bump is +2 because energy is flooding the buffers fast.
    if (!storage) {
      const spawnExt = [...data.spawns, ...data.extensions];
      const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY)!, 0);
      const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
      if (totalCap > 0 && totalE > totalCap * 0.6) {
        const bump = totalE > totalCap * 0.9 ? 2 : 1;
        upg = Math.max(upg, upg + bump);
      }
    }

    targets.upgrader = upg;
  }

  // --- Builders: scale with construction load. ---
  const sites = constructionSites.length;
  if (sites > 0) {
    targets.builder = Math.min(Math.max(1, Math.ceil(sites / 5)), rcl >= 4 ? 3 : 2);
  } else {
    targets.builder = 0;
  }

  // --- Defenders: only when threatened AND towers can't cover it. ---
  if (hostiles.length > 0 && towers.length === 0) {
    targets.defender = Math.min(hostiles.length, 3);
  } else {
    targets.defender = 0;
  }

  return targets;
}

/** Build the body for an economy role given the room's spawn-energy budget. */
export function bodyForRole(role: CreepRole, budget: number, rcl: number): BodyPartConstant[] {
  switch (role) {
    case "miner":
      return minerBody(budget);
    case "hauler":
      return haulerBody(budget);
    case "harvester":
      return workerBody(budget, 5);
    case "builder":
      return workerBody(budget, 5);
    case "upgrader":
      return upgraderBody(budget, rcl);
    case "defender":
      return defenderBody(budget);
    case "scout":
      return scoutBody();
    case "claimer":
      return claimerBody(budget);
    case "pioneer":
      return pioneerBody(budget);
    default:
      return [WORK, CARRY, MOVE];
  }
}

/** Spawn priority — lower spawns first. */
export const ROLE_PRIORITY: Record<CreepRole, number> = {
  harvester: 0, // economy lifeblood (bootstrap)
  miner: 1,
  hauler: 2,
  defender: 2, // urgent when present
  remoteHarvester: 3,
  upgrader: 4,
  builder: 5,
  pioneer: 6,
  claimer: 7,
  scout: 8,
};
