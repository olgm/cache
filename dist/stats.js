"use strict";
/**
 * Cache — Memory.stats telemetry writer.
 *
 * SPARSE (the autonomous overseer) steers ENTIRELY off Memory.stats: it polls
 * `GET /api/user/memory?path=stats`, decodes it, and runs its eval + phase model
 * + diagnosis on the result. If the bot does not WRITE Memory.stats every tick,
 * SPARSE is blind and steers on a fossil snapshot — which is exactly what
 * happened (the stats tick froze for days while the bot kept playing). So this
 * MUST run, and it must run every tick.
 *
 * The shape mirrors what SPARSE's `parseStats` reads: a freshness `tick`, nested
 * `gcl`/`cpu`, and per-room `{rcl, rclProgress, income1k, …}`. Only OWNED rooms
 * are reported, so a transient scouted/reserved room (e.g. a one-tick scout
 * outpost) never pollutes the colony-health averages or becomes a phantom
 * "weakest room". The caller wraps this in try/catch, so a stats failure can
 * never break the tick.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeStats = writeStats;
const types_1 = require("./types");
const roomData_1 = require("./utils/roomData");
/** Max energy a source yields per tick (its regen rate: 3000 energy / 300 ticks). */
const SOURCE_MAX_PER_TICK = 10;
/**
 * A room's harvest throughput per ~1000 ticks, from DEPLOYED mining capacity:
 * the WORK parts of harvesting creeps in the room (each WORK harvests
 * HARVEST_POWER=2 energy/tick), capped at what the room's sources can give. This
 * is a capacity estimate, NOT an instantaneous on-source count, so it is stable
 * across SPARSE's once-per-cycle sampling (creeps cycle between mining and
 * hauling, so an instantaneous count flickers between 0 and full). A fully-staffed
 * single source reaches ~10000 — the scale SPARSE's eval treats as "healthy", so
 * this rises honestly as the economy grows.
 */
function roomIncome1k(sourceCount, harvestWork) {
    if (sourceCount === 0)
        return 0;
    return Math.min(harvestWork * HARVEST_POWER, sourceCount * SOURCE_MAX_PER_TICK) * 1000;
}
/** Build and persist the Memory.stats telemetry blob for the current tick. */
function writeStats() {
    const creepsByRole = {};
    const creepsByRoom = {};
    // WORK parts of harvesting creeps per room — deployed mining capacity.
    const harvestWorkByRoom = {};
    for (const name in Game.creeps) {
        const c = Game.creeps[name];
        const role = c.memory.role || "unknown";
        creepsByRole[role] = (creepsByRole[role] || 0) + 1;
        creepsByRoom[c.room.name] = (creepsByRoom[c.room.name] || 0) + 1;
        // Energy producers: dedicated miners and generalist harvesters. Their WORK
        // parts (capped at the source regen rate) are the room's mining capacity.
        if (role === "miner" || role === "harvester") {
            harvestWorkByRoom[c.room.name] =
                (harvestWorkByRoom[c.room.name] || 0) + c.getActiveBodyparts(WORK);
        }
    }
    let spawnQueues = 0;
    for (const name in Game.spawns) {
        if (Game.spawns[name].spawning)
            spawnQueues++;
    }
    const rooms = {};
    for (const name in Game.rooms) {
        const room = Game.rooms[name];
        const ctrl = room.controller;
        // Only OWNED rooms count toward colony health; skip scouted/reserved rooms.
        if (!ctrl || !ctrl.my)
            continue;
        // Reuse the per-tick cached room snapshot (a cache hit — the spawn manager
        // already built it this tick), so the extra counts cost no extra find()s.
        const data = (0, roomData_1.getRoomData)(room);
        rooms[name] = {
            rcl: ctrl.level,
            rclProgress: ctrl.progress || 0,
            rclProgressTotal: ctrl.progressTotal || 0,
            energy: room.energyAvailable,
            energyCapacity: room.energyCapacityAvailable,
            // PRESENCE flag (0/1), NOT energy. SPARSE reads `storage` as a built-
            // structure flag (capabilities.ts counts "rooms with storage"; diagnosis
            // and the Overseer treat 0 as "no storage structure"). A built-but-EMPTY
            // storage must still read 1 — reporting its 0 energy here made an empty
            // buffer look like a missing structure, so the Overseer kept trying to
            // BUILD a storage that already existed (the storage-never-placed misread).
            // The buffer LEVEL is reported separately as `storageEnergy`.
            storage: room.storage ? 1 : 0,
            storageEnergy: room.storage ? room.storage.store[RESOURCE_ENERGY] : 0,
            hostiles: data.allHostiles.length,
            myCreeps: creepsByRoom[name] || 0,
            income1k: roomIncome1k(data.sources.length, harvestWorkByRoom[name] || 0),
            sites: data.constructionSites.length,
            extensions: data.extensions.length,
            containers: data.containers.length,
            towers: data.towers.length,
        };
    }
    const stats = {
        tick: Game.time,
        time: Date.now(),
        gcl: {
            level: Game.gcl.level,
            progress: Game.gcl.progress,
            progressTotal: Game.gcl.progressTotal,
        },
        gpl: {
            level: Game.gpl.level,
            progress: Game.gpl.progress,
            progressTotal: Game.gpl.progressTotal,
        },
        cpu: {
            used: Game.cpu.getUsed(),
            limit: Game.cpu.limit,
            bucket: Game.cpu.bucket,
        },
        credits: (Game.market && Game.market.credits) || 0,
        shard: (Game.shard && Game.shard.name) || "",
        rooms,
        creepsByRole,
        spawnQueues,
    };
    // Fold recent NON-OK spawn failures (a snapshot of the persisted ring buffer)
    // so SPARSE sees WHY a room stopped spawning. Newest-wins slice; omitted when
    // empty to keep the blob quiet. Memory.spawnErrors persists across the per-tick
    // Memory.stats reassignment, so this is a copy, not the live buffer.
    const spawnErrors = Memory.spawnErrors;
    if (spawnErrors && spawnErrors.length) {
        stats.spawnErrors = spawnErrors.slice(-types_1.SPAWN_ERROR_CAP);
    }
    // Fold a compact expansion snapshot so the always-read stats blob answers
    // "is the second room progressing?" without a separate Memory.expansion read.
    const exp = Memory.expansion;
    if (exp) {
        stats.expansion = {
            state: exp.state,
            targetRoom: exp.targetRoom,
            ownedRooms: Object.keys(rooms).length,
        };
    }
    Memory.stats = stats;
}
//# sourceMappingURL=stats.js.map