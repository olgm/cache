"use strict";
/**
 * Cache — Upgrader role.
 *
 * Fills from the controller container (its dedicated supply) when present, then
 * the general energy pool, and upgrades the room controller. Controller upgrades
 * are what earn both RCL and GCL progress, so a healthy economy keeps several
 * upgraders busy — the target count scales with surplus (storage) energy.
 *
 * Key design: when the controller container exists, the upgrader parks beside it
 * even when empty — walking across the room to a source container costs ticks
 * that are better spent waiting for the next hauler delivery.  The controller
 * container is the most efficient supply path because haulers bring energy right
 * to the upgrader's workstation.
 *
 * Starvation guard: if the upgrader has been parked at the controller container
 * for too long without energy arriving (haulers are behind or dead), it times
 * out and gathers from elsewhere rather than idling forever.  The idle counter
 * resets as soon as the creep picks up any energy, even a single tick's worth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpgrader = runUpgrader;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
const energy_1 = require("../utils/energy");
/**
 * Max ticks an upgrader will park beside an empty controller container before
 * falling back to the general energy pool.  A typical hauler cycle is ~25-40
 * ticks, but if the controller container is empty the haulers are behind —
 * every parked tick is a tick of zero GCL/RCL progress.  Lowered from 25 to
 * 16: a single hauler round-trip is ~25 ticks, so by 16 the upgrader has
 * waited most of one cycle and should self-rescue.
 */
const PARK_TIMEOUT = 16;
/**
 * After this many ticks parked at an empty controller container, the upgrader
 * lowers its threshold for drawing from spawn/extensions from 35 % to 20 %,
 * converting buffer energy into control points rather than idling.  Reduced
 * from 10→5 to respond faster to haulers that are alive but slow.
 */
const PROGRESSIVE_DRAW_TICKS = 5;
/**
 * When the controller container is empty but a source container has ≥ this much
 * energy, the hauler pipeline is bottlenecked — the upgrader walks to the source
 * container directly instead of parking.  Lowered from 800→450: a source
 * container at 450+ has enough energy for a full upgrader refill, and fetching
 * it converts energy into CP faster than waiting for a hauler that may be
 * prioritizing spawns/extensions.
 */
const SOURCE_FETCH_THRESHOLD = 450;
/** Minimum energy in a nearby dropped pile / tombstone worth grabbing. */
const MIN_NEARBY = 50;
function runUpgrader(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    if (creep.room.name !== home) {
        creep.memory.upgraderIdleTicks = undefined; // reset idle counter during transit
        (0, movement_1.travel)(creep, new RoomPosition(25, 25, home), 20);
        return;
    }
    const data = (0, roomData_1.getRoomData)(creep.room);
    // DEGRADED-CONTAINER GUARD: when the room has a source container but 0 miners
    // AND 0 haulers, idle to let harvesters push the full source output to the
    // spawn so it can accumulate the 150 e needed to spawn a miner.  (Same
    // deadlock as the builder guard — see builder.ts for the full rationale.)
    // Updated to OR: the guard stays active after a miner emergency spawn until a
    // hauler also exists, preventing the upgrader from resuming and competing with
    // harvesters before the full static-mining pipeline is restored.  But if miners
    // exist (producing into containers) and there are no harvesters, the upgrader
    // taking from containers doesn't starve the spawn — the spawn can't get that
    // energy without haulers anyway.  Only idle when spawn truly has no supply.
    {
        const containers = data.sources.filter((s) => s.container).length;
        if (containers > 0) {
            let miners = 0, haulers = 0;
            for (const name in Game.creeps) {
                const c = Game.creeps[name];
                if (c.memory.homeRoom !== home)
                    continue;
                if (c.memory.role === "miner")
                    miners++;
                else if (c.memory.role === "hauler")
                    haulers++;
                if (miners > 0 && haulers > 0)
                    break;
            }
            if (miners === 0 || haulers === 0) {
                let harvesters = 0;
                for (const name in Game.creeps) {
                    const c = Game.creeps[name];
                    if (c.memory.homeRoom !== home)
                        continue;
                    if (c.memory.role === "harvester")
                        harvesters++;
                }
                if (harvesters === 0)
                    return; // idle — spawn has no energy supply at all
            }
        }
    }
    // SPAWN-ENERGY CRISIS GUARD: when the room has miners (energy IS being
    // produced) but the spawn+extensions buffer is critically low AND the spawn
    // is actively stalled, upgraders consuming source-container energy compete
    // with haulers for the spawn's supply.  Keyed to spawnStall ≥ 10 so it only
    // fires during a genuine crisis, not a brief post-spawn dip (see builder.ts).
    {
        let hasMiners = false;
        for (const name in Game.creeps) {
            const c = Game.creeps[name];
            if (c.memory.homeRoom === home && c.memory.role === "miner") {
                hasMiners = true;
                break;
            }
        }
        if (hasMiners) {
            const totalE = data.spawns.reduce((s, sp) => s + sp.store[RESOURCE_ENERGY], 0) +
                data.extensions.reduce((s, ext) => s + ext.store[RESOURCE_ENERGY], 0);
            const stall = creep.room.memory.spawnStall || 0;
            if (totalE < 300 && stall >= 10)
                return; // idle — let haulers fill the spawn
        }
    }
    const ctrl = creep.room.controller;
    if (!ctrl || !ctrl.my)
        return;
    // Upgrade whenever the creep has energy; gather only when empty.
    // The old full/empty toggle could trap upgraders in a futile gather loop
    // when energy was scarce — they'd never reach full carry and never upgrade.
    // The simple "upgrade on any energy" pattern ensures every joule picked up
    // is converted to control points without delay.
    if (creep.store[RESOURCE_ENERGY] > 0) {
        // Reset the starvation counter: energy arrived.
        creep.memory.upgraderIdleTicks = undefined;
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
        return;
    }
    const cc = data.controllerContainer;
    // Gather: prefer the controller container (adjacent, dedicated).
    if (cc && cc.store[RESOURCE_ENERGY] > 0) {
        creep.memory.upgraderIdleTicks = undefined; // energy is here, reset idle counter
        if (creep.withdraw(cc, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, cc);
        return;
    }
    // Controller container exists but is empty.
    if (cc) {
        // Before parking, grab any energy that happens to be right here — dropped
        // piles, tombstones, or ruins within 5 tiles of the controller container.
        // These are free energy that requires negligible travel and no pathfinding.
        if (grabNearbyEnergy(creep, cc.pos))
            return;
        const idleTicks = creep.memory.upgraderIdleTicks || 0;
        // Smart source fetch: when the controller container is empty but a source
        // container has energy (≥ SOURCE_FETCH_THRESHOLD), the hauler pipeline is
        // bottlenecked — walk to the fullest source container directly instead
        // of parking.  Each tick spent walking is cheaper than idling, and fetching
        // energy from the source forces it through the controller at full uptime.
        // Triggers after just 2 idle ticks: a hauler mid-delivery would have
        // arrived by then, so if the container is still empty, haulers are behind.
        if (idleTicks >= 2) {
            const fullSourceContainers = data.sources
                .map((s) => s.container)
                .filter((c) => !!c && c.store[RESOURCE_ENERGY] >= SOURCE_FETCH_THRESHOLD)
                .sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
            if (fullSourceContainers.length > 0) {
                creep.memory.upgraderIdleTicks = undefined;
                const target = fullSourceContainers[0];
                if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    (0, movement_1.travel)(creep, target);
                return;
            }
        }
        // Progressive spawn/extension drain: when the controller container is dry
        // and the upgrader is parked, convert idle buffer energy into control
        // points.  At 0–4 parked ticks threshold = 35 % (drain modest surplus);
        // at 5+ ticks threshold drops to 20 % so the upgrader doesn't idle for a
        // full PARK_TIMEOUT while spawn buffers sit with spare energy.  The spawn
        // manager runs BEFORE creep dispatch, so spawning always claims its energy
        // first — upgraders only take what spawning left behind.
        //
        // SPAWN-DRAIN GUARD: this path bypasses gatherEnergy (and its minSpawnDrain
        // parameter), so it needs its own absolute energy floor.  Draining the
        // spawn below 200 e (the minimum creep body) starves creep production and
        // can create a permanent deadlock: the spawn tries to spawn a builder,
        // fails, accumulates energy from haulers, and the upgrader drains it back
        // down before it reaches 200 e (the live W44N38 at 142 e / 300, stall 51).
        // Requiring ≥ 200 e absolute AND the percentage threshold ensures the
        // upgrader only taps energy that spawning demonstrably cannot use.
        if (!data.storage) {
            const spawnExt = [...data.spawns, ...data.extensions];
            const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
            const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
            const threshold = idleTicks >= PROGRESSIVE_DRAW_TICKS ? 0.20 : 0.35;
            if (totalCap > 0 && totalE > totalCap * threshold && totalE >= 200) {
                const src = spawnExt.find((s) => s.store[RESOURCE_ENERGY] > 0);
                if (src) {
                    if (creep.withdraw(src, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                        (0, movement_1.travel)(creep, src);
                    return;
                }
            }
        }
        // Starvation guard: if the upgrader has been parked here for too long
        // without any energy arriving, the haulers are behind or dead.  Fall back
        // to the general energy pool rather than idling forever — every tick the
        // controller isn't being upgraded is a tick of wasted GCL/RCL progress.
        //
        // SPAWN-DRAIN GUARD: when source containers exist (static mining active),
        // the upgrader must NOT withdraw from spawn/extensions.  The source
        // containers are the correct energy supply; draining the spawn starves
        // creep production and locks the room in a low-energy equilibrium where
        // the spawn can never accumulate enough to replace a weak miner (the live
        // W44N38: spawn at 59 e, 1-WORK miner, upgraders drain spawn → spawn
        // stays at 59 forever).  Passing minSpawnDrain=200 effectively disables
        // step 6 for post-bootstrap rooms — the upgrader walks to source
        // containers or harvests directly, which is less efficient than a
        // controller container but does not sabotage the colony's spawning.
        if (idleTicks >= PARK_TIMEOUT) {
            const hasSourceContainers = data.sources.some((s) => s.container);
            (0, energy_1.gatherEnergy)(creep, data, hasSourceContainers ? 200 : 50);
            return;
        }
        creep.memory.upgraderIdleTicks = idleTicks + 1;
        // Park beside the controller container so the upgrader is right there
        // when a hauler delivers.
        (0, movement_1.travel)(creep, cc);
        return;
    }
    // No controller container: use the general energy pool.  The waste-
    // prevention path drains spawn/extensions when they're flooding (>50 %
    // full), which is faster than walking to a source in the bootstrap phase.
    //
    // SPAWN-DRAIN GUARD: same 200 e absolute floor as the progressive-drain
    // path above — prevents drain below the minimum spawnable body.
    if (!data.storage) {
        const spawnExt = [...data.spawns, ...data.extensions];
        const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY), 0);
        const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
        if (totalCap > 0 && totalE > totalCap * 0.5 && totalE >= 200) {
            const src = spawnExt.find((s) => s.store[RESOURCE_ENERGY] > 0);
            if (src) {
                if (creep.withdraw(src, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    (0, movement_1.travel)(creep, src);
                return;
            }
        }
    }
    // SPAWN-DRAIN GUARD: when source containers exist, the upgrader must not
    // fall back to draining spawn/extensions via gatherEnergy step 6.  Source
    // containers are the correct supply; draining the spawn starves creep
    // production.  (Same guard as the PARK_TIMEOUT path above for rooms that
    // have source containers but no controller container yet.)
    const hasSourceContainers = data.sources.some((s) => s.container);
    (0, energy_1.gatherEnergy)(creep, data, hasSourceContainers ? 200 : 50);
}
/**
 * Pick up nearby dropped energy, tombstones, or ruins within range 5 of `pos`.
 * Returns true if energy was found and an action was taken.
 */
function grabNearbyEnergy(creep, pos) {
    const dropped = pos.findInRange(FIND_DROPPED_RESOURCES, 5, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= MIN_NEARBY,
    });
    if (dropped.length > 0) {
        // Take the biggest pile.
        const best = dropped.sort((a, b) => b.amount - a.amount)[0];
        if (creep.pickup(best) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, best);
        return true;
    }
    const tomb = pos.findInRange(FIND_TOMBSTONES, 5, {
        filter: (t) => t.store[RESOURCE_ENERGY] >= MIN_NEARBY,
    });
    if (tomb.length > 0) {
        const best = tomb.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])[0];
        if (creep.withdraw(best, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, best);
        return true;
    }
    const ruin = pos.findInRange(FIND_RUINS, 5, {
        filter: (r) => r.store[RESOURCE_ENERGY] >= MIN_NEARBY,
    });
    if (ruin.length > 0) {
        const best = ruin.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])[0];
        if (creep.withdraw(best, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, best);
        return true;
    }
    return false;
}
//# sourceMappingURL=upgrader.js.map