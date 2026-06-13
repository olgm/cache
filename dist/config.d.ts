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
 * Stationary container miner: maximise WORK (up to 5 — a full source drain at
 * 10 energy/tick) plus one CARRY (to fill its container) and proportional MOVE.
 */
export declare function minerBody(budget: number): BodyPartConstant[];
/** Hauler: CARRY/MOVE at a 2:1 ratio (assumes roads; half-speed when loaded off-road). */
export declare function haulerBody(budget: number): BodyPartConstant[];
/** Generalist worker (harvester bootstrap / builder): balanced WORK/CARRY/MOVE. */
export declare function workerBody(budget: number, maxRepeat: number): BodyPartConstant[];
/**
 * Upgrader: WORK-heavy with enough CARRY to buffer. Capped at 15 WORK because a
 * controller accepts at most 15 energy/tick of upgrade once at RCL8 (and big
 * upgraders are wasteful past that); below RCL8 more WORK is always useful.
 */
export declare function upgraderBody(budget: number, rcl: number): BodyPartConstant[];
/** Melee defender: ATTACK with 1:1 MOVE so it stays mobile while fighting. */
export declare function defenderBody(budget: number): BodyPartConstant[];
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
