/**
 * Cache — movement helpers.
 *
 * Thin wrappers over creep.moveTo that enable Screeps' built-in path reuse
 * (cached in creep.memory._move) so we are not pathfinding from scratch every
 * tick. Roads are preferred so haulers actually benefit from the road network
 * the construction planner lays down.
 */
/** Move toward a target (structure/creep/source or RoomPosition) within `range`. */
export declare function travel(creep: Creep, target: RoomPosition | {
    pos: RoomPosition;
}, range?: number): void;
/** Move toward the centre of another room (used for inter-room travel). */
export declare function travelToRoom(creep: Creep, roomName: string): void;
