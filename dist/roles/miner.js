"use strict";
/**
 * Cache — Miner role (static container mining).
 *
 * A miner is assigned to one source (creep.memory.sourceId) and parks on the
 * container beside it, harvesting continuously. With ~5 WORK it drains the
 * source's full 10 energy/tick. Energy is transferred into the container (and
 * overflow drops onto its tile, where haulers pick it up), so the miner itself
 * never travels to base — that is the hauler's job. This decoupling is what lets
 * the economy scale past a handful of tiny generalists.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMiner = runMiner;
const movement_1 = require("../utils/movement");
const roomData_1 = require("../utils/roomData");
function runMiner(creep) {
    const home = creep.memory.homeRoom || creep.room.name;
    // Travel to the home room if somehow displaced.
    if (creep.room.name !== home) {
        (0, movement_1.travel)(creep, new RoomPosition(25, 25, home), 20);
        return;
    }
    let source = creep.memory.sourceId
        ? Game.getObjectById(creep.memory.sourceId)
        : null;
    // Self-heal a missing/invalid assignment: grab an un-mined source.
    if (!source) {
        source = pickFreeSource(creep);
        if (source)
            creep.memory.sourceId = source.id;
    }
    if (!source)
        return;
    // Find the container/site beside this source so we can park on it.
    const data = (0, roomData_1.getRoomData)(creep.room);
    const sd = data.sources.find((s) => s.source.id === source.id);
    const container = sd === null || sd === void 0 ? void 0 : sd.container;
    // Position: stand ON the container if there is one (so overflow lands in it);
    // otherwise just get adjacent to the source.
    if (container) {
        if (!creep.pos.isEqualTo(container.pos))
            (0, movement_1.travel)(creep, container.pos, 0);
    }
    else if (!creep.pos.isNearTo(source)) {
        (0, movement_1.travel)(creep, source, 1);
    }
    creep.harvest(source);
    // Push what we carry into the container (keeps our 1 CARRY clear so harvest
    // doesn't overflow-drop more than necessary).
    if (creep.store[RESOURCE_ENERGY] > 0 && container && container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        creep.transfer(container, RESOURCE_ENERGY);
    }
}
/** Pick a source in the room that has no miner assigned yet. */
function pickFreeSource(creep) {
    var _a, _b;
    const data = (0, roomData_1.getRoomData)(creep.room);
    const taken = new Set();
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        if (c.name !== creep.name && c.memory.role === "miner" && c.memory.sourceId) {
            taken.add(c.memory.sourceId);
        }
    }
    // Prefer sources that already have a container.
    const free = data.sources.filter((s) => !taken.has(s.source.id));
    const withContainer = free.find((s) => s.container);
    return (_b = (_a = (withContainer || free[0])) === null || _a === void 0 ? void 0 : _a.source) !== null && _b !== void 0 ? _b : null;
}
//# sourceMappingURL=miner.js.map