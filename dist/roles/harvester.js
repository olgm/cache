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
    if (creep.memory.working)
        deliver(creep, data);
    else
        harvest(creep);
}
function harvest(creep) {
    const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
    if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE)
            (0, movement_1.travel)(creep, source);
    }
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