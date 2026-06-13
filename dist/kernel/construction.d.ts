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
