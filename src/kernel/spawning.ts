/**
 * Cache — Spawn manager (per-room, prioritized, self-healing).
 *
 * For each owned room with a free spawn it spawns the highest-priority missing
 * creep, sizing the body to the room's full energy capacity (so creeps grow with
 * the colony) and waiting until that body is affordable rather than producing
 * runts. The exception is the emergency path: if the room's energy-delivery
 * pipeline has collapsed (no harvesters AND no miners-or-haulers), it
 * immediately spawns a self-sufficient harvester sized to whatever energy is on
 * hand — the safety net that lets a colony recover from a wipe.
 */

import { BODY_COST, CreepRole, SpawnErrorEntry, SPAWN_ERROR_CAP } from "../types";
import { bodyForRole, roleTargets, ROLE_PRIORITY, RoleTargets } from "../config";
import { buildCensus, Census, roleCount } from "../utils/census";
import { getRoomData, myRooms, RoomData } from "../utils/roomData";
import { getExpansionSpawnRequest, SpawnRequest } from "../expansion";
import {
  getRemoteMiningSpawnRequest,
  remoteHarvesterTargetForRoom,
  pickRemoteSource,
  ensureRemoteMiningMemory,
} from "./remoteMining";

let nextId = 0;

function bodyCost(body: BodyPartConstant[]): number {
  let c = 0;
  for (const p of body) c += BODY_COST[p];
  return c;
}

/**
 * Ring-buffer capture of a NON-OK spawnCreep result so a SILENT spawn failure
 * leaves a trace. Every spawnCreep call site funnels its return code here: OK is
 * ignored (no news is good news); a non-OK code (ERR_RCL_NOT_ENOUGH,
 * ERR_GCL_NOT_ENOUGH, ERR_BUSY, ERR_NAME_EXISTS, …) is appended to
 * Memory.spawnErrors (newest-wins, capped at SPAWN_ERROR_CAP). The stats writer
 * folds this into Memory.stats so SPARSE/the Overseer can see WHY a room stopped
 * spawning — the "second room won't spawn" thesis previously left no signal at
 * all. Additive + defensive: it only touches Memory and runs inside the spawn
 * manager's per-room try/catch, so it can never break a tick. Exported for tests.
 */
export function recordSpawnResult(room: string, role: string, code: ScreepsReturnCode): void {
  if (code === OK) return;
  const buf: SpawnErrorEntry[] = Memory.spawnErrors || (Memory.spawnErrors = []);
  buf.push({ room, role, code, tick: Game.time });
  // Newest-wins: drop the oldest entries once we exceed the cap.
  if (buf.length > SPAWN_ERROR_CAP) buf.splice(0, buf.length - SPAWN_ERROR_CAP);
}

export function runSpawnManager(): void {
  const census = buildCensus();
  for (const room of myRooms()) {
    try {
      runRoom(room, census);
    } catch (e) {
      console.log(`CACHE spawn error in ${room.name}: ${(e as Error)?.message}`);
    }
  }
}

/**
 * Consecutive ticks the spawn may want a creep it cannot afford before it gives
 * up waiting and builds a smaller, affordable one. Long enough that a healthy
 * room's normal refill wait never trips it; short enough to escape a population
 * collapse in minutes rather than hours.
 */
const SPAWN_STALL_LIMIT = 50;

function runRoom(room: Room, census: Census): void {
  const data = getRoomData(room);
  // A spawn that is mid-build is making progress — never count it as stalled.
  if (data.spawns.some((s) => s.spawning)) room.memory.spawnStall = 0;
  const idleSpawns = data.spawns.filter((s) => !s.spawning);
  if (idleSpawns.length === 0) return;

  const targets = roleTargets(data, census.byRoom[room.name] || {});

  // Merge the remoteHarvester target into the economy role targets so it competes
  // by priority (priority 4.5, between builder and upgrader) instead of being gated
  // behind a fully-satisfied economy.  Without this, the spawn loop never reaches
  // step 3 (remote mining) when any economy role is under target — the common
  // case where upgraders are perpetually 1-2 below their desired count, blocking
  // remoteHarvester spawning forever.
  const remoteTarget = remoteHarvesterTargetForRoom(room);
  if (remoteTarget > 0) targets.remoteHarvester = remoteTarget;

  // Merge pioneer target when an expansion room needs bootstrapping.  Pioneers
  // must compete in the economy priority order (at priority 3, above builders
  // and upgraders).  Gating them behind a fully-satisfied economy (old step 3)
  // starved W44N38 of its first spawn for thousands of ticks: the home room
  // perpetually wanted one more upgrader, so the spawn never reached the
  // expansion step, and the claimed room sat at RCL 1 with zero pioneers.
  // PIONEERS_PER_ROOM (3) is defined in expansion.ts; we replicate it here to
  // keep the spawning module self-contained.
  const PIONEERS_PER_ROOM = 3;
  const expMem = Memory.expansion;
  if (expMem && expMem.state === "bootstrapping" && expMem.targetRoom) {
    let pioneersForTarget = 0;
    for (const name in Game.creeps) {
      const c = Game.creeps[name];
      if (c.memory.role === "pioneer" && c.memory.targetRoom === expMem.targetRoom) {
        pioneersForTarget++;
      }
    }
    if (pioneersForTarget < PIONEERS_PER_ROOM) {
      targets.pioneer = PIONEERS_PER_ROOM;
    }
  }

  // Per-tick reservations so two idle spawns don't duplicate a role / source.
  const reserved: Record<string, number> = {};
  const reservedSources = new Set<string>();

  // Recovery: the spawn has wanted a creep it could not afford for too long
  // (a hauler/population collapse). Size bodies to energy on hand until it gets
  // going again, so it never idles forever waiting for a body it can't fund.
  const recovering = (room.memory.spawnStall || 0) >= SPAWN_STALL_LIMIT;

  // Did the spawn want an economy creep this tick but fail to afford it?
  let stuck = false;
  for (const spawn of idleSpawns) {
    // 1. Emergency: the delivery pipeline has collapsed — recover NOW.
    if (needsEmergency(room.name, census, reserved)) {
      if (spawnEmergency(spawn, room, data)) bump(reserved, "harvester");
      else stuck = true;
      continue;
    }

    // 1.5. Bootstrapping emergency: a claimed room with zero pioneers is
    // dead in the water — it can never build its first spawn, so the expansion
    // generates ZERO control points and may downgrade.  Spawn a minimal pioneer
    // immediately, sizing to energy on hand so this never stalls.  This path
    // fires only when there are genuinely zero pioneers for the target (the
    // "bootstrapping" state has already been set by the expansion manager's
    // reality-first self-heal), and it outranks every economy role except the
    // delivery-pipeline emergency above.
    if (spawnBootstrappingEmergency(spawn, room, data, targets, census, reserved)) {
      bump(reserved, "pioneer");
      continue;
    }

    // 2. Economy roles + remoteHarvester, by priority.
    const role = pickEconomyRole(targets, census, room.name, reserved);
    if (role) {
      if (trySpawnRole(spawn, room, data, role, census, reserved, reservedSources, recovering)) {
        bump(reserved, role);
      } else {
        stuck = true;
      }
      continue;
    }

    // 3. Expansion (scout / claimer / pioneer) once the economy is satisfied.
    const req = getExpansionSpawnRequest(room, data);
    if (req) {
      // Fall back to available-energy sizing when the capacity body is
      // unaffordable — a smaller expansion creep NOW is infinitely better
      // than an idle spawn waiting for energy it may never accumulate while
      // upgraders burn the surplus.
      let body = req.body;
      if (data.energyAvailable < bodyCost(req.body)) {
        body = bodyForRole(req.role, data.energyAvailable, data.rcl);
      }
      if (data.energyAvailable >= bodyCost(body)) {
        const code = spawn.spawnCreep(body, name(req.role), { memory: req.memory });
        recordSpawnResult(room.name, req.role, code);
      }
      // Don't set stuck here: expansion is a bonus, not a must-spawn.
    }

    // 4. Cross-room rescue: when another owned room has a dead spawn (stalled
    //    for many ticks with zero harvesters), use this room's idle spawn to
    //    create a rescue harvester assigned to the dead room.  The harvester
    //    travels to its home room, starts mining, and restarts the dead
    //    spawn's energy flow.  This is the ONLY way out of the "spawn has 0
    //    energy and cannot self-recover" deadlock (W44N38 at spawnStall 1332).
    if (tryRescueDeadRoom(spawn, room, data, census)) continue;
  }

  // Count consecutive stalled ticks; any successful spawn (or nothing wanted)
  // clears it. Crossing SPAWN_STALL_LIMIT flips on recovery sizing next tick.
  room.memory.spawnStall = stuck ? (room.memory.spawnStall || 0) + 1 : 0;
}

// ---------------------------------------------------------------------------
// Emergency bootstrap
// ---------------------------------------------------------------------------

/**
 * True when no one can refill the spawn: there are zero harvesters AND
 * (zero miners OR zero haulers). In either case energy stops reaching the spawn,
 * so we must spawn a self-sufficient harvester immediately.
 */
function needsEmergency(home: string, census: Census, reserved: Record<string, number>): boolean {
  const harvesters = roleCount(census, home, "harvester") + (reserved.harvester || 0);
  if (harvesters > 0) return false;
  const miners = roleCount(census, home, "miner") + (reserved.miner || 0);
  const haulers = roleCount(census, home, "hauler") + (reserved.hauler || 0);
  return miners === 0 || haulers === 0;
}

function spawnEmergency(spawn: StructureSpawn, room: Room, data: RoomData): boolean {
  // Size to energy ON HAND (don't wait for capacity we can't fill).
  const budget = Math.max(BODY_COST.work + BODY_COST.carry + BODY_COST.move, data.energyAvailable);
  const body = bodyForRole("harvester", budget, data.rcl);
  if (data.energyAvailable < bodyCost(body)) return false;
  const code = spawn.spawnCreep(body, name("harvester"), {
    memory: { role: "harvester", homeRoom: room.name, bootstrap: true },
  });
  recordSpawnResult(room.name, "harvester", code);
  return code === OK;
}

/**
 * Bootstrapping emergency: when the expansion manager has set state to
 * "bootstrapping" (a claimed room has no spawn) and zero pioneers exist for
 * the target, spawn one immediately — sizing to energy on hand so it never
 * stalls waiting for a capacity body.  This bypasses the economy priority
 * system entirely, just like the delivery-pipeline emergency above.
 *
 * Pioneers are the ONLY way a spawn-less room can ever get its first spawn.
 * A claimed room with no spawn generates ZERO control points and may
 * downgrade; every tick without a pioneer en route is a tick the expansion
 * colony is dead.  This emergency path guarantees at least one pioneer
 * spawns as soon as the home spawn can scrape together a minimal body.
 */
function spawnBootstrappingEmergency(
  spawn: StructureSpawn,
  room: Room,
  data: RoomData,
  targets: RoleTargets,
  census: Census,
  reserved: Record<string, number>,
): boolean {
  // Only fire when the expansion system is actively bootstrapping AND this
  // room is the base room (has the spawn that funds the expansion).
  const expMem = Memory.expansion;
  if (!expMem || expMem.state !== "bootstrapping" || !expMem.targetRoom) return false;

  // Count pioneers already alive or reserved this tick that target that room.
  const pioneerTarget = targets.pioneer || 0;
  if (pioneerTarget === 0) return false; // pioneer not wanted (shouldn't happen)

  let pioneersForTarget = 0;
  for (const name in Game.creeps) {
    const c = Game.creeps[name];
    if (c.memory.role === "pioneer" && c.memory.targetRoom === expMem.targetRoom) {
      pioneersForTarget++;
    }
  }
  pioneersForTarget += reserved.pioneer || 0;
  if (pioneersForTarget > 0) return false; // at least one is already on the way

  // Size to energy ON HAND — a minimal pioneer (200e) is infinitely better
  // than waiting for a full-capacity body that may never be affordable while
  // upgraders burn the surplus.
  const minBudget = BODY_COST.work + BODY_COST.carry + BODY_COST.move; // 200e
  const budget = Math.max(minBudget, data.energyAvailable);
  const body = bodyForRole("pioneer", budget, data.rcl);
  if (data.energyAvailable < bodyCost(body)) return false;

  const memory: CreepMemory = {
    role: "pioneer",
    homeRoom: room.name,
    targetRoom: expMem.targetRoom,
  };
  const code = spawn.spawnCreep(body, name("pioneer"), { memory });
  recordSpawnResult(room.name, "pioneer", code);
  return code === OK;
}

/**
 * Cross-room rescue: when a room we own has a dead spawn (stalled for many
 * ticks with zero harvesters, e.g. W44N38 at spawnStall 1332 with 0 energy
 * harvested), use a HEALTHY room's idle spawn to create a rescue harvester
 * assigned to the dead room.
 *
 * The rescue harvester is spawned in the rescuing room but has homeRoom set to
 * the dead room.  It travels there immediately, starts mining from the dead
 * room's sources, and delivers energy to the dead spawn — breaking the "spawn
 * has no energy → can't spawn harvesters → spawn stays empty" deadlock.
 *
 * Only fires when this room's own economy is satisfied (the spawn was idle
 * after economy + expansion steps) and has enough energy to afford at least a
 * minimal harvester body (250 e).  Rescues at most one dead room per tick.
 */
function tryRescueDeadRoom(
  spawn: StructureSpawn,
  room: Room,
  data: RoomData,
  census: Census,
): boolean {
  // Don't rescue if this room can barely afford its own creeps.
  if (data.energyAvailable < 250) return false;

  for (const other of myRooms()) {
    if (other.name === room.name) continue;
    const otherData = getRoomData(other);
    if (otherData.spawns.length === 0) continue; // nothing to rescue

    const stall = other.memory.spawnStall || 0;
    if (stall < 200) continue; // not dead long enough — avoid false positives

    // Verify via census (cheap, already built): the dead room has zero harvesters.
    const otherHarvesters = roleCount(census, other.name, "harvester");
    if (otherHarvesters > 0) {
      // Harvesters exist — reset the stall counter in case it was stale.
      other.memory.spawnStall = 0;
      continue;
    }

    // Spawn a minimal harvester for the dead room.  Size to energy on hand so
    // the rescue never stalls on budget — a small harvester that arrives NOW
    // is infinitely better than a fat one that waits for capacity.
    const body = bodyForRole("harvester", data.energyAvailable, data.rcl);
    if (data.energyAvailable < bodyCost(body)) return false;

    const code = spawn.spawnCreep(body, name("harvester"), {
      memory: { role: "harvester", homeRoom: other.name },
    });
    recordSpawnResult(room.name, "harvester", code);
    return code === OK;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Economy roles
// ---------------------------------------------------------------------------

/**
 * Pick the highest-priority role this room is under target on (or null if all
 * are satisfied). Exported for unit testing — it is the seam where the
 * ROLE_PRIORITY ordering decides whether builders ever get spawned ahead of the
 * upgrader fleet (see spawn-priority.test).
 *
 * Includes four starvation guards that prevent higher-priority roles from
 * consuming every spawn cycle forever:
 *
 * 1. Builder-starvation guard: when construction sites exist and zero builders
 *    are alive or reserved, builder priority is temporarily elevated to 1.5
 *    (above hauler at 2, below miner at 1) so at least one builder spawns.
 *
 * 2. Storage-emergency guard: when a room at RCL 4+ has no built storage, the
 *    builder corps is elevated to 1.5 until the FULL builder target is met
 *    (not just until the first builder), so the 2-3 builders needed for a
 *    30 000-energy storage actually materialise.
 *
 * 3. Bootstrapping-pioneer guard: when the expansion system is actively
 *    bootstrapping a claimed room with no spawn, pioneer priority is elevated
 *    to 1.2 (above storage-emergency builder at 1.5 and hauler at 2, below
 *    miner at 1) so pioneers are not starved by the home room's demands.
 *
 * 4. Upgrader-starvation guard: when GCL ≤ 2 (every control point gates
 *    multi-room expansion) and the upgrader corps is below a minimum floor
 *    (scaled by RCL), upgrader priority is temporarily elevated to 2.5 (above
 *    hauler at 2, below miner at 1) so at least the floor count of upgraders
 *    is maintained.  Without this, a hauler target that is perpetually 2-3
 *    short of its ceiling (the common RCL 5 state) consumes every spawn cycle
 *    and the upgrader count never reaches even its modest floor — control
 *    points flatline, GCL stalls, and the colony deadlocks.  Once the floor is
 *    reached the guard deactivates and normal ordering resumes.
 */
export function pickEconomyRole(
  targets: RoleTargets,
  census: Census,
  home: string,
  reserved: Record<string, number>,
): CreepRole | null {
  const roles = (Object.keys(targets) as CreepRole[]).filter((r) => (targets[r] || 0) > 0);

  // Builder-starvation guard: when construction sites exist and no builder is
  // alive or reserved this tick, temporarily elevate builder priority so at
  // least one builder gets spawned to work the sites.
  const builderTarget = targets.builder || 0;
  const builderCount = roleCount(census, home, "builder") + (reserved.builder || 0);
  const builderStarved = builderTarget > 0 && builderCount === 0;

  // Storage-emergency guard: when a room at RCL 4+ has no storage, the builder
  // corps must be elevated above haulers in spawn priority until the FULL
  // builder target is met, not just until one builder exists.  Without this,
  // the builder-starvation guard deactivates the moment a single builder spawns,
  // builder drops to priority 4, and hauler (priority 2) consumes every spawn
  // cycle — so the 2-3 builders needed to finish a 30 000-energy storage never
  // materialise, and storage sits at progress 0 forever.  Once storage exists
  // the guard deactivates and normal priority ordering resumes.
  // Guarded behind a typeof check for Node.js test compatibility.
  let storageEmergency = false;
  if (typeof Game !== "undefined") {
    const room = Game.rooms[home];
    const rcl = room?.controller?.level ?? 0;
    const hasStorage = !!(room?.storage);
    storageEmergency = rcl >= 4 && !hasStorage && builderTarget > 0 && builderCount < builderTarget;
  }

  // Bootstrapping-pioneer guard: when the expansion system is actively
  // bootstrapping a claimed room that has no spawn, pioneer priority is
  // elevated above hauler so the home room's hauler demand doesn't starve
  // the expansion.  At 1.7, pioneer beats hauler (2) but still loses to a
  // storage-emergency builder (1.5) — home construction wins, then pioneers
  // get the next spawn cycle.  Without this, W44N38 sits at RCL 1 with zero
  // pioneers forever because the home room perpetually needs one more hauler.
  // Guarded behind a typeof check for Node.js test compatibility.
  let bootstrappingPioneer = false;
  if (typeof Game !== "undefined") {
    const pioneerTarget = targets.pioneer || 0;
    const pioneerCount = roleCount(census, home, "pioneer") + (reserved.pioneer || 0);
    bootstrappingPioneer =
      (Memory.expansion?.state === "bootstrapping") &&
      pioneerTarget > 0 &&
      pioneerCount < pioneerTarget;
  }

  // Upgrader-starvation guard: when GCL is low (≤ 2) every control point
  // gates expansion — maintain a minimum upgrader corps so control points
  // keep flowing even while higher-priority roles (haulers) are under target.
  const upgraderTarget = targets.upgrader || 0;
  const upgraderCount = roleCount(census, home, "upgrader") + (reserved.upgrader || 0);
  // Minimum floor: at RCL ≥ 5 the economy is mature enough to feed 3 upgraders
  // without strain; at RCL 3-4, 2; at RCL 1-2 the GCL push already elevates
  // the target through config.ts, so we use a lower floor.
  // Guarded behind a typeof check so the function remains callable in Node.js
  // test environments where the Screeps `Game` global does not exist.
  let upgraderStarved = false;
  if (typeof Game !== "undefined") {
    const room = Game.rooms[home];
    const rcl = room?.controller?.level ?? 0;
    const upgraderFloor = rcl >= 5 ? 3 : rcl >= 3 ? 2 : 1;
    upgraderStarved =
      Game.gcl.level <= 2 && upgraderTarget > 0 && upgraderCount < upgraderFloor;
  }

  // Builder catch-up guard: when builders are critically below target during
  // bootstrap or storage-emergency (target ≥ 3, only 0–1 builders alive),
  // temporarily elevate builder priority ABOVE harvester (priority -0.5 vs 0).
  //
  // Without this, the constant churn of harvester replacements (one dies every
  // ~250 ticks) consumes every spawn cycle and the builder count never rises
  // above 1 — the observed "RCL 6, target 5 builders, only 1 alive" pathology
  // where source containers and storage sit unbuilt for thousands of ticks
  // because the spawn is too busy replacing dying harvesters to ever spawn a
  // 2nd builder.  This guard lets the builder corps catch up from 1 to ~3
  // (ceil(target/3) threshold), roughly tripling construction throughput.
  //
  // Only fires when the room genuinely needs builders — storageEmergency
  // already covers the "no storage at RCL 4+" scenario, and the guard
  // deactivates once the count reaches ⅓ of target (typically 2 builders for
  // a target of 5).  In normal post-bootstrap operation builders don't need
  // this extreme elevation; the storage-emergency guard at 1.5 suffices.
  const builderCatchUp =
    builderTarget >= 3 && builderCount <= Math.ceil(builderTarget / 3);

  roles.sort((a, b) => {
    let pa = ROLE_PRIORITY[a];
    let pb = ROLE_PRIORITY[b];
    if (builderStarved || storageEmergency) {
      // Elevate builder to 1.5: above hauler(2) + pioneer(3), below miner(1).
      // The storageEmergency variant fires until the full target is met, not
      // just until the first builder spawns, so storage construction gets the
      // full builder corps it needs.
      if (a === "builder") pa = 1.5;
      if (b === "builder") pb = 1.5;
    }
    if (bootstrappingPioneer) {
      // Elevate pioneer to 1.2: above storage-emergency builder(1.5) AND
      // hauler(2), below miner(1).  A claimed room without a spawn generates
      // ZERO control points and eventually downgrades — the pioneer that
      // builds the spawn unlocks the new room's entire economy, which is a
      // force-multiplier worth more than one extra builder cycle in the home
      // room.  Once the spawn exists the bootstrapping state resolves and
      // the priority bump deactivates.
      if (a === "pioneer") pa = 1.2;
      if (b === "pioneer") pb = 1.2;
    }
    if (upgraderStarved) {
      // Elevate upgrader to 2.5: above hauler(2), below miner(1).
      // Builder at 1.5 (when starved) still outranks upgrader at 2.5,
      // so construction-critical builders always come first.
      if (a === "upgrader") pa = 2.5;
      if (b === "upgrader") pb = 2.5;
    }
    if (builderCatchUp) {
      // Elevate builder to -0.5: above harvester(0) so builders can catch up
      // from a severe shortage (0-1 builders vs target ≥ 3).  This is the
      // strongest elevation — it beats EVERY economy role including harvester
      // replacement, which is the root cause of the persistent 1-builder trap.
      // Once the count reaches the threshold the guard deactivates and normal
      // ordering resumes.
      if (a === "builder") pa = -0.5;
      if (b === "builder") pb = -0.5;
    }
    return pa - pb;
  });

  for (const role of roles) {
    const want = targets[role] || 0;
    const have = roleCount(census, home, role) + (reserved[role] || 0);
    if (have < want) return role;
  }
  return null;
}

/**
 * Spawn-energy budget for a normal economy creep.
 *
 * Capacity-sized (energyCapacityAvailable) in normal operation — bigger creeps
 * are more efficient, and a healthy hauler fleet keeps the spawn topped up so we
 * can afford them. But sized to energy ON HAND in two cases where waiting for a
 * full body would stall forever:
 *   - bootstrap: no source container yet, so the room cannot fill its capacity;
 *   - degraded: post-bootstrap but the hauler fleet has collapsed to zero, so
 *     energy no longer reaches the spawn (immediate trigger);
 *   - recovering: the spawn has been stalled (wanting an unaffordable creep) past
 *     SPAWN_STALL_LIMIT — the robust escape that also covers a partial collapse
 *     (e.g. one tiny hauler), where `degraded` has already switched off but the
 *     room still can't fill a capacity body. Without it the colony plateaus at a
 *     few creeps for hours (the observed RCL5 collapse: a full-capacity body of
 *     1800 was unaffordable, so nothing spawned and nothing recovered).
 * In all three, sizing to available lets the spawn produce a smaller creep NOW,
 * which restarts energy flow and recovers (mirrors the emergency-bootstrap path).
 */
export function economyBudget(data: RoomData, haulers: number, recovering: boolean): number {
  const bootstrapping = data.sources.every((s) => !s.container);
  const degraded = !bootstrapping && haulers === 0;
  if (bootstrapping || degraded || recovering) {
    return Math.max(BODY_COST.work + BODY_COST.carry + BODY_COST.move, data.energyAvailable);
  }
  return data.energyCapacity;
}

function trySpawnRole(
  spawn: StructureSpawn,
  room: Room,
  data: RoomData,
  role: CreepRole,
  census: Census,
  reserved: Record<string, number>,
  reservedSources: Set<string>,
  recovering: boolean,
): boolean {
  // Size the body to what the colony can actually fund right now (see
  // economyBudget): capacity-sized in normal operation, but sized to energy on
  // hand during bootstrap, a hauler collapse, or a prolonged stall.
  //
  // CRITICAL FALLBACK: when the capacity budget produces a body the spawn cannot
  // yet afford, we retry with an available-energy budget immediately instead of
  // waiting for the 50-tick stall recovery.  The stall counter is reset every
  // time ANY creep spawns (e.g. replacing a dying builder), so a room that can
  // always fund a 300e builder but never an 1800e upgrader would cycle forever
  // — the spawn would never reach recovery and zero upgraders would be spawned
  // (the observed "RCL 5, 0 upgraders" pathology).
  const haulers = roleCount(census, room.name, "hauler") + (reserved.hauler || 0);
  const budget = economyBudget(data, haulers, recovering);
  let body = bodyForRole(role, budget, data.rcl);
  if (data.energyAvailable < bodyCost(body)) {
    // Fall back to an available-energy body: a smaller creep NOW is infinitely
    // better than an idle spawn waiting for capacity it may never reach.
    body = bodyForRole(role, data.energyAvailable, data.rcl);
  }
  if (data.energyAvailable < bodyCost(body)) return false; // can't afford even the minimal body

  const memory: CreepMemory = { role, homeRoom: room.name };

  if (role === "miner") {
    const sid = pickFreeContainerSource(data, census, reservedSources);
    if (!sid) return false;
    memory.sourceId = sid;
    reservedSources.add(sid);
  }

  if (role === "remoteHarvester") {
    // Remote harvesters need sourceId and targetRoom so the role runner knows
    // where to mine and where to deliver.  Without these the creep idles
    // forever — the runtime symptom of the bug this block fixes.
    const rmMem = ensureRemoteMiningMemory(room.name);
    const source = pickRemoteSource(room.name, rmMem);
    if (!source) return false;
    memory.sourceId = source.id;
    memory.targetRoom = source.room;
  }

  if (role === "pioneer") {
    // Pioneers need targetRoom so they travel to the expansion room.
    // This is normally set by getExpansionSpawnRequest, but when pioneers
    // compete in the economy priority loop (above) they come through
    // trySpawnRole directly — the expansion memory is the source of truth.
    const expMem = Memory.expansion;
    if (expMem && expMem.targetRoom) {
      memory.targetRoom = expMem.targetRoom;
    }
  }

  const code = spawn.spawnCreep(body, name(role), { memory });
  recordSpawnResult(room.name, role, code);
  return code === OK;
}

/** A source with a container but no miner assigned (and not reserved this tick). */
function pickFreeContainerSource(
  data: RoomData,
  census: Census,
  reservedSources: Set<string>,
): Id<Source> | null {
  for (const sd of data.sources) {
    if (!sd.container) continue;
    const id = sd.source.id;
    if ((census.minersBySource[id] || 0) > 0) continue;
    if (reservedSources.has(id)) continue;
    return id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function spawnRequest(spawn: StructureSpawn, req: SpawnRequest): void {
  spawn.spawnCreep(req.body, name(req.memory.role), { memory: req.memory });
}

function name(role: CreepRole): string {
  return `${role}_${Game.time}_${nextId++}`;
}

function bump(reserved: Record<string, number>, role: string): void {
  reserved[role] = (reserved[role] || 0) + 1;
}
