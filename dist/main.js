"use strict";
/**
 * Cache v0.0.5 — Main loop.
 *
 * Called every tick by the Screeps runtime. Orchestrates:
 *   1. Cache & census flush
 *   2. Expansion & remote-mining maintenance
 *   3. Spawn management (includes expansion/remote requests)
 *   4. Creep role dispatch
 *
 * Catches all errors to prevent a single failure from crashing the tick.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loop = loop;
const cache_1 = require("./utils/cache");
const creepCensus_1 = require("./utils/creepCensus");
const spawnManager_1 = require("./spawnManager");
const expansion_1 = require("./expansion");
const remoteMining_1 = require("./remoteMining");
const harvester_1 = require("./roles/harvester");
const builder_1 = require("./roles/builder");
const upgrader_1 = require("./roles/upgrader");
const claimer_1 = require("./roles/claimer");
const scout_1 = require("./roles/scout");
const remoteHarvester_1 = require("./roles/remoteHarvester");
const remoteHauler_1 = require("./roles/remoteHauler");
/** Map role identifiers to their runner function. */
const ROLE_RUNNERS = {
    harvester: harvester_1.runHarvester,
    builder: builder_1.runBuilder,
    upgrader: upgrader_1.runUpgrader,
    claimer: claimer_1.runClaimer,
    scout: scout_1.runScout,
    remoteHarvester: remoteHarvester_1.runRemoteHarvester,
    remoteHauler: remoteHauler_1.runRemoteHauler,
};
/**
 * Main loop function — the Screeps runtime calls this every tick.
 */
function loop() {
    // 1. Invalidate the per-tick caches
    (0, cache_1.flushCache)();
    (0, creepCensus_1.flushCensus)();
    // 2. Build creep census once (single Game.creeps pass) before
    //    any module asks for it — avoids lazy builds mid-tick.
    (0, creepCensus_1.ensureCensus)();
    // 3. Run expansion maintenance (state transitions, intel)
    try {
        (0, expansion_1.runExpansionManager)();
    }
    catch (e) {
        // Swallow: an expansion error shouldn't kill the rest of the tick.
    }
    // 4. Run remote-mining maintenance (source evaluation, op lifecycle)
    try {
        (0, remoteMining_1.runRemoteMiningManager)();
    }
    catch (e) {
        // Swallow: a remote-mining error shouldn't kill the rest of the tick.
    }
    // 5. Run spawn management (decide what to spawn this tick)
    try {
        (0, spawnManager_1.runSpawnManager)();
    }
    catch (e) {
        // Swallow: a spawn error shouldn't kill the rest of the tick.
    }
    // 6. Dispatch each creep to its role runner
    //    NOTE: This is a second Game.creeps pass. The census above
    //    already did one pass. This second pass is for role dispatch
    //    which can't be merged because spawn/expansion managers need
    //    the census data *before* creep actions.
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