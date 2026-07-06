/**
 * Regression + capability test for bug #4 (gap a): silent spawn failures.
 *
 * Every spawnCreep call site used to discard its return code (`=== OK` or ignored
 * entirely), so a room that tried and FAILED to spawn — the "second room won't
 * spawn" thesis — left no trace anywhere for SPARSE/the Overseer to read. These
 * tests pin the fix: recordSpawnResult captures non-OK codes into a bounded,
 * newest-wins Memory.spawnErrors ring buffer, and writeStats folds a snapshot of
 * it (plus a compact expansion summary) into Memory.stats — well-formed.
 *
 * Runs against compiled dist/ (CommonJS); `npm test` builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

Object.assign(globalThis, {
  OK: 0,
  ERR_NAME_EXISTS: -3,
  ERR_BUSY: -4,
  ERR_NOT_ENOUGH_ENERGY: -6,
  ERR_RCL_NOT_ENOUGH: -14,
  ERR_GCL_NOT_ENOUGH: -15,
  FIND_STRUCTURES: "structures",
  FIND_CONSTRUCTION_SITES: "sites",
  FIND_SOURCES: "sources",
  FIND_MY_SPAWNS: "mySpawns",
  FIND_HOSTILE_CREEPS: "hostileCreeps",
  STRUCTURE_CONTAINER: "container",
  STRUCTURE_TOWER: "tower",
  STRUCTURE_EXTENSION: "extension",
  STRUCTURE_STORAGE: "storage",
  TERRAIN_MASK_WALL: 1,
  RESOURCE_ENERGY: "energy",
  WORK: "work",
  CARRY: "carry",
  MOVE: "move",
  ATTACK: "attack",
  RANGED_ATTACK: "ranged_attack",
  HEAL: "heal",
  HARVEST_POWER: 2,
  Game: {
    time: 5000,
    creeps: {},
    spawns: {},
    rooms: {},
    gcl: { level: 2, progress: 1, progressTotal: 2 },
    gpl: { level: 0, progress: 0, progressTotal: 1 },
    cpu: { getUsed: () => 1.5, limit: 20, bucket: 10000 },
    market: { credits: 0 },
    shard: { name: "shard3" },
  },
  Memory: {},
});

const { recordSpawnResult } = require("../dist/kernel/spawning.js");
const { writeStats } = require("../dist/stats.js");
const { SPAWN_ERROR_CAP } = require("../dist/types.js");

function resetMemory() {
  Memory.spawnErrors = undefined;
  Memory.expansion = undefined;
  Memory.stats = undefined;
}

/** A minimal owned room; find() returns [] for every query (no structures/sources). */
function ownedRoom(name, { level = 4, progress = 100, progressTotal = 1000 } = {}) {
  return {
    name,
    controller: { my: true, level, progress, progressTotal },
    storage: undefined,
    energyAvailable: 300,
    energyCapacityAvailable: 550,
    getTerrain: () => ({ get: () => 0 }),
    find: () => [],
  };
}

// ── recordSpawnResult: the capture ──────────────────────────────────────────────

test("recordSpawnResult: OK is ignored (no news is good news)", () => {
  resetMemory();
  recordSpawnResult("W43N38", "harvester", OK);
  assert.ok(!Memory.spawnErrors || Memory.spawnErrors.length === 0, "OK must not be recorded");
});

test("recordSpawnResult: a non-OK code is captured with room/role/code/tick", () => {
  resetMemory();
  Game.time = 6000;
  recordSpawnResult("W44N38", "pioneer", ERR_RCL_NOT_ENOUGH);
  assert.equal(Memory.spawnErrors.length, 1);
  assert.deepEqual(Memory.spawnErrors[0], {
    room: "W44N38",
    role: "pioneer",
    code: ERR_RCL_NOT_ENOUGH,
    tick: 6000,
  });
});

test("recordSpawnResult: initializes the buffer when absent and appends in order", () => {
  resetMemory();
  Game.time = 10;
  recordSpawnResult("W1N1", "hauler", ERR_BUSY);
  Game.time = 11;
  recordSpawnResult("W1N1", "upgrader", ERR_NOT_ENOUGH_ENERGY);
  assert.equal(Memory.spawnErrors.length, 2);
  assert.equal(Memory.spawnErrors[0].role, "hauler");
  assert.equal(Memory.spawnErrors[1].role, "upgrader");
});

test("recordSpawnResult: newest-wins ring buffer caps at SPAWN_ERROR_CAP", () => {
  resetMemory();
  const n = SPAWN_ERROR_CAP + 3;
  for (let i = 0; i < n; i++) {
    Game.time = i;
    recordSpawnResult("W44N38", "claimer", ERR_GCL_NOT_ENOUGH);
  }
  assert.equal(Memory.spawnErrors.length, SPAWN_ERROR_CAP, "buffer is bounded");
  // The oldest 3 were dropped: the first surviving entry is the 4th push (tick 3).
  assert.equal(Memory.spawnErrors[0].tick, 3, "oldest dropped, newest kept");
  assert.equal(Memory.spawnErrors[SPAWN_ERROR_CAP - 1].tick, n - 1, "newest at the tail");
});

// ── writeStats: the fold into the blob ──────────────────────────────────────────

test("writeStats: folds a snapshot of spawnErrors into Memory.stats (well-formed)", () => {
  resetMemory();
  Game.time = 7000;
  Game.rooms = { W43N38: ownedRoom("W43N38", { level: 5 }) };
  recordSpawnResult("W44N38", "pioneer", ERR_RCL_NOT_ENOUGH);
  recordSpawnResult("W43N38", "scout", ERR_BUSY);

  writeStats();

  assert.ok(Array.isArray(Memory.stats.spawnErrors), "spawnErrors present in the blob");
  assert.equal(Memory.stats.spawnErrors.length, 2);
  assert.equal(Memory.stats.spawnErrors[0].role, "pioneer");
  assert.equal(Memory.stats.spawnErrors[1].code, ERR_BUSY);
  // The whole blob must serialize cleanly (the game JSON-encodes Memory).
  const round = JSON.parse(JSON.stringify(Memory.stats));
  assert.equal(round.spawnErrors[0].room, "W44N38");
  assert.equal(round.tick, 7000);
});

test("writeStats: the folded array is a COPY, not the live buffer", () => {
  resetMemory();
  Game.time = 7100;
  Game.rooms = { W43N38: ownedRoom("W43N38") };
  recordSpawnResult("W44N38", "pioneer", ERR_RCL_NOT_ENOUGH);
  writeStats();
  // Mutating the live buffer must not retroactively change the snapshot in stats.
  Memory.spawnErrors.push({ room: "X", role: "y", code: ERR_BUSY, tick: 9 });
  assert.equal(Memory.stats.spawnErrors.length, 1, "stats snapshot is decoupled from the live buffer");
});

test("writeStats: omits spawnErrors when there are none (quiet blob)", () => {
  resetMemory();
  Game.time = 7200;
  Game.rooms = { W43N38: ownedRoom("W43N38") };
  writeStats();
  assert.equal(Memory.stats.spawnErrors, undefined, "absent when empty");
});

test("writeStats: folds a compact expansion summary (state/targetRoom/ownedRooms)", () => {
  resetMemory();
  Game.time = 7300;
  Game.rooms = {
    W43N38: ownedRoom("W43N38", { level: 5 }),
    W44N38: ownedRoom("W44N38", { level: 1 }),
  };
  Memory.expansion = { state: "bootstrapping", targetRoom: "W44N38", scoutedRooms: {}, intel: {} };
  writeStats();
  assert.deepEqual(Memory.stats.expansion, {
    state: "bootstrapping",
    targetRoom: "W44N38",
    ownedRooms: 2,
  });
});

test("writeStats: expansion summary absent when the bot has no expansion memory", () => {
  resetMemory();
  Game.time = 7400;
  Game.rooms = { W43N38: ownedRoom("W43N38") };
  writeStats();
  assert.equal(Memory.stats.expansion, undefined);
});
