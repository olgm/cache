"use strict";
/**
 * Cache — movement helpers.
 *
 * Thin wrappers over creep.moveTo that enable Screeps' built-in path reuse
 * (cached in creep.memory._move) so we are not pathfinding from scratch every
 * tick. Roads are preferred so haulers actually benefit from the road network
 * the construction planner lays down.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.travel = travel;
exports.travelToRoom = travelToRoom;
const MOVE_OPTS = {
    reusePath: 15,
    ignoreCreeps: false,
    // Prefer roads (cost 1), then plains (2); swamps stay expensive (5 default).
    plainCost: 2,
    swampCost: 10,
};
/** Move toward a target (structure/creep/source or RoomPosition) within `range`. */
function travel(creep, target, range = 1) {
    creep.moveTo(target, { ...MOVE_OPTS, range });
}
/** Move toward the centre of another room (used for inter-room travel). */
function travelToRoom(creep, roomName) {
    if (creep.room.name === roomName)
        return;
    creep.moveTo(new RoomPosition(25, 25, roomName), { ...MOVE_OPTS, range: 20 });
}
//# sourceMappingURL=movement.js.map