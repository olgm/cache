/**
 * Cache — economy tunables: dynamic body builders + RCL-scaled role targets.
 *
 * Bodies scale with `energyCapacityAvailable` (so creeps grow as the room builds
 * extensions), and target counts scale with RCL, source/container count, storage
 * energy and construction load. This is the single biggest lever for climbing
 * out of the "5 tiny creeps forever" trap the old hardcoded plan was stuck in.
 */
import { CreepRole } from "./types";
import { RoomData } from "./utils/roomData";
/**
 * Stationary container miner: WORK up to the source REGEN LIMIT (5 WORK drains a
 * source's 10 energy/tick exactly — HARVEST_POWER 2 × 5), plus one CARRY to fill
 * its container and proportional MOVE.
 *
 * WORK is HARD-CAPPED at 5: a source cannot yield more than 10 energy/tick, so a
 * 6th+ WORK part is pure dead weight. The old code filled leftover budget with
 * extra WORK, producing a 16-WORK / 1800e miner that did a 700e job — and once
 * the colony built out its extensions (capacity 1800), that price tag deadlocked
 * the spawn: it could not afford the miner it wanted, idled, and the population
 * death-spiralled. A cheap miner is one the colony can always replace.
 */
export declare function minerBody(budget: number): BodyPartConstant[];
/**
 * Hauler: CARRY/MOVE at a 2:1 ratio (assumes roads; half-speed when loaded
 * off-road).  LOW-BUDGET FALLBACK: at budget < 150 (below the [CARRY,CARRY,
 * MOVE] unit cost), return [CARRY, MOVE] at 100 e — a slow one-trip hauler
 * that can be spawned in energy-poverty deadlocks where the colony cannot
 * accumulate the 150 e for a full-hauler body.  A runt hauler that restarts
 * logistics NOW is the difference between recovery and a permanent stall
 * (the live W43N38 spawnStall 135).  Unlike harvesterBody and workerBody,
 * haulerBody had NO escape hatch below its unit cost, so the spawn demanded
 * a body it could never afford — the exact deadlock this fallback breaks.
 */
export declare function haulerBody(budget: number): BodyPartConstant[];
/** Generalist worker (builder): balanced, budget-filling.
 *
 * LOW-BUDGET FALLBACK: when budget is below the [WORK,CARRY,MOVE] unit cost
 * (200 e), the standard repeat() would still return that 200 e body via its
 * Math.max(1, …) floor — a body the spawn cannot afford when it has, say,
 * 150 e.  The fallback [WORK, CARRY] (150 e, no MOVE) is a slow but functional
 * builder that can be spawned in energy-poverty deadlocks and lets the room
 * make construction progress rather than stalling forever.  Once the spawn
 * accumulates ≥ 200 e the normal unit body resumes.
 */
export declare function workerBody(budget: number, maxRepeat: number): BodyPartConstant[];
/**
 * Harvester body — heavy CARRY for bootstrap efficiency.
 *
 * During bootstrap (no source containers), harvesters mine AND haul — every
 * trip to the spawn wastes ticks walking, so carrying more per trip directly
 * raises the room's energy throughput.  The base unit [WORK, CARRY, CARRY, MOVE]
 * (250e) gives a 2:1 carry-to-work ratio; leftover budget fills extra WORK
 * (faster mining → faster refill → more frequent trips) then CARRY if WORK
 * would exceed source regen rate.
 *
 * LOW-BUDGET FALLBACK: when energy is tight (budget < 250), the full unit is
 * unaffordable.  Returning it anyway (the old code's `Math.max(1, …)`) produces
 * a 250e body the spawn cannot afford — a permanent deadlock (W44N38's
 * spawnStall=670).  The fallback [WORK, CARRY, MOVE] (200e) is less efficient
 * but lets a deadlocked room recover: a minimal harvester that CAN be afforded
 * restarts energy flow, and the spawn can replace it with a full-body harvester
 * once the economy regains momentum.
 */
export declare function harvesterBody(budget: number): BodyPartConstant[];
/**
 * Upgrader body — tuned for maximum control-point conversion per energy spent.
 *
 * At GCL 1-2 every control point gates multi-room expansion, so the body is
 * WORK-biased (2:1:1 WORK:CARRY:MOVE unit, 300e).  The upgrader parks at the
 * controller container (adjacent), so refill walks are 1-2 tiles — the extra
 * refill frequency costs almost nothing while 2:1:1 packs 33-50% more WORK into
 * the same energy budget vs the balanced 1:1:1.
 *
 * At GCL 3+ we switch to the balanced 1:1:1 unit (200e) for high uptime
 * (~50 ticks between refills), which matters more when upgraders occasionally
 * walk to source containers.  Capped at 15 WORK total because a controller
 * accepts at most 15 energy/tick of upgrade at RCL 8.
 *
 * LOW-BUDGET FALLBACK: when the workHeavy unit (300 e) is unaffordable, fall
 * back to the balanced [WORK,CARRY,MOVE] at 200 e, then to [WORK,CARRY] at
 * 150 e — the same pattern as workerBody and harvesterBody.  Without this a
 * poverty-trapped room that needs an upgrader (all higher-priority roles met)
 * demands 300 e it can never accumulate, and the spawn stalls forever (the
 * live W43N38 spawnStall 135 — the spawn tries upgraderBody(300) with
 * energyAvailable oscillating at 100–200 e and never succeeds).
 */
export declare function upgraderBody(budget: number, rcl: number): BodyPartConstant[];
/** Melee defender: ATTACK with 1:1 MOVE so it stays mobile while fighting. */
export declare function defenderBody(budget: number): BodyPartConstant[];
/**
 * Remote harvester body — CARRY-heavy with extra MOVE for inter-room travel.
 *
 * Each unit (WORK, CARRY, CARRY, MOVE, MOVE, 350e) gives a 2:1 CARRY:WORK ratio
 * with enough MOVE to stay mobile across rooms even when fully loaded. Leftover
 * budget fills CARRY first (long walks reward big payloads), then WORK.
 */
export declare function remoteHarvesterBody(budget: number): BodyPartConstant[];
/** Scout: a single MOVE — disposable intel gatherer. */
export declare function scoutBody(): BodyPartConstant[];
/** Claimer: one CLAIM + MOVE (600+50 = 650e; needs RCL2+ capacity). */
export declare function claimerBody(budget: number): BodyPartConstant[];
/** Pioneer: a big mobile generalist that bootstraps a freshly-claimed room. */
export declare function pioneerBody(budget: number): BodyPartConstant[];
export type RoleTargets = Partial<Record<CreepRole, number>>;
/**
 * Compute the desired creep population for a room from its current state.
 * Expansion roles (scout/claimer/pioneer) are NOT included here — the expansion
 * manager requests those separately. `current` is the room's live role counts,
 * used to keep an invariant the desired-state alone can't express.
 */
export declare function roleTargets(data: RoomData, current: Record<string, number>): RoleTargets;
/** Build the body for an economy role given the room's spawn-energy budget. */
export declare function bodyForRole(role: CreepRole, budget: number, rcl: number): BodyPartConstant[];
/** Spawn priority — lower spawns first. */
export declare const ROLE_PRIORITY: Record<CreepRole, number>;
