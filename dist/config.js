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
 * Stationary container miner: maximise WORK (up to 5 — a full source drain at
 * 10 energy/tick) plus one CARRY (to fill its container) and proportional MOVE.
 * Fill leftover budget with extra WORK so we never waste spawn capacity.
 */
function minerBody(budget) {
    // Find the largest whole-unit miner that fits, then fill leftover budget.
    let bestW = 1;
    let bestCost = 0;
    for (let w = 5; w >= 1; w--) {
        const m = Math.min(3, Math.max(1, Math.ceil(w / 2)));
        const cost = w * types_1.BODY_COST.work + types_1.BODY_COST.carry + m * types_1.BODY_COST.move;
        if (cost <= budget) {
            bestW = w;
            bestCost = cost;
            break;
        }
    }
    const body = [];
    for (let i = 0; i < bestW; i++)
        body.push(WORK);
    body.push(CARRY);
    // Add MOVE proportional to WORK (1:2 ratio, min 1, max 3 since stationary).
    const baseMove = Math.min(3, Math.max(1, Math.ceil(bestW / 2)));
    for (let i = 0; i < baseMove; i++)
        body.push(MOVE);
    // Fill leftover budget with extra WORK (the single MOVE from the base
    // handles the extra weight on a road — miners barely move).
    let leftover = budget - bestCost;
    while (leftover >= types_1.BODY_COST.work && body.length < MAX_PARTS) {
        body.push(WORK);
        leftover -= types_1.BODY_COST.work;
    }
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
 */
function harvesterBody(budget) {
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
 * Upgrader: balanced WORK:CARRY for high uptime. Each unit is 1 WORK + 1 CARRY
 * + 1 MOVE (200e), giving a 1:1 work-to-carry ratio that keeps the creep
 * upgrading for ~50 ticks between refills instead of the 12-25 ticks a 2:1
 * ratio gives — halving the number of refill trips and nearly doubling the
 * effective energy→control-point conversion rate. Capped at 15 WORK total
 * because a controller accepts at most 15 energy/tick of upgrade at RCL8.
 */
function upgraderBody(budget, rcl) {
    const unit = [WORK, CARRY, MOVE]; // 1:1:1, 200e
    const maxByCap = rcl >= 8 ? 4 : 8;
    const uc = unitCost(unit);
    const n = Math.max(1, Math.min(maxByCap, Math.floor(budget / uc)));
    const body = repeat(unit, budget, maxByCap);
    // Fill remaining budget with spare WORK+CARRY pairs, then any final MOVE.
    let left = budget - n * uc;
    while (left >= types_1.BODY_COST.work + types_1.BODY_COST.carry && body.length < MAX_PARTS - 1) {
        body.push(WORK, CARRY);
        left -= types_1.BODY_COST.work + types_1.BODY_COST.carry;
    }
    if (left >= types_1.BODY_COST.move && body.length < MAX_PARTS)
        body.push(MOVE);
    return body;
}
/** Melee defender: ATTACK with 1:1 MOVE so it stays mobile while fighting. */
function defenderBody(budget) {
    return repeat([ATTACK, MOVE], budget, 10);
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
        // Pure bootstrap: 2-3 generalists per source, bounded by mining slots.
        targets.harvester = Math.min(sourceCount * 3, totalOpenSlots, 6);
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
        let haulers = Math.max(withContainer, rcl >= 3 ? 2 : 1);
        if (storage)
            haulers += 1;
        // Surplus detection: if source containers are near-full (>70% of capacity)
        // the haulers can't keep up with miner output — add capacity so energy
        // doesn't cap out and get wasted.  Each container holds 2000e, so if two
        // containers hold >1400e each, the current hauler count is insufficient.
        const fullContainers = sources.filter((s) => s.container && s.container.store[RESOURCE_ENERGY] > 1400).length;
        if (fullContainers >= 2)
            haulers += 2;
        else if (fullContainers >= 1)
            haulers += 1;
        // Also bump haulers when spawn+extensions are near-full (>90%) — it means
        // energy is flooding the buffers and should be routed to the controller
        // container / storage faster so upgraders can burn it.
        if (!storage) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (totalCap > 0 && totalE > totalCap * 0.9)
                haulers += 1;
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
            // No controller container yet: scale by RCL conservatively.  Without a
            // controller container, upgraders walk to source containers — each trip
            // costs ticks, so fewer, fatter upgraders beat many thin ones.
            if (rcl >= 6)
                upg = 4;
            else if (rcl >= 4)
                upg = 3;
            else if (rcl >= 3)
                upg = 2;
            else
                upg = 1;
        }
        // GCL push: when GCL is low (1-2) every control point counts — expansion
        // is gated on GCL.  But the push is bounded: it can't exceed what the
        // controller container fill level says the economy can support, because
        // adding underfed upgraders is net negative (they burn CPU and walk ticks
        // instead of upgrading).  The push is strongest (+2) when the controller
        // container is healthy (>50%); weaker (+1) when energy is tight.
        if (Game.gcl.level === 1) {
            upg += cc && ccEnergy > ccCap * 0.5 ? 2 : 1;
        }
        else if (Game.gcl.level === 2) {
            upg += cc && ccEnergy > ccCap * 0.5 ? 1 : 0;
        }
        // Waste detection: when spawn+extensions are near full (>75%) AND there is
        // no storage, harvested energy risks capping out at the buffers.  A modest
        // bump routes that surplus into control points instead.  Only fires when
        // the controller container already has energy (the surplus is real).
        if (!storage && cc && ccEnergy > 0) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            if (totalCap > 0 && totalE > totalCap * 0.75) {
                upg += 1;
            }
        }
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
    remoteHarvester: 3,
    upgrader: 4, // before builder: controller progress gates RCL & GCL — every tick matters
    builder: 5,
    pioneer: 6,
    claimer: 7,
    scout: 8,
};
//# sourceMappingURL=config.js.map