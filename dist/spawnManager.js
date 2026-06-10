"use strict";
/**
 * Cache v0.0.4 — Spawn manager.
 * Counts creeps per role against TARGET_COUNTS and spawns the highest-priority
 * missing creep when energy is available.
 *
 * v0.0.4: Integrated expansion and remote-mining spawn requests.
 * After base roles are satisfied, checks for claimers, scouts,
 * remote harvesters, and remote haulers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSpawnManager = runSpawnManager;
const types_1 = require("./types");
const expansion_1 = require("./expansion");
const remoteMining_1 = require("./remoteMining");
/** Compute the total energy cost of a body plan. */
function bodyCost(body) {
    let total = 0;
    for (const part of body) {
        total += types_1.BODY_COST[part];
    }
    return total;
}
/** Count living creeps assigned to a given role. */
function countRole(role) {
    let n = 0;
    for (const name in Game.creeps) {
        if (Game.creeps[name].memory.role === role) {
            n++;
        }
    }
    return n;
}
/**
 * Choose the next creep role to spawn.
 * Returns null when all target counts are met.
 */
function pickRole() {
    let bestRole = null;
    let bestPriority = Infinity;
    for (const role of ["harvester", "builder", "upgrader"]) {
        const current = countRole(role);
        if (current >= types_1.TARGET_COUNTS[role])
            continue;
        const priority = types_1.ROLE_PRIORITY[role];
        if (priority < bestPriority) {
            bestPriority = priority;
            bestRole = role;
        }
    }
    return bestRole;
}
/** Unique incremental id for creep naming. */
let nextId = 1;
/**
 * Try to spawn an expansion or remote-mining creep.
 * Returns true if a spawn was queued.
 */
function trySpawnSpecial(spawn) {
    // 1. Expansion (claimer/scout)
    const expReq = (0, expansion_1.getExpansionSpawnRequest)();
    if (expReq) {
        const cost = bodyCost(expReq.body);
        if (spawn.room.energyAvailable >= cost) {
            const name = `${expReq.role}_${nextId++}_${Game.time}`;
            const ret = spawn.spawnCreep(expReq.body, name, {
                memory: { role: expReq.role },
            });
            if (ret === OK) {
                (0, expansion_1.onExpansionSpawn)(expReq.role, name);
                return true;
            }
        }
    }
    // 2. Remote mining (remoteHarvester / remoteHauler)
    const remoteReq = (0, remoteMining_1.getRemoteMiningSpawnRequest)();
    if (remoteReq) {
        const cost = bodyCost(remoteReq.body);
        if (spawn.room.energyAvailable >= cost) {
            const name = `${remoteReq.role}_${nextId++}_${Game.time}`;
            const ret = spawn.spawnCreep(remoteReq.body, name, {
                memory: { role: remoteReq.role },
            });
            if (ret === OK) {
                (0, remoteMining_1.onRemoteMiningSpawn)(remoteReq.role, name, remoteReq.targetId, remoteReq.homeRoom);
                return true;
            }
        }
    }
    return false;
}
/**
 * Run the spawn manager for a single spawn.
 * Attempts to spawn the highest-priority missing creep.
 */
function runSpawn(spawn) {
    if (spawn.spawning)
        return; // already busy
    // First: satisfy base roles (harvester, builder, upgrader)
    const role = pickRole();
    if (role) {
        const body = types_1.TIER1_BODIES[role];
        if (!body)
            return;
        const cost = bodyCost(body);
        if (spawn.room.energyAvailable < cost)
            return; // not enough energy
        const name = `${role[0].toUpperCase()}${role.slice(1)}_${nextId++}_${Game.time}`;
        const ret = spawn.spawnCreep(body, name, {
            memory: { role },
        });
        if (ret === OK) {
            // Successfully queued.
        }
        return;
    }
    // Base roles satisfied — try expansion / remote-mining spawns
    trySpawnSpecial(spawn);
}
/**
 * Main entry: run spawn logic for every owned spawn.
 * Called once per tick from the main loop.
 */
function runSpawnManager() {
    for (const name in Game.spawns) {
        runSpawn(Game.spawns[name]);
    }
}
//# sourceMappingURL=spawnManager.js.map