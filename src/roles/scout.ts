/**
 * Cache — Scout role.
 *
 * A disposable 1-MOVE creep that maps the rooms adjacent to its home, recording
 * intel the expansion manager uses to pick a claim target. When every neighbour
 * has fresh intel it idles at home (cheap) until the intel goes stale, then
 * resumes — so we don't respawn scouts needlessly.
 */

import { travel, travelToRoom } from "../utils/movement";
import { recordIntel } from "../expansion";

const INTEL_FRESH = 5000;

export function runScout(creep: Creep): void {
  recordIntel(creep.room);
  const home = creep.memory.homeRoom || creep.room.name;

  const target = nextTarget(home);
  if (!target) {
    // All mapped — wait at home.
    if (creep.room.name !== home) travelToRoom(creep, home);
    else if (creep.room.controller) travel(creep, creep.room.controller, 3);
    return;
  }

  if (creep.room.name !== target) travelToRoom(creep, target);
}

/** First adjacent-to-home room lacking fresh intel. */
function nextTarget(home: string): string | null {
  const exits = Game.map.describeExits(home);
  if (!exits) return null;
  const intel = Memory.expansion?.intel ?? {};
  for (const name of Object.values(exits)) {
    const i = intel[name];
    if (!i || Game.time - i.lastSeen > INTEL_FRESH) return name;
  }
  return null;
}
