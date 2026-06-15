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
 */

import { travel } from "../utils/movement";
import { getRoomData } from "../utils/roomData";
import { gatherEnergy } from "../utils/energy";

export function runUpgrader(creep: Creep): void {
  const home = creep.memory.homeRoom || creep.room.name;
  if (creep.room.name !== home) {
    travel(creep, new RoomPosition(25, 25, home), 20);
    return;
  }

  const ctrl = creep.room.controller;
  if (!ctrl || !ctrl.my) return;

  // Upgrade whenever the creep has energy; gather only when empty.
  // The old full/empty toggle could trap upgraders in a futile gather loop
  // when energy was scarce — they'd never reach full carry and never upgrade.
  // The simple "upgrade on any energy" pattern ensures every joule picked up
  // is converted to control points without delay.
  if (creep.store[RESOURCE_ENERGY] > 0) {
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) travel(creep, ctrl, 3);
    return;
  }

  const data = getRoomData(creep.room);
  const cc = data.controllerContainer;

  // Gather: prefer the controller container (adjacent, dedicated).
  if (cc && cc.store[RESOURCE_ENERGY] > 0) {
    if (creep.withdraw(cc, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, cc);
    return;
  }

  // Controller container exists but is empty: park beside it.  Walking across
  // the room to a source container burns ticks; haulers will refill this
  // container soon, and the upgrader is right there to grab it.
  if (cc) {
    travel(creep, cc);
    return;
  }

  // No controller container: use the general energy pool.  The waste-
  // prevention path drains spawn/extensions when they're flooding (>50 %
  // full), which is faster than walking to a source in the bootstrap phase.
  if (!data.storage) {
    const spawnExt = [...data.spawns, ...data.extensions];
    const totalCap = spawnExt.reduce((s, st) => s + st.store.getCapacity(RESOURCE_ENERGY)!, 0);
    const totalE = spawnExt.reduce((s, st) => s + st.store[RESOURCE_ENERGY], 0);
    if (totalCap > 0 && totalE > totalCap * 0.5) {
      const src = spawnExt.find((s) => s.store[RESOURCE_ENERGY] > 0);
      if (src) {
        if (creep.withdraw(src, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) travel(creep, src);
        return;
      }
    }
  }

  gatherEnergy(creep, data);
}
