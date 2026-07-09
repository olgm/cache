"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSpawnResult = recordSpawnResult;
exports.runSpawnManager = runSpawnManager;
exports.pickEconomyRole = pickEconomyRole;
exports.economyBudget = economyBudget;
exports.minerProductionFloor = minerProductionFloor;
const types_1 = require("../types");
const config_1 = require("../config");
const census_1 = require("../utils/census");
const roomData_1 = require("../utils/roomData");
const expansion_1 = require("../expansion");
const remoteMining_1 = require("./remoteMining");
let nextId = 0;
function bodyCost(body) {
    let c = 0;
    for (const p of body)
        c += types_1.BODY_COST[p];
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
function recordSpawnResult(room, role, code) {
    if (code === OK)
        return;
    const buf = Memory.spawnErrors || (Memory.spawnErrors = []);
    buf.push({ room, role, code, tick: Game.time });
    // Newest-wins: drop the oldest entries once we exceed the cap.
    if (buf.length > types_1.SPAWN_ERROR_CAP)
        buf.splice(0, buf.length - types_1.SPAWN_ERROR_CAP);
}
function runSpawnManager() {
    const census = (0, census_1.buildCensus)();
    for (const room of (0, roomData_1.myRooms)()) {
        try {
            runRoom(room, census);
        }
        catch (e) {
            console.log(`CACHE spawn error in ${room.name}: ${e === null || e === void 0 ? void 0 : e.message}`);
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
function runRoom(room, census) {
    const data = (0, roomData_1.getRoomData)(room);
    // A spawn that is mid-build is making progress — never count it as stalled.
    if (data.spawns.some((s) => s.spawning))
        room.memory.spawnStall = 0;
    const idleSpawns = data.spawns.filter((s) => !s.spawning);
    if (idleSpawns.length === 0)
        return;
    const targets = (0, config_1.roleTargets)(data, census.byRoom[room.name] || {});
    // Merge the remoteHarvester target into the economy role targets so it competes
    // by priority (priority 4.5, between builder and upgrader) instead of being gated
    // behind a fully-satisfied economy.  Without this, the spawn loop never reaches
    // step 3 (remote mining) when any economy role is under target — the common
    // case where upgraders are perpetually 1-2 below their desired count, blocking
    // remoteHarvester spawning forever.
    const remoteTarget = (0, remoteMining_1.remoteHarvesterTargetForRoom)(room);
    if (remoteTarget > 0)
        targets.remoteHarvester = remoteTarget;
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
    const reserved = {};
    const reservedSources = new Set();
    // Recovery: the spawn has wanted a creep it could not afford for too long
    // (a hauler/population collapse). Size bodies to energy on hand until it gets
    // going again, so it never idles forever waiting for a body it can't fund.
    const recovering = (room.memory.spawnStall || 0) >= SPAWN_STALL_LIMIT;
    // Did the spawn want an economy creep this tick but fail to afford it?
    let stuck = false;
    for (const spawn of idleSpawns) {
        // 1. Emergency: the delivery pipeline has collapsed — recover NOW.
        if (needsEmergency(room.name, census, reserved)) {
            if (spawnEmergency(spawn, room, data))
                bump(reserved, "harvester");
            else
                stuck = true;
            continue;
        }
        // 1.4. Container-but-no-miner emergency: the room has a source container
        // (so static mining SHOULD be active) but 0 miners, 0 haulers, and the
        // spawn is stuck below 150 e — the exact W44N38 deadlock (spawnStall 331,
        // energy 111/300, 0 miners, 0 haulers, source container sits empty).  The
        // normal economy path (step 2) tries to spawn a miner at priority 1 but
        // the minimum [WORK,CARRY] body (150 e) is unaffordable.  Once the spawn
        // reaches 150 e — which happens quickly now that builders/upgraders idle
        // in this state — this emergency path spawns a minimal miner immediately,
        // bypassing the economy priority system entirely so no other role can
        // consume the spawn cycle.  Fires before the bootstrapping and cross-room
        // rescue because a room that can't use its OWN containers is more urgent.
        if (needsMinerEmergency(room.name, data, census, reserved)) {
            if (spawnMinerEmergency(spawn, room, data))
                bump(reserved, "miner");
            else
                stuck = true;
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
        // 1.6. Cross-room rescue: when another owned room is dying (stalled for
        // many ticks with critically few harvesters), send a rescue harvester
        // BEFORE satisfying this room's economy targets.  A dying room outranks
        // any economy role — losing one upgrader cycle is negligible compared to
        // letting a room collapse into the "spawn with < 200 e" deadlock.
        // Previously at step 4 (after economy + expansion), it was unreachable
        // because a healthy room always has an economy role under target.
        if (tryRescueDeadRoom(spawn, room, data, census))
            continue;
        // 2. Economy roles + remoteHarvester, by priority.
        const role = pickEconomyRole(targets, census, room.name, reserved);
        if (role) {
            if (trySpawnRole(spawn, room, data, role, census, reserved, reservedSources, recovering)) {
                bump(reserved, role);
            }
            else {
                stuck = true;
            }
            continue;
        }
        // 3. Expansion (scout / claimer / pioneer) once the economy is satisfied.
        const req = (0, expansion_1.getExpansionSpawnRequest)(room, data);
        if (req) {
            // Fall back to available-energy sizing when the capacity body is
            // unaffordable — a smaller expansion creep NOW is infinitely better
            // than an idle spawn waiting for energy it may never accumulate while
            // upgraders burn the surplus.
            let body = req.body;
            if (data.energyAvailable < bodyCost(req.body)) {
                body = (0, config_1.bodyForRole)(req.role, data.energyAvailable, data.rcl);
            }
            if (data.energyAvailable >= bodyCost(body)) {
                const code = spawn.spawnCreep(body, name(req.role), { memory: req.memory });
                recordSpawnResult(room.name, req.role, code);
            }
            // Don't set stuck here: expansion is a bonus, not a must-spawn.
        }
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
function needsEmergency(home, census, reserved) {
    const harvesters = (0, census_1.roleCount)(census, home, "harvester") + (reserved.harvester || 0);
    if (harvesters > 0)
        return false;
    const miners = (0, census_1.roleCount)(census, home, "miner") + (reserved.miner || 0);
    const haulers = (0, census_1.roleCount)(census, home, "hauler") + (reserved.hauler || 0);
    return miners === 0 || haulers === 0;
}
function spawnEmergency(spawn, room, data) {
    // Size to energy ON HAND (don't wait for capacity we can't fill).
    const budget = Math.max(types_1.BODY_COST.work + types_1.BODY_COST.carry + types_1.BODY_COST.move, data.energyAvailable);
    const body = (0, config_1.bodyForRole)("harvester", budget, data.rcl);
    if (data.energyAvailable < bodyCost(body))
        return false;
    const code = spawn.spawnCreep(body, name("harvester"), {
        memory: { role: "harvester", homeRoom: room.name, bootstrap: true },
    });
    recordSpawnResult(room.name, "harvester", code);
    return code === OK;
}
/**
 * True when the room has source containers but 0 miners AND 0 haulers — the
 * static-mining pipeline is broken (container sits empty, no hauler to move
 * energy even if it were full).  The spawn must accumulate ≥ 150 e to spawn a
 * minimal [WORK,CARRY] miner; until then the economy roles just burn spawn
 * cycles on unaffordable bodies.
 */
function needsMinerEmergency(home, data, census, reserved) {
    // Only fires when source containers EXIST — a room with no containers is
    // bootstrapping normally and its harvesters handle energy just fine.
    if (!data.sources.some((s) => s.container))
        return false;
    const miners = (0, census_1.roleCount)(census, home, "miner") + (reserved.miner || 0);
    if (miners > 0)
        return false;
    const haulers = (0, census_1.roleCount)(census, home, "hauler") + (reserved.hauler || 0);
    if (haulers > 0)
        return false;
    // The spawn must have enough energy for even the minimal miner body.
    return data.energyAvailable >= types_1.BODY_COST.work + types_1.BODY_COST.carry; // 150 e
}
/**
 * Spawn a minimal miner (no MOVE — it crawls to the container once, then sits
 * there for life producing 2 e/tick per WORK) to restart the static-mining
 * pipeline in a room stuck in the container-but-no-miner deadlock.
 */
function spawnMinerEmergency(spawn, room, data) {
    // Absolute minimum: [WORK, CARRY] = 150 e.  No MOVE — the miner crawls to
    // its container (~20 ticks of travel for a ~20-tile distance at 0.5× speed
    // on roads), then produces energy for its full ~1500-tick lifespan.  The
    // travel cost is paid once; every WORK part produces 3000 lifetime energy.
    // A MOVE part would save ~10 ticks of initial travel at the cost of 50 e
    // that could have been another WORK (worth 3000 lifetime energy) or simply
    // the difference between spawning NOW vs stalling for another 20+ ticks.
    const body = [WORK, CARRY];
    if (data.energyAvailable < bodyCost(body))
        return false;
    // Find a containerized source with no miner assigned.
    const taken = new Set();
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.role === "miner" && c.memory.sourceId) {
            taken.add(c.memory.sourceId);
        }
    }
    const free = data.sources.find((s) => s.container && !taken.has(s.source.id));
    if (!free)
        return false; // shouldn't happen if needsMinerEmergency passed
    const code = spawn.spawnCreep(body, name("miner"), {
        memory: { role: "miner", homeRoom: room.name, sourceId: free.source.id },
    });
    recordSpawnResult(room.name, "miner", code);
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
function spawnBootstrappingEmergency(spawn, room, data, targets, census, reserved) {
    // Only fire when the expansion system is actively bootstrapping AND this
    // room is the base room (has the spawn that funds the expansion).
    const expMem = Memory.expansion;
    if (!expMem || expMem.state !== "bootstrapping" || !expMem.targetRoom)
        return false;
    // Count pioneers already alive or reserved this tick that target that room.
    const pioneerTarget = targets.pioneer || 0;
    if (pioneerTarget === 0)
        return false; // pioneer not wanted (shouldn't happen)
    let pioneersForTarget = 0;
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.role === "pioneer" && c.memory.targetRoom === expMem.targetRoom) {
            pioneersForTarget++;
        }
    }
    pioneersForTarget += reserved.pioneer || 0;
    if (pioneersForTarget > 0)
        return false; // at least one is already on the way
    // Size to energy ON HAND — a minimal pioneer (200e) is infinitely better
    // than waiting for a full-capacity body that may never be affordable while
    // upgraders burn the surplus.
    const minBudget = types_1.BODY_COST.work + types_1.BODY_COST.carry + types_1.BODY_COST.move; // 200e
    const budget = Math.max(minBudget, data.energyAvailable);
    const body = (0, config_1.bodyForRole)("pioneer", budget, data.rcl);
    if (data.energyAvailable < bodyCost(body))
        return false;
    const memory = {
        role: "pioneer",
        homeRoom: room.name,
        targetRoom: expMem.targetRoom,
    };
    const code = spawn.spawnCreep(body, name("pioneer"), { memory });
    recordSpawnResult(room.name, "pioneer", code);
    return code === OK;
}
/**
 * Cross-room rescue: when a room we own has a dying spawn (stalled for many
 * ticks with critically few harvesters — fewer than 2), use a HEALTHY room's
 * spawn to create a rescue harvester assigned to the dying room.
 *
 * A room with only 1 harvester (W44N38 at spawnStall 277, energyHarvested 2000)
 * is just as deadlocked as one with 0: the single harvester produces ~2 e/tick,
 * builders/upgraders drain the spawn at ≥ 50 e via gatherEnergy step 6, and
 * the spawn can never accumulate the 200 e needed for a replacement when the
 * harvester dies.  Without rescue, the room spirals toward 0 harvesters — the
 * exact deadlock this path was built for.
 *
 * The rescue harvester is spawned in the rescuing room but has homeRoom set to
 * the dying room.  It travels there immediately, starts mining from the local
 * sources, and delivers energy to the dying spawn.
 *
 * Fires BEFORE economy roles (step 1.6) so it isn't gated behind a fully-
 * satisfied home economy.  A dying room outranks any single economy creep in
 * the healthy room.  Rescues at most one room per tick.
 */
function tryRescueDeadRoom(spawn, room, data, census) {
    // Don't rescue if this room can barely afford its own creeps.
    if (data.energyAvailable < 250)
        return false;
    for (const other of (0, roomData_1.myRooms)()) {
        if (other.name === room.name)
            continue;
        const otherData = (0, roomData_1.getRoomData)(other);
        if (otherData.spawns.length === 0)
            continue; // nothing to rescue
        const stall = other.memory.spawnStall || 0;
        // Stall ≥ 100 is long enough to indicate a real problem (the normal refill
        // wait for a capacity-sized body in a healthy room is < 50 ticks).  Lower
        // than the old 150 to catch energy-poverty rooms before they hit 0 harvesters.
        if (stall < 100)
            continue;
        // A room with fewer than 2 harvesters cannot sustain itself: the single
        // harvester produces ~2 e/tick, and the spawn can barely accumulate 200 e
        // for a replacement before the last one dies.  Resetting the stall on > 0
        // (the old code) masked this half-dead state — the room limped at 1
        // harvester / 2000 energy per 1k ticks for thousands of ticks (live).
        const otherHarvesters = (0, census_1.roleCount)(census, other.name, "harvester");
        if (otherHarvesters >= 2) {
            // Room has enough harvesters to be self-sustaining — clear any stale stall.
            other.memory.spawnStall = 0;
            continue;
        }
        // Spawn a minimal harvester for the dying room.  Size to energy on hand so
        // the rescue never stalls on budget — a small harvester that arrives NOW
        // is infinitely better than a fat one that waits for capacity.
        const body = (0, config_1.bodyForRole)("harvester", data.energyAvailable, data.rcl);
        if (data.energyAvailable < bodyCost(body))
            return false;
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
function pickEconomyRole(targets, census, home, reserved) {
    var _a, _b, _c, _d, _e;
    const roles = Object.keys(targets).filter((r) => (targets[r] || 0) > 0);
    // Builder-starvation guard: when construction sites exist and no builder is
    // alive or reserved this tick, temporarily elevate builder priority so at
    // least one builder gets spawned to work the sites.
    const builderTarget = targets.builder || 0;
    const builderCount = (0, census_1.roleCount)(census, home, "builder") + (reserved.builder || 0);
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
        const rcl = (_b = (_a = room === null || room === void 0 ? void 0 : room.controller) === null || _a === void 0 ? void 0 : _a.level) !== null && _b !== void 0 ? _b : 0;
        const hasStorage = !!(room === null || room === void 0 ? void 0 : room.storage);
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
        const pioneerCount = (0, census_1.roleCount)(census, home, "pioneer") + (reserved.pioneer || 0);
        bootstrappingPioneer =
            (((_c = Memory.expansion) === null || _c === void 0 ? void 0 : _c.state) === "bootstrapping") &&
                pioneerTarget > 0 &&
                pioneerCount < pioneerTarget;
    }
    // Upgrader-starvation guard: when GCL is low (≤ 2) every control point
    // gates expansion — maintain a minimum upgrader corps so control points
    // keep flowing even while higher-priority roles (haulers) are under target.
    const upgraderTarget = targets.upgrader || 0;
    const upgraderCount = (0, census_1.roleCount)(census, home, "upgrader") + (reserved.upgrader || 0);
    // Minimum floor: at RCL ≥ 5 the economy is mature enough to feed 3 upgraders
    // without strain; at RCL 3-4, 2; at RCL 1-2 the GCL push already elevates
    // the target through config.ts, so we use a lower floor.
    // Guarded behind a typeof check so the function remains callable in Node.js
    // test environments where the Screeps `Game` global does not exist.
    let upgraderStarved = false;
    if (typeof Game !== "undefined") {
        const room = Game.rooms[home];
        const rcl = (_e = (_d = room === null || room === void 0 ? void 0 : room.controller) === null || _d === void 0 ? void 0 : _d.level) !== null && _e !== void 0 ? _e : 0;
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
    // Catch-up fires from 0 builders up to (but not including) the full target.
    // The old ceil(target/3) threshold deactivated at 2 builders for a target of 3,
    // leaving the last builder to compete at storage-emergency priority 1.5 — which
    // loses to any other under-target role and can never close the gap.  Keeping the
    // guard active until target is met guarantees the builder corps reaches its full
    // strength in one uninterrupted burst, roughly tripling construction throughput.
    //
    // ENERGY-POVERTY OVERRIDE: when the spawn+extensions buffer is critically low
    // (< 200 e, the minimum harvester body), the catch-up guard DEACTIVATES so the
    // natural priority order (harvester=0) wins.  Elevating builders above
    // harvesters during an energy shortage starves the colony of producers — the
    // spawn can afford neither, and when it finally scrapes together 200 e, it
    // must spawn a HARVESTER (energy producer), not a builder (energy consumer).
    // Guarded behind typeof check for Node.js test compatibility.
    let energyCritical = false;
    if (typeof Game !== "undefined") {
        const room = Game.rooms[home];
        energyCritical = !!(room && room.energyAvailable < 200);
    }
    const builderCatchUp = builderTarget >= 3 && builderCount < builderTarget && !energyCritical;
    roles.sort((a, b) => {
        let pa = config_1.ROLE_PRIORITY[a];
        let pb = config_1.ROLE_PRIORITY[b];
        if (builderStarved || storageEmergency) {
            // Elevate builder to 1.5: above hauler(2) + pioneer(3), below miner(1).
            // The storageEmergency variant fires until the full target is met, not
            // just until the first builder spawns, so storage construction gets the
            // full builder corps it needs.
            if (a === "builder")
                pa = 1.5;
            if (b === "builder")
                pb = 1.5;
        }
        if (bootstrappingPioneer) {
            // Elevate pioneer to 1.2: above storage-emergency builder(1.5) AND
            // hauler(2), below miner(1).  A claimed room without a spawn generates
            // ZERO control points and eventually downgrades — the pioneer that
            // builds the spawn unlocks the new room's entire economy, which is a
            // force-multiplier worth more than one extra builder cycle in the home
            // room.  Once the spawn exists the bootstrapping state resolves and
            // the priority bump deactivates.
            if (a === "pioneer")
                pa = 1.2;
            if (b === "pioneer")
                pb = 1.2;
        }
        if (upgraderStarved) {
            // Elevate upgrader to 2.5: above hauler(2), below miner(1).
            // Builder at 1.5 (when starved) still outranks upgrader at 2.5,
            // so construction-critical builders always come first.
            if (a === "upgrader")
                pa = 2.5;
            if (b === "upgrader")
                pb = 2.5;
        }
        if (builderCatchUp) {
            // Elevate builder to -0.5: above harvester(0) so builders can catch up
            // from a severe shortage (0-1 builders vs target ≥ 3).  This is the
            // strongest elevation — it beats EVERY economy role including harvester
            // replacement, which is the root cause of the persistent 1-builder trap.
            // Once the count reaches the threshold the guard deactivates and normal
            // ordering resumes.
            if (a === "builder")
                pa = -0.5;
            if (b === "builder")
                pb = -0.5;
        }
        return pa - pb;
    });
    for (const role of roles) {
        const want = targets[role] || 0;
        const have = (0, census_1.roleCount)(census, home, role) + (reserved[role] || 0);
        if (have < want)
            return role;
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
function economyBudget(data, haulers, recovering) {
    const bootstrapping = data.sources.every((s) => !s.container);
    const degraded = !bootstrapping && haulers === 0;
    if (bootstrapping || degraded || recovering) {
        return Math.max(types_1.BODY_COST.work + types_1.BODY_COST.carry + types_1.BODY_COST.move, data.energyAvailable);
    }
    return data.energyCapacity;
}
/**
 * Minimum spawn-energy budget for a MINER, or 0 for "no floor" (normal sizing).
 *
 * A miner is the room's income engine, so a RUNT miner — 1-3 WORK, produced when
 * a stalled or collapsed spawn sizes the body to energy on hand — permanently
 * caps that source's output and can lock the colony in a low-production
 * equilibrium (live W43N38: income halved after dedicated miners fell 2→1 and the
 * drained spawn kept replacing them undersized). When the room can CLEARLY afford
 * a real miner — capacity ≥ 550 (≈5+ extensions, enough to hold the ~450e of a
 * 4-WORK miner) AND at least one other energy producer is alive — we floor the
 * miner budget at 450e so it is never spawned below 4 WORK; the caller then WAITS
 * for that body instead of runt-sizing to available energy.
 *
 * The "≥1 other producer" guard is what makes the wait deadlock-safe: the other
 * producer keeps refilling the spawn toward 450e, and a genuine 0-producer
 * collapse is already caught earlier by the emergency-harvester path (which sizes
 * to energy on hand). Bootstrap, sole-producer, and low-capacity rooms return 0
 * and keep available-sizing, so the spawn can always fund SOME miner.
 *
 * Pure + exported for unit testing.
 */
function minerProductionFloor(energyCapacity, otherProducers) {
    return energyCapacity >= 550 && otherProducers >= 1 ? 450 : 0;
}
function trySpawnRole(spawn, room, data, role, census, reserved, reservedSources, recovering) {
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
    const haulers = (0, census_1.roleCount)(census, room.name, "hauler") + (reserved.hauler || 0);
    const budget = economyBudget(data, haulers, recovering);
    let body = (0, config_1.bodyForRole)(role, budget, data.rcl);
    // Miner production floor: never lock in a runt miner in a room that can afford
    // a real one (see minerProductionFloor). Producers already alive/reserved keep
    // refilling the spawn while we wait, so the wait cannot deadlock in a HEALTHY
    // room.  BUT when the spawn has been stalled for SPAWN_STALL_LIMIT+ ticks
    // (recovering=true), the floor is UNREACHABLE — builders drain the spawn at
    // minSpawnDrain=200 via gatherEnergy step 6, and the spawn oscillates between
    // ~0-250 e, never reaching the 450 e floor.  Bypassing the floor when
    // recovering lets the spawn produce whatever miner it can afford NOW, breaking
    // the deadlock (live W43N38: spawnStall 138, energy 210/2300, 1 miner for 2
    // containerized sources → second miner never spawns because 450 e floor
    // unreachable).  A runt miner is better than NO miner; once income rises the
    // spawn can replace it with a proper body at end-of-life.
    const minerFloor = role === "miner"
        ? minerProductionFloor(data.energyCapacity, (0, census_1.roleCount)(census, room.name, "miner") +
            (0, census_1.roleCount)(census, room.name, "harvester") +
            (reserved.miner || 0) +
            (reserved.harvester || 0))
        : 0;
    if (minerFloor > 0 && !recovering) {
        // Size to at least the floor and WAIT for it rather than runt-sizing down.
        body = (0, config_1.bodyForRole)("miner", Math.min(data.energyCapacity, Math.max(budget, minerFloor)), data.rcl);
        if (data.energyAvailable < bodyCost(body))
            return false; // wait for a proper miner
    }
    else if (data.energyAvailable < bodyCost(body)) {
        // Fall back to an available-energy body: a smaller creep NOW is infinitely
        // better than an idle spawn waiting for capacity it may never reach.
        body = (0, config_1.bodyForRole)(role, data.energyAvailable, data.rcl);
    }
    if (data.energyAvailable < bodyCost(body))
        return false; // can't afford even the minimal body
    const memory = { role, homeRoom: room.name };
    if (role === "miner") {
        const sid = pickFreeContainerSource(data, census, reservedSources);
        if (!sid)
            return false;
        memory.sourceId = sid;
        reservedSources.add(sid);
    }
    if (role === "remoteHarvester") {
        // Remote harvesters need sourceId and targetRoom so the role runner knows
        // where to mine and where to deliver.  Without these the creep idles
        // forever — the runtime symptom of the bug this block fixes.
        const rmMem = (0, remoteMining_1.ensureRemoteMiningMemory)(room.name);
        const source = (0, remoteMining_1.pickRemoteSource)(room.name, rmMem);
        if (!source)
            return false;
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
function pickFreeContainerSource(data, census, reservedSources) {
    for (const sd of data.sources) {
        if (!sd.container)
            continue;
        const id = sd.source.id;
        if ((census.minersBySource[id] || 0) > 0)
            continue;
        if (reservedSources.has(id))
            continue;
        return id;
    }
    return null;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function spawnRequest(spawn, req) {
    spawn.spawnCreep(req.body, name(req.memory.role), { memory: req.memory });
}
function name(role) {
    return `${role}_${Game.time}_${nextId++}`;
}
function bump(reserved, role) {
    reserved[role] = (reserved[role] || 0) + 1;
}
//# sourceMappingURL=spawning.js.map