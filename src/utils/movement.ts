/**
 * Cache — movement helpers.
 *
 * Thin wrappers over creep.moveTo that enable Screeps' built-in path reuse
 * (cached in creep.memory._move) so we are not pathfinding from scratch every
 * tick. Roads are preferred so haulers actually benefit from the road network
 * the construction planner lays down.
 */

const MOVE_OPTS: MoveToOpts = {
  reusePath: 15,
  ignoreCreeps: false,
  // Prefer roads (cost 1), then plains (2); swamps stay expensive (5 default).
  plainCost: 2,
  swampCost: 10,
};

/** Move toward a target (structure/creep/source or RoomPosition) within `range`. */
export function travel(
  creep: Creep,
  target: RoomPosition | { pos: RoomPosition },
  range = 1,
): void {
  creep.moveTo(target as RoomPosition, { ...MOVE_OPTS, range });
}

/** Move toward the centre of another room (used for inter-room travel). */
export function travelToRoom(creep: Creep, roomName: string): void {
  if (creep.room.name === roomName) return;
  creep.moveTo(new RoomPosition(25, 25, roomName), { ...MOVE_OPTS, range: 20 });
}
