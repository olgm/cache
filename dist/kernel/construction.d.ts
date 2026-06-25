/**
 * Cache — Construction planner (auto base-building).
 *
 * For every owned room this places construction sites idempotently and within
 * the RCL allowance (CONTROLLER_STRUCTURES): containers beside each source and
 * the controller, then extensions / towers / storage on a checkerboard stamp
 * around the spawn anchor (buildings on the anchor's parity, leaving the other
 * parity free as road lanes), plus basic roads from the anchor to the sources
 * and controller. A spawn site is placed in rooms that have none (expansion).
 *
 * Throttled (a full pass every PLAN_INTERVAL ticks) — base layout changes
 * slowly, and builders need time to work through the queue anyway.
 */
export declare function runConstruction(): void;
/** A buildable tile at Chebyshev distance `dist` from `pos`, closest to `toward`. */
export declare function ringTileNear(pos: RoomPosition, dist: number, room: Room, toward?: RoomPosition, bounds?: (x: number, y: number) => boolean): {
    x: number;
    y: number;
} | null;
export declare function inBounds(x: number, y: number): boolean;
/**
 * The engine's real buildable area: everything except the exit-border ring at
 * 0/49. Source & controller containers sit right beside their target, which
 * frequently lands inside the stamp's EDGE_MARGIN (sources/controllers often
 * hug a room edge). They must therefore use this full range rather than the
 * inset margin — otherwise the only adjacent tile is rejected and the room
 * never gets a container (the live containers:0 bug). createConstructionSite
 * itself rejects 0/49, so 1..48 is exactly what the server will accept.
 */
export declare function inRoom(x: number, y: number): boolean;
