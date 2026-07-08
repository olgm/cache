"use strict";
/**
 * Cache — Harvester role (generalist bootstrap).
 *
 * The economy's lifeblood before containers exist: mines the nearest source and
 * delivers straight to spawn/extensions (then towers, then the controller
 * container / storage). Once a source gains a container, dedicated miners +
 * haulers take over and the harvester target count drops to zero, so these
 * generalists naturally age out. Falls back to upgrading if every sink is full,
 * so harvested energy is never wasted.
 *
 * STATIC-MINING IDLE GUARD: when the harvester's assigned source has both a
 * container AND a dedicated miner, the harvester can never win the harvest race
 * — the miner drains the source's full 10 e/tick regeneration every tick, so
 * the harvester would call harvest() → ERR_NOT_ENOUGH_ENERGY → wait → repeat,
 * burning CPU for zero gain.  Instead, the harvester skips mining entirely and
 * simply waits — O(1) CPU vs the harvest()+movement path.  When the target
 * count is 0 (normal post-bootstrap), these harvesters are not replaced and
 * naturally age out after ~1500 ticks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHarvester = runHarvester;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
function runHarvester(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    if (creep.room.name !== home) {
        (0, movement_1.travel)(creep, new RoomPosition(25, 25, home), 20);
        return;
    }
    if (creep.store.getFreeCapacity() === 0)
        creep.memory.working = true;
    else if (creep.store[RESOURCE_ENERGY] === 0)
        creep.memory.working = false;
    const data = (0, roomData_1.getRoomData)(creep.room);
    // Static-mining idle guard: when a miner owns this source the harvester will
    // never find energy — skip the harvest()+travel() path and just wait.
    // The harvester still delivers any energy it happens to be carrying.
    //
    // PARTIAL-BOOTSTRAP RE-ASSIGN: during the transition from bootstrap to static
    // mining (some sources containerized, some not), a harvester assigned to a
    // covered source is dead weight — it idles every tick while an uncovered
    // source elsewhere in the room goes under-harvested.  Instead of idling,
    // re-assign to an uncovered source so all harvester WORK parts stay busy.
    // In full post-bootstrap (all sources containerized, target=0), the guard
    // still idles harvesters so they age out naturally — those harvesters are
    // surplus and should not be reassigned.  We detect "still needed" by checking
    // whether any source in the room lacks a container: if so, the room still
    // benefits from harvester labour.
    //
    // CRITICAL: we bypass the normal harvest() path (which calls pickHarvesterSource
    // when the source is depleted — and pickHarvesterSource would re-assign the
    // harvester RIGHT BACK to the covered source, creating a per-tick oscillation
    // where the harvester never actually harvests).  Instead we directly target the
    // uncovered source: harvest from it if in range, travel toward it if not, and
    // wait beside it when it is depleted (harvest returns ERR_NOT_ENOUGH_ENERGY,
    // which is silently fine — next tick it will have regenerated).
    if (!creep.memory.working && sourceHasMiner(creep, data)) {
        const stillNeeded = data.sources.some((s) => !s.container);
        if (stillNeeded) {
            const uncovered = data.sources.find((s) => !s.container);
            if (uncovered) {
                creep.memory.sourceId = uncovered.source.id;
                if (creep.harvest(uncovered.source) === ERR_NOT_IN_RANGE) {
                    (0, movement_1.travel)(creep, uncovered.source);
                }
                return;
            }
        }
        return;
    }
    if (creep.memory.working)
        deliver(creep, data);
    else
        harvest(creep, data);
}
/** True when the source this harvester is assigned to has both a container
 *  AND a dedicated miner — i.e. the harvester can never win a harvest race. */
function sourceHasMiner(creep, data) {
    if (!creep.memory.sourceId)
        return false;
    const sd = data.sources.find((s) => s.source.id === creep.memory.sourceId);
    if (!sd || !sd.container)
        return false;
    // Check if any miner is assigned to this source.
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.role === "miner" && c.memory.sourceId === creep.memory.sourceId) {
            return true;
        }
    }
    return false;
}
/**
 * Mine the harvester's assigned source.
 *
 * Each harvester picks a source on first assignment and sticks with it for life,
 * spreading harvesters across all sources instead of all converging on the
 * nearest one.  When the assigned source is depleted the harvester waits —
 * the next tick it will find energy there again.  If the source somehow
 * disappears (e.g. room is abandoned), pick a new one.
 */
function harvest(creep, data) {
    let source = creep.memory.sourceId
        ? Game.getObjectById(creep.memory.sourceId)
        : null;
    // Re-assign if the source vanished or has no energy.
    if (!source || source.energy === 0) {
        source = pickHarvesterSource(creep, data);
        if (source)
            creep.memory.sourceId = source.id;
    }
    if (!source)
        return;
    if (creep.harvest(source) === ERR_NOT_IN_RANGE)
        (0, movement_1.travel)(creep, source);
}
/**
 * Pick the active source with the fewest harvesters assigned to it so
 * harvesters spread evenly across all sources in the room.
 */
function pickHarvesterSource(creep, data) {
    // Count harvesters per source (including in-flight spawns).
    const counts = new Map();
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.memory.role === "harvester" && c.memory.sourceId) {
            counts.set(c.memory.sourceId, (counts.get(c.memory.sourceId) || 0) + 1);
        }
    }
    let best = null;
    let bestCount = Infinity;
    for (const sd of data.sources) {
        if (sd.source.energy === 0)
            continue;
        const c = counts.get(sd.source.id) || 0;
        if (c < bestCount) {
            bestCount = c;
            best = sd.source;
        }
    }
    return best;
}
function deliver(creep, data) {
    // 1. Spawn & extensions (enables spawning).
    const sink = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    });
    if (sink) {
        if (creep.transfer(sink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, sink);
        return;
    }
    // 2. Towers.
    const tower = data.towers.find((t) => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
    if (tower) {
        if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, tower);
        return;
    }
    // 3. Controller container / storage buffer.
    const buffer = data.controllerContainer || data.storage;
    if (buffer && buffer.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(buffer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, buffer);
        return;
    }
    // 4. Everything full — dump into the controller rather than waste it.
    const ctrl = creep.room.controller;
    if (ctrl) {
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
    }
}
//# sourceMappingURL=harvester.js.map