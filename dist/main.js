"use strict";
/**
 * Cache v0.0.1 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache flush
 *   2. Spawn management
 *   3. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loop = loop;
const cache_1 = require("./utils/cache");
const spawnManager_1 = require("./spawnManager");
const harvester_1 = require("./roles/harvester");
const builder_1 = require("./roles/builder");
const upgrader_1 = require("./roles/upgrader");
/** Map role identifiers to their runner function. */
const ROLE_RUNNERS = {
    harvester: harvester_1.runHarvester,
    builder: builder_1.runBuilder,
    upgrader: upgrader_1.runUpgrader,
};
/**
 * Main loop function — the Screeps runtime calls this every tick.
 */
function loop() {
    // 1. Invalidate the per-tick cache
    (0, cache_1.flushCache)();
    // 2. Run spawn management (decide what to spawn this tick)
    try {
        (0, spawnManager_1.runSpawnManager)();
    }
    catch (e) {
        // Swallow: a spawn error shouldn't kill the rest of the tick.
    }
    // 3. Dispatch each creep to its role runner
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        try {
            const role = creep.memory.role;
            if (role && ROLE_RUNNERS[role]) {
                ROLE_RUNNERS[role](creep);
            }
        }
        catch (e) {
            // Swallow: a single creep error shouldn't kill the rest of the tick.
        }
    }
}
//# sourceMappingURL=main.js.map