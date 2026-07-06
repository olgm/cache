"use strict";
/**
 * Cache — economy tunables: dynamic body builders + RCL-scaled role targets.
 *
 * Bodies scale with `energyCapacityAvailable` (so creeps grow as the room builds
 * extensions), and target counts scale with RCL, source/container count, storage
 * energy and construction load. This is the single biggest lever for climbing
 * out of the "5 tiny creeps forever" trap the old hardcoded plan was stuck in.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PRIORITY = void 0;
exports.minerBody = minerBody;
exports.haulerBody = haulerBody;
exports.workerBody = workerBody;
exports.harvesterBody = harvesterBody;
exports.upgraderBody = upgraderBody;
exports.defenderBody = defenderBody;
exports.remoteHarvesterBody = remoteHarvesterBody;
exports.scoutBody = scoutBody;
exports.claimerBody = claimerBody;
exports.pioneerBody = pioneerBody;
exports.roleTargets = roleTargets;
exports.bodyForRole = bodyForRole;
const types_1 = require("./types");
/** Hard limit: a creep may have at most 50 body parts. */
const MAX_PARTS = 50;
function unitCost(unit) {
    let c = 0;
    for (const p of unit)
        c += types_1.BODY_COST[p];
    return c;
}
/**
 * Repeat a unit pattern as many times as `budget` energy and `maxRepeat` allow,
 * never exceeding 50 parts. Always returns at least one unit (callers guarantee
 * affordability, or accept an undersized emergency creep).
 */
function repeat(unit, budget, maxRepeat) {
    const cost = unitCost(unit);
    let n = Math.floor(budget / cost);
    if (n > maxRepeat)
        n = maxRepeat;
    while (n * unit.length > MAX_PARTS)
        n--;
    if (n < 1)
        n = 1;
    const body = [];
    for (let i = 0; i < n; i++)
        body.push(...unit);
    return body;
}
// ---------------------------------------------------------------------------
// Per-role body builders (all driven by an energy budget)
// ---------------------------------------------------------------------------
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
function minerBody(budget) {
    // Largest whole-unit miner (≤5 WORK) the budget affords.
    let bestW = 1;
    for (let w = 5; w >= 1; w--) {
        const m = Math.min(3, Math.max(1, Math.ceil(w / 2)));
        const cost = w * types_1.BODY_COST.work + types_1.BODY_COST.carry + m * types_1.BODY_COST.move;
        if (cost <= budget) {
            bestW = w;
            break;
        }
    }
    const body = [];
    for (let i = 0; i < bestW; i++)
        body.push(WORK);
    body.push(CARRY);
    // MOVE proportional to WORK (1:2 ratio, min 1, max 3 — a miner barely moves).
    const baseMove = Math.min(3, Math.max(1, Math.ceil(bestW / 2)));
    for (let i = 0; i < baseMove; i++)
        body.push(MOVE);
    return body;
}
/** Hauler: CARRY/MOVE at a 2:1 ratio (assumes roads; half-speed when loaded off-road). */
function haulerBody(budget) {
    return repeat([CARRY, CARRY, MOVE], budget, 8); // up to 16 CARRY = 800 capacity
}
/**
 * Spend any leftover budget (after whole units) on extra WORK then a MOVE, so a
 * creep uses its FULL energy capacity instead of leaving a fraction of a unit
 * unspent. This matters most during the cap=300 bootstrap, where [WORK,CARRY,
 * MOVE] (200e, 1 WORK) wastes 100e — filling it to 2 WORK halves the time to
 * build the first extensions, which is the whole early-game bottleneck.
 */
function fillWork(body, leftover) {
    let left = leftover;
    while (left >= types_1.BODY_COST.work && body.length < MAX_PARTS) {
        body.push(WORK);
        left -= types_1.BODY_COST.work;
    }
    if (left >= types_1.BODY_COST.move && body.length < MAX_PARTS)
        body.push(MOVE);
    return body;
}
/** Generalist worker (builder): balanced, budget-filling. */
function workerBody(budget, maxRepeat) {
    const unitCostV = unitCost([WORK, CARRY, MOVE]);
    const n = Math.max(1, Math.min(maxRepeat, Math.floor(budget / unitCostV)));
    const body = repeat([WORK, CARRY, MOVE], budget, maxRepeat);
    // Only fill when the BUDGET (not maxRepeat) was the binding constraint, so
    // size-capped roles stay balanced.
    return n < maxRepeat ? fillWork(body, budget - n * unitCostV) : body;
}
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
function harvesterBody(budget) {
    // Low-budget escape hatch: a [WORK,CARRY,MOVE] minimal harvester (200e) is
    // infinitely better than an idle spawn waiting for 250e it may never reach.
    if (budget < 250)
        return [WORK, CARRY, MOVE];
    const unit = [WORK, CARRY, CARRY, MOVE]; // 250e
    const uc = unitCost(unit); // = 250
    const n = Math.max(1, Math.min(5, Math.floor(budget / uc)));
    const body = [];
    for (let i = 0; i < n; i++)
        body.push(...unit);
    let left = budget - n * uc;
    // Fill leftover: WORK first (mining speed), then CARRY.
    let workParts = n; // each unit has 1 WORK
    while (left >= types_1.BODY_COST.work && body.length < MAX_PARTS && workParts < 5) {
        body.push(WORK);
        left -= types_1.BODY_COST.work;
        workParts++;
    }
    while (left >= types_1.BODY_COST.carry && body.length < MAX_PARTS) {
        body.push(CARRY);
        left -= types_1.BODY_COST.carry;
    }
    if (left >= types_1.BODY_COST.move && body.length < MAX_PARTS)
        body.push(MOVE);
    return body;
}
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
 */
function upgraderBody(budget, rcl) {
    const workHeavy = Game.gcl.level <= 2;
    const unit = workHeavy
        ? [WORK, WORK, CARRY, MOVE] // 2:1:1, 300e
        : [WORK, CARRY, MOVE]; // 1:1:1, 200e
    const uc = unitCost(unit);
    const maxByCap = rcl >= 8 ? 4 : 8;
    const n = Math.max(1, Math.min(maxByCap, Math.floor(budget / uc)));
    const body = repeat(unit, budget, maxByCap);
    let left = budget - n * uc;
    if (workHeavy) {
        // WORK-first fill: every spare joule buys more upgrading speed.
        while (left >= types_1.BODY_COST.work && body.length < MAX_PARTS) {
            body.push(WORK);
            left -= types_1.BODY_COST.work;
        }
        while (left >= types_1.BODY_COST.carry && body.length < MAX_PARTS) {
            body.push(CARRY);
            left -= types_1.BODY_COST.carry;
        }
        if (left >= types_1.BODY_COST.move && body.length < MAX_PARTS)
            body.push(MOVE);
    }
    else {
        // Balanced fill: WORK+CARRY pairs, then any final MOVE.
        while (left >= types_1.BODY_COST.work + types_1.BODY_COST.carry && body.length < MAX_PARTS - 1) {
            body.push(WORK, CARRY);
            left -= types_1.BODY_COST.work + types_1.BODY_COST.carry;
        }
        if (left >= types_1.BODY_COST.move && body.length < MAX_PARTS)
            body.push(MOVE);
    }
    return body;
}
/** Melee defender: ATTACK with 1:1 MOVE so it stays mobile while fighting. */
function defenderBody(budget) {
    return repeat([ATTACK, MOVE], budget, 10);
}
/**
 * Remote harvester body — CARRY-heavy with extra MOVE for inter-room travel.
 *
 * Each unit (WORK, CARRY, CARRY, MOVE, MOVE, 350e) gives a 2:1 CARRY:WORK ratio
 * with enough MOVE to stay mobile across rooms even when fully loaded. Leftover
 * budget fills CARRY first (long walks reward big payloads), then WORK.
 */
function remoteHarvesterBody(budget) {
    const unit = [WORK, CARRY, CARRY, MOVE, MOVE]; // 350e
    const uc = unitCost(unit);
    const n = Math.max(1, Math.min(4, Math.floor(budget / uc)));
    const body = [];
    for (let i = 0; i < n; i++)
        body.push(...unit);
    let left = budget - n * uc;
    while (left >= types_1.BODY_COST.carry && body.length < MAX_PARTS) {
        body.push(CARRY);
        left -= types_1.BODY_COST.carry;
    }
    while (left >= types_1.BODY_COST.work && body.length < MAX_PARTS) {
        body.push(WORK);
        left -= types_1.BODY_COST.work;
    }
    if (left >= types_1.BODY_COST.move && body.length < MAX_PARTS)
        body.push(MOVE);
    return body;
}
/** Scout: a single MOVE — disposable intel gatherer. */
function scoutBody() {
    return [MOVE];
}
/** Claimer: one CLAIM + MOVE (600+50 = 650e; needs RCL2+ capacity). */
function claimerBody(budget) {
    if (budget >= 1300)
        return [CLAIM, CLAIM, MOVE, MOVE];
    return [CLAIM, MOVE];
}
/** Pioneer: a big mobile generalist that bootstraps a freshly-claimed room. */
function pioneerBody(budget) {
    return workerBody(Math.min(budget, 1500), 6);
}
/**
 * Compute the desired creep population for a room from its current state.
 * Expansion roles (scout/claimer/pioneer) are NOT included here — the expansion
 * manager requests those separately. `current` is the room's live role counts,
 * used to keep an invariant the desired-state alone can't express.
 */
function roleTargets(data, current) {
    const { rcl, sources, storage, constructionSites, hostiles, towers } = data;
    const sourceCount = sources.length;
    const withContainer = sources.filter((s) => s.container).length;
    const totalOpenSlots = sources.reduce((sum, s) => sum + s.openSlots, 0);
    const liveHaulers = current.hauler || 0;
    const targets = {};
    // --- Mining: dedicated miners on container-equipped sources ---
    targets.miner = withContainer;
    // --- Generalist harvesters: cover sources that have no container yet, and
    //     carry the whole economy during the RCL1-2 bootstrap before containers
    //     exist. Capped by the open tiles around the uncovered sources. ---
    const uncovered = sourceCount - withContainer;
    if (withContainer === 0) {
        // Pure bootstrap: scale harvesters by RCL so the spawn reaches upgraders
        // quickly.  At RCL 1 every control point gates container unlock (RCL 2);
        // spawning 6 harvesters before the first upgrader starves the controller
        // for hundreds of ticks — the exact pathology that keeps a freshly-claimed
        // room at 0 control points forever.  A smaller harvester corps still feeds
        // the spawn (each harvester mines 2 e/tick × 2 sources = 4 e/tick baseline)
        // while freeing spawn cycles for the upgrader that converts energy into
        // the RCL 2 unlock.
        if (rcl <= 1) {
            targets.harvester = Math.min(sourceCount + 1, totalOpenSlots, 3);
        }
        else if (rcl === 2) {
            targets.harvester = Math.min(sourceCount * 2, totalOpenSlots, 4);
        }
        else {
            targets.harvester = Math.min(sourceCount * 3, totalOpenSlots, 6);
        }
    }
    else if (uncovered > 0) {
        targets.harvester = Math.min(uncovered * 2, totalOpenSlots);
    }
    else {
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
        // Base: one hauler per source-container plus one extra so the pair keeps
        // energy moving even when one hauler is in transit.  At RCL 3+ miners are
        // large enough to warrant at least 3 haulers for two sources — the old
        // floor of 2 was exactly breakeven and caused chronic energy pile-up.
        // At RCL 4+ miners reach 4-5 WORK (8-10 e/tick each) — the extra hauler
        // prevents the source containers from capping between trips.
        let haulers = Math.max(withContainer + 1, rcl >= 5 ? 6 : rcl >= 4 ? 5 : rcl >= 3 ? 3 : 2);
        if (storage)
            haulers += 1;
        // RCL 5+ miners have 5 WORK each (10 e/tick per source); one more hauler
        // prevents the container from capping between hauler trips.
        if (rcl >= 5)
            haulers += 1;
        // Surplus detection: if source containers are >50% full the haulers can't
        // keep up with miner output — add capacity so energy doesn't cap and get
        // wasted.  Threshold lowered from 1400 (70%) to 1000 (50%) to catch
        // bottlenecks earlier, before the container hits its 2000e cap.
        const fullContainers = sources.filter((s) => s.container && s.container.store[RESOURCE_ENERGY] > 1000).length;
        if (fullContainers >= 2)
            haulers += 2;
        else if (fullContainers >= 1)
            haulers += 1;
        // Bump haulers when spawn+extensions are near-full (>80%) — it means
        // energy is flooding the buffers and should be routed to the controller
        // container / storage faster so upgraders can burn it.
        if (!storage) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (totalCap > 0 && totalE > totalCap * 0.8)
                haulers += 1;
        }
        // Controller-starvation signal: spawn buffers are healthy (>50% full) but
        // the controller container is nearly empty (<20%).  Energy is piling up in
        // the spawn instead of reaching the upgraders — one more hauler helps
        // route the surplus before the source containers cap and waste energy.
        if (!storage) {
            const cc = data.controllerContainer;
            const ccEnergy = cc ? cc.store[RESOURCE_ENERGY] : 0;
            const ccCap = cc ? cc.store.getCapacity(RESOURCE_ENERGY) : 2000;
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (cc &&
                totalCap > 0 &&
                totalE > totalCap * 0.5 &&
                ccEnergy < ccCap * 0.2) {
                haulers += 1;
            }
        }
        targets.hauler = Math.min(haulers, sourceCount * 2 + 2);
    }
    else {
        targets.hauler = 0;
    }
    // --- Upgraders: scaled by RCL, confirmed surplus, and GCL urgency. ---
    // GCL progress is earned by controller upgrades — each energy unit spent
    // upgrading yields 1 control point.  The more upgraders we keep busy, the
    // faster GCL grows.  But spawning more upgraders than the economy can feed
    // is counterproductive: underfed upgraders spend most ticks walking to
    // distant energy sources, burning CPU and clogging roads for zero net gain.
    //
    // The best signal of how much surplus energy is reaching the controller is
    // the controller container's fill level: if haulers keep it topped up, the
    // colony has real surplus and can sustain more upgraders; if it's always
    // empty, the surplus doesn't exist yet — adding more upgraders just adds
    // hungry mouths that fight over scraps.
    //
    // BOOTSTRAP EXCEPTION: with no source container yet (no static mining), the
    // colony cannot sustain a crowd of upgraders — they compete with builders for
    // the same scarce energy AND sit ahead of them in spawn priority, starving the
    // very construction (the source containers) that ends the bootstrap.  Scale
    // the bootstrap upgrader count by the fill level of the spawn+extensions
    // buffer — allowing up to 3 when energy is flooding, down to 1 when tight.
    if (withContainer === 0) {
        let upg = 1;
        const spawnExt = [...data.spawns, ...data.extensions];
        const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
        const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
        if (totalCap > 0) {
            if (totalE > totalCap * 0.9)
                upg = 3;
            else if (totalE > totalCap * 0.6)
                upg = 2;
        }
        // GCL push at GCL 1-2: expansion is gated on GCL, so every spare joule
        // must go into the controller.  Still capped by the bootstrap ceiling so
        // we don't starve builders (the source containers end the bootstrap).
        if (Game.gcl.level === 1)
            upg = Math.max(upg, 3);
        else if (Game.gcl.level === 2)
            upg = Math.max(upg, 2);
        targets.upgrader = upg;
    }
    else {
        // --- Post-bootstrap: the controller container is the key surplus signal. ---
        const cc = data.controllerContainer;
        const ccEnergy = cc ? cc.store[RESOURCE_ENERGY] : 0;
        const ccCap = cc ? cc.store.getCapacity(RESOURCE_ENERGY) : 2000;
        let upg = 1;
        if (rcl >= 8) {
            upg = 1; // capped at 15 energy/tick — one fat upgrader is enough
        }
        else if (storage) {
            const e = storage.store[RESOURCE_ENERGY];
            upg = Math.min(6, 2 + Math.floor(e / 12000));
        }
        else if (cc) {
            // Controller container exists — scale upgrader count by how full it is.
            // A topped-up container means surplus energy is reliably arriving; an
            // empty one means the colony is energy-starved and more upgraders would
            // just fight over nothing.
            const fill = ccEnergy / ccCap;
            if (fill >= 0.8)
                upg = Math.max(5, rcl >= 4 ? 5 : 4);
            else if (fill >= 0.5)
                upg = Math.max(4, rcl >= 4 ? 4 : 3);
            else if (fill >= 0.2)
                upg = Math.max(3, rcl >= 3 ? 3 : 2);
            else
                upg = Math.min(2, rcl >= 3 ? 2 : 1);
        }
        else {
            // No controller container yet: scale by RCL.  Without a dedicated supply,
            // upgraders walk to source containers — but at GCL 1-2 the controller is
            // the ONLY path to expansion, so we push harder than efficiency alone
            // would dictate.  The GCL push (below) adds further urgency.
            if (rcl >= 6)
                upg = 5;
            else if (rcl >= 4)
                upg = 4;
            else if (rcl >= 3)
                upg = 3;
            else
                upg = 2;
        }
        // GCL push: when GCL is low every control point counts — expansion is
        // gated on GCL.  Control points earned now compound into earlier multi-room
        // expansion — the single biggest strategic lever in the early game.
        //
        // BUT a blind hard floor that ignores the economy's actual surplus is
        // self-defeating: if the controller container is empty (haulers can't keep
        // up), spawning more upgraders just adds hungry mouths that fight over
        // scraps, burning spawn time and CPU for zero net gain.  The best
        // real-time signal of whether the colony can sustain more upgraders is the
        // controller container fill — it tells us energy is reliably arriving.
        //
        // When the container is full (≥70 %), the GCL push is aggressive because
        // the surplus is real.  When it's nearly empty (<15 %), the floor is the
        // base sustainable count — adding more mouths would starve everyone.
        // Without a controller container, we use spawn+extension fill as a proxy
        // (the only buffer the upgraders can draw from).
        if (Game.gcl.level === 1 || Game.gcl.level === 2) {
            let surplusFill;
            if (cc) {
                surplusFill = ccEnergy / ccCap;
            }
            else {
                const spawnExt = [...data.spawns, ...data.extensions];
                const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
                const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
                surplusFill = totalCap > 0 ? totalE / totalCap : 0;
            }
            if (Game.gcl.level === 1) {
                // GCL 1: every control point gates multi-room expansion — be aggressive.
                // Even when the controller container is nearly empty, the colony may be
                // converting energy at high throughput (upgraders drain the container as
                // fast as haulers fill it).  Use a floor of 5 when ANY surplus exists so
                // we never under-convert during the critical GCL 1→2 push.
                if (surplusFill >= 0.5)
                    upg = Math.max(upg, 6);
                else if (surplusFill >= 0.2)
                    upg = Math.max(upg, 5);
                else
                    upg = Math.max(upg, 4);
            }
            else {
                // GCL 2: one notch less aggressive per band.
                if (surplusFill >= 0.5)
                    upg = Math.max(upg, 5);
                else if (surplusFill >= 0.2)
                    upg = Math.max(upg, 4);
                else
                    upg = Math.max(upg, 3);
            }
        }
        // Waste detection: when spawn+extensions are filling up AND there is no
        // storage, harvested energy risks capping out at the buffers — every
        // capped joule is a wasted joule.  Route surplus into control points more
        // aggressively: +1 at 50 % fill (modest surplus), +2 at 75 % (flood).
        // Only fires when the controller container already has energy (the surplus
        // is real — haulers are delivering, so more upgraders can actually work).
        if (!storage && cc && ccEnergy > 0) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (totalCap > 0) {
                if (totalE > totalCap * 0.75)
                    upg += 2;
                else if (totalE > totalCap * 0.5)
                    upg += 1;
            }
        }
        // Storage emergency: when a room at RCL 4+ has no storage, the colony is
        // missing its mid-game energy buffer.  Storage unlocks the expansion gate,
        // prevents energy waste when buffers fill, and is the single most important
        // structure after the spawn.  Construction costs 30 000 energy — a major
        // investment.  The upgrader corps is capped at 3 so surplus energy routes
        // into construction instead of being burned by an oversized upgrader fleet
        // that starves the builder corps.  This cap MUST fire AFTER the GCL push
        // and waste detection: both use Math.max / additive bumps that would
        // otherwise undo the cap (the live "storage:0 at RCL 5 with 5 upgraders"
        // bug).  Once storage exists, the normal GCL push resumes with the full
        // energy buffer behind it.
        const storageMissing = rcl >= 4 && !storage;
        if (storageMissing) {
            upg = Math.min(upg, 3);
        }
        // No dedicated supply (neither a controller container NOR storage): upgraders
        // draw from distant source containers shared with the haulers and burn most
        // ticks walking, so beyond a handful they just fight over scarce energy and
        // clog roads. The GCL push above keys off the spawn+extension FILL proxy,
        // which balloons this to 6 exactly when energy piles up — but energy piles up
        // *because* there is no consumer, which is better answered by building the
        // controller container (a builder's job) than by spawning upgraders that
        // cannot be fed. Cap the no-supply case so the surplus routes into
        // construction; the push resumes its full range once a real supply exists.
        if (!cc && !storage)
            upg = Math.min(upg, rcl >= 6 ? 5 : 4);
        // Hard cap at 6: a single room produces at most ~20e/tick from two sources.
        // Even with perfect efficiency, more than 6 upgraders means each gets < 3.3
        // energy/tick — they'd spend more ticks walking than upgrading.
        targets.upgrader = Math.min(upg, 6);
    }
    // --- Builders: scale with construction load. ---
    const sites = constructionSites.length;
    if (sites > 0) {
        targets.builder = Math.min(Math.max(1, Math.ceil(sites / 5)), rcl >= 4 ? 3 : 2);
    }
    else {
        targets.builder = 0;
    }
    // Storage emergency: when a room at RCL 4+ has no storage, the builder target
    // floor is raised to ensure construction progresses.  Without this, the
    // builder target is site-count-gated (sites / 5), and a room with few sites
    // — or where the storage site is the only one left — would only allocate 1
    // builder.  One builder spending half its ticks walking to refill cannot
    // finish a 30 000-energy storage in a reasonable timeframe.
    if (rcl >= 4 && !storage) {
        targets.builder = Math.max(targets.builder || 0, rcl >= 5 ? 3 : 2);
    }
    // --- Defenders: only when threatened AND towers can't cover it. ---
    if (hostiles.length > 0 && towers.length === 0) {
        targets.defender = Math.min(hostiles.length, 3);
    }
    else {
        targets.defender = 0;
    }
    return targets;
}
/** Build the body for an economy role given the room's spawn-energy budget. */
function bodyForRole(role, budget, rcl) {
    switch (role) {
        case "miner":
            return minerBody(budget);
        case "hauler":
            return haulerBody(budget);
        case "harvester":
            return harvesterBody(budget);
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
exports.ROLE_PRIORITY = {
    harvester: 0, // economy lifeblood (bootstrap)
    miner: 1,
    hauler: 2,
    defender: 2, // urgent when present
    // Pioneers at 3 (was 6) so they compete above builders/upgraders during
    // bootstrapping.  A claimed room without a spawn generates ZERO control
    // points and eventually downgrades; a pioneer that builds the spawn unlocks
    // the new room's own spawning, which is a force-multiplier worth more than
    // one extra upgrader cycle in the home room.  Once the spawn exists the
    // expansion state goes idle and getExpansionSpawnRequest returns null —
    // the priority bump has no effect outside active bootstrapping.
    pioneer: 3,
    // Builders BEFORE upgraders. The builder target is construction-gated (0 when
    // nothing is queued — see roleTargets), so a single spawn must fund the colony's
    // PLANNED structures — towers (defense) and storage (logistics) — before the
    // discretionary upgrader fleet. With upgrader ahead of builder, the GCL-1 push
    // inflates the upgrader target to 6 and permanently starves the lowest-priority
    // builder: the spawn never works down to it, so tower/storage construction sites
    // sit at progress 0 forever (the observed RCL-5-with-0-towers pathology — the
    // construction planner placed the sites, but no builder was ever spawned to
    // build them). Idle builders fall back to upgrading the controller, so RCL/GCL
    // still progress while the base is being built; dedicated upgraders follow once
    // the construction backlog is funded.
    builder: 4,
    // remoteHarvester AFTER builders (4 < 4.5 < upgrader 5). Remote mining must
    // never starve HOME construction (storage / source+controller containers /
    // towers) — that starvation is what kept RCL5 storage unbuilt through the
    // 2026-06-27 collapse (e548af4 had placed it at priority 3, ABOVE builders).
    // It still outranks the discretionary upgrader fleet, so e548af4's intent
    // holds: remote mining need not wait for a fully-satisfied upgrader target —
    // the builder target is construction-gated to 0 once the backlog is funded,
    // after which remoteHarvester spawns freely.
    remoteHarvester: 4.5,
    upgrader: 5,
    claimer: 7,
    scout: 8,
};
//# sourceMappingURL=config.js.map