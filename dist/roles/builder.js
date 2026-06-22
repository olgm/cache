"use strict";
/**
 * Cache — Builder role.
 *
 * Builds construction sites in a sensible order (spawn → tower → extension →
 * container → storage → road → rampart → wall), and when there is nothing to
 * build, performs light repairs the towers don't cover (decayed roads/containers
 * and freshly-built ramparts). Idle builders help upgrade so they never waste a
 * tick. Gathers energy from buffers (never from spawn/extensions).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickSiteByPriority = pickSiteByPriority;
exports.runBuilder = runBuilder;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
const energy_1 = require("../utils/energy");
/**
 * Lower number = built first. Economy-first: extensions raise energyCapacity
 * (compounding every creep's size) and containers unlock static mining, so both
 * come before the tower — with no active threat the fastest path to a strong,
 * RCL-climbing colony is economy, and safe-mode covers the bootstrap defense gap.
 * A missing spawn (expansion bootstrap) always wins.
 */
const BUILD_PRIORITY = {
    [STRUCTURE_SPAWN]: 0,
    [STRUCTURE_TOWER]: 1, // towers before extensions — defense is critical
    [STRUCTURE_EXTENSION]: 2,
    [STRUCTURE_CONTAINER]: 3,
    [STRUCTURE_STORAGE]: 4,
    [STRUCTURE_LINK]: 5,
    [STRUCTURE_ROAD]: 6,
    [STRUCTURE_RAMPART]: 7,
    [STRUCTURE_WALL]: 8,
};
/**
 * The highest-priority construction site for `pos`: lowest BUILD_PRIORITY wins,
 * ties broken by proximity. Shared with the hauler's surplus-dump so that
 * opportunistic building (a hauler with nowhere to deliver) also advances towers
 * and storage first, instead of whatever site merely happens to be nearest.
 * (The builder's own pickSite adds bootstrap/controller-container nuance on top
 * of this base ordering.)
 */
function pickSiteByPriority(pos, sites) {
    var _a;
    let best = null;
    let bestKey = Infinity;
    for (const s of sites) {
        const prio = (_a = BUILD_PRIORITY[s.structureType]) !== null && _a !== void 0 ? _a : 9;
        const key = prio * 1e6 + pos.getRangeTo(s); // priority dominates; range breaks ties
        if (key < bestKey) {
            bestKey = key;
            best = s;
        }
    }
    return best;
}
/** Repair roads/containers once they drop below this fraction of max hits. */
const REPAIR_THRESHOLD = 0.5;
/** Target hits for freshly-built ramparts (towers maintain them beyond this). */
const RAMPART_FLOOR = 1000;
function runBuilder(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    if (creep.room.name !== home) {
        (0, movement_1.travel)(creep, new RoomPosition(25, 25, home), 20);
        return;
    }
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0)
        creep.memory.working = false;
    else if (!creep.memory.working && creep.store.getFreeCapacity() === 0)
        creep.memory.working = true;
    if (!creep.memory.working) {
        (0, energy_1.gatherEnergy)(creep, (0, roomData_1.getRoomData)(creep.room));
        return;
    }
    // 1. Build the highest-priority construction site.
    const site = pickSite(creep);
    if (site) {
        if (creep.build(site) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, site, 3);
        return;
    }
    // 2. Repair what towers tend to neglect.
    const repair = pickRepair(creep);
    if (repair) {
        if (creep.repair(repair) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, repair, 3);
        return;
    }
    // 3. Nothing to do — help upgrade.
    const ctrl = creep.room.controller;
    if (ctrl && ctrl.my) {
        if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, ctrl, 3);
    }
}
function pickSite(creep) {
    var _a;
    const data = (0, roomData_1.getRoomData)(creep.room);
    const sites = data.constructionSites;
    if (sites.length === 0)
        return null;
    // BOOTSTRAP: until the room has a source container, build containers FIRST —
    // ahead of extensions. Extensions raise energyCapacity, which (with a depleted
    // workforce) just deepens the "can't fill the spawn" hole; a source container
    // instead unlocks static mining and a steady energy stream. Once any container
    // exists, fall back to the normal economy-first order (extensions compound).
    const bootstrapping = data.sources.every((s) => !s.container);
    // After bootstrap, the controller container is the next critical unlock: it
    // gives upgraders a dedicated supply beside the controller, roughly doubling
    // their uptime and the colony's control-point throughput.  Bump its priority
    // above extensions so builders finish it before adding energyCapacity.
    const controllerContainerSite = !bootstrapping
        ? findControllerContainerSite(creep, data)
        : null;
    let best = null;
    let bestKey = Infinity;
    for (const s of sites) {
        let prio = (_a = BUILD_PRIORITY[s.structureType]) !== null && _a !== void 0 ? _a : 9;
        if (bootstrapping && s.structureType === STRUCTURE_CONTAINER) {
            prio = 0.5; // before extensions
        }
        else if (s === controllerContainerSite) {
            prio = 0.75; // after source containers, before extensions
        }
        // Tie-break by remaining work then range, folded into one comparable key.
        const key = prio * 1e6 + (s.progressTotal - s.progress);
        if (key < bestKey) {
            bestKey = key;
            best = s;
        }
    }
    return best;
}
/**
 * Find the construction site (if any) for a container within range 3 of the
 * controller that isn't a source container — the controller container that will
 * become the upgraders' dedicated supply.
 */
function findControllerContainerSite(creep, data) {
    const ctrl = creep.room.controller;
    if (!ctrl)
        return null;
    // Fast path: data.constructionSites is already scanned; filter in JS.
    for (const s of data.constructionSites) {
        if (s.structureType !== STRUCTURE_CONTAINER)
            continue;
        if (!s.pos.inRangeTo(ctrl.pos, 3))
            continue;
        // Exclude source containers (they're within range 1 of a source).
        if (data.sources.some((sd) => s.pos.inRangeTo(sd.source.pos, 1)))
            continue;
        return s;
    }
    return null;
}
function pickRepair(creep) {
    // Decayed roads/containers first (these silently rot and break logistics).
    const decayed = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) &&
            s.hits < s.hitsMax * REPAIR_THRESHOLD,
    });
    if (decayed)
        return decayed;
    // Newly built ramparts that haven't reached a safe floor yet.
    const rampart = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < RAMPART_FLOOR,
    });
    return rampart;
}
//# sourceMappingURL=builder.js.map