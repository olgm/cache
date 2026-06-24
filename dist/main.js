"use strict";
/**
 * Cache v0.3.0 — Main loop.
 *
 * Called every tick by the Screeps runtime. Order of operations:
 *   1. Memory hygiene (prune dead creeps; one-time schema migration).
 *   2. Managers: expansion → construction → towers → spawning.
 *   3. Creep role dispatch.
 *   4. Telemetry (Memory.stats) LAST, so SPARSE observes this tick's real state.
 *
 * Every subsystem and every creep is wrapped in try/catch that LOGS to the
 * console (it never swallows silently) — SPARSE diagnoses partly off console
 * errors, so a crashing subsystem must be visible, not invisible.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loop = loop;
const spawning_1 = require("./kernel/spawning");
const construction_1 = require("./kernel/construction");
const towers_1 = require("./kernel/towers");
const expansion_1 = require("./expansion");
const remoteMining_1 = require("./kernel/remoteMining");
const stats_1 = require("./stats");
const miner_1 = require("./roles/miner");
const hauler_1 = require("./roles/hauler");
const harvester_1 = require("./roles/harvester");
const upgrader_1 = require("./roles/upgrader");
const builder_1 = require("./roles/builder");
const defender_1 = require("./roles/defender");
const scout_1 = require("./roles/scout");
const claimer_1 = require("./roles/claimer");
const pioneer_1 = require("./roles/pioneer");
const remoteHarvester_1 = require("./roles/remoteHarvester");
const ROLE_RUNNERS = {
    miner: miner_1.runMiner,
    hauler: hauler_1.runHauler,
    harvester: harvester_1.runHarvester,
    upgrader: upgrader_1.runUpgrader,
    builder: builder_1.runBuilder,
    defender: defender_1.runDefender,
    scout: scout_1.runScout,
    claimer: claimer_1.runClaimer,
    pioneer: pioneer_1.runPioneer,
    remoteHarvester: remoteHarvester_1.runRemoteHarvester,
};
/** Bumped to trigger a one-time Memory migration on deploy. */
const SCHEMA_VERSION = 4;
function loop() {
    var _a;
    cleanupCreepMemory();
    migrate();
    runSubsystem("expansion", expansion_1.runExpansionManager);
    runSubsystem("remoteMining", remoteMining_1.runRemoteMiningManager);
    runSubsystem("construction", construction_1.runConstruction);
    runSubsystem("towers", towers_1.runTowers);
    runSubsystem("spawn", spawning_1.runSpawnManager);
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const role = creep.memory.role;
        const runner = role ? ROLE_RUNNERS[role] : undefined;
        if (!runner)
            continue;
        try {
            runner(creep);
        }
        catch (e) {
            console.log(`CACHE role ${role} (${name}) error: ${(_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : e}`);
        }
    }
    runSubsystem("stats", stats_1.writeStats);
}
/** Delete Memory.creeps entries whose creep no longer exists (leak fix). */
function cleanupCreepMemory() {
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps))
            delete Memory.creeps[name];
    }
}
/** One-time cleanup of removed subsystems and corrupt/fossil legacy state. */
function migrate() {
    if (Memory.version === SCHEMA_VERSION)
        return;
    const legacy = Memory;
    // Remote-mining was removed — drop its (inert) memory.
    delete legacy.remoteMining;
    // Fossil blobs from prior bot architectures that nothing reads any more
    // (~200KB of dead weight: per-tick telemetry, empire, lastTick).
    delete legacy.telemetry;
    delete legacy.empire;
    delete legacy.lastTick;
    // The legacy expansion state was wedged (claiming an unreachable room); reset
    // it so the gated manager re-initialises a clean default.
    Memory.expansion = undefined;
    // Purge ghost-room memory: ~100 rooms from old scouting we don't own, plus
    // legacy-shaped entries for rooms we do own (the planner re-initialises ours).
    if (Memory.rooms) {
        for (const name in Memory.rooms) {
            const room = Game.rooms[name];
            if (room && room.controller && room.controller.my)
                Memory.rooms[name] = {};
            else
                delete Memory.rooms[name];
        }
    }
    Memory.version = SCHEMA_VERSION;
    console.log(`CACHE: migrated Memory to schema v${SCHEMA_VERSION} (purged fossil state)`);
}
function runSubsystem(label, fn) {
    var _a;
    try {
        fn();
    }
    catch (e) {
        console.log(`CACHE ${label} error: ${(_a = e === null || e === void 0 ? void 0 : e.message) !== null && _a !== void 0 ? _a : e}`);
    }
}
//# sourceMappingURL=main.js.map