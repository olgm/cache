"use strict";
/**
 * Cache v0.0.4 — Shared types, constants, and interfaces.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PRIORITY = exports.TARGET_COUNTS = exports.REMOTE_BODIES = exports.EXPANSION_BODIES = exports.TIER1_BODIES = exports.BODY_COST = void 0;
exports.defaultExpansionMemory = defaultExpansionMemory;
exports.defaultRemoteMiningMemory = defaultRemoteMiningMemory;
function defaultExpansionMemory() {
    return {
        state: "idle",
        scoutDispatched: false,
        claimerSpawned: false,
        scoutedRooms: {},
        scoutedSources: {},
    };
}
function defaultRemoteMiningMemory() {
    return {
        ops: {},
    };
}
// --- Body part costs (taken from Screeps constants) ---
exports.BODY_COST = {
    move: 50,
    work: 100,
    carry: 50,
    attack: 80,
    ranged_attack: 150,
    heal: 250,
    claim: 600,
    tough: 10,
};
// --- Energy budget tiers (RCL 1–2 only) ---
exports.TIER1_BODIES = {
    harvester: [WORK, CARRY, MOVE],
    builder: [WORK, CARRY, MOVE],
    upgrader: [WORK, CARRY, MOVE],
};
// --- Bodies for expansion & remote roles ---
exports.EXPANSION_BODIES = {
    scout: [MOVE],
    claimer: [CLAIM, MOVE],
};
exports.REMOTE_BODIES = {
    remoteHarvester: [WORK, WORK, MOVE],
    remoteHauler: [CARRY, CARRY, MOVE, MOVE],
};
// --- Creep counts per role we target at RCL 1–2 ---
exports.TARGET_COUNTS = {
    harvester: 2,
    builder: 1,
    upgrader: 2,
};
// --- Role priority for spawning (lower spawns first) ---
exports.ROLE_PRIORITY = {
    harvester: 0,
    builder: 1,
    upgrader: 2,
    claimer: 3,
    scout: 3,
    remoteHarvester: 3,
    remoteHauler: 4,
};
//# sourceMappingURL=types.js.map