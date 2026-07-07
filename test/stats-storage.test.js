/**
 * Regression test: the `storage` stat is a PRESENCE flag, not an energy amount.
 *
 * writeStats used to report `storage: room.storage.store[energy]` — the buffer
 * LEVEL. SPARSE/the Overseer read `storage` as a built-structure flag (0 = "no
 * storage"), so a built-but-EMPTY storage (energy 0) looked identical to a
 * missing one. That drove the "storage never placed" misread: the Overseer kept
 * trying to BUILD a storage W43N38 already had, because its buffer read 0.
 *
 * The fix splits the signal: `storage` = presence (0/1), `storageEnergy` = the
 * buffer level. These tests pin both, especially the empty-but-built case.
 *
 * Runs against compiled dist/ (CommonJS); `npm test` builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

Object.assign(globalThis, {
  OK: 0,
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

const { writeStats } = require("../dist/stats.js");

/**
 * A minimal owned room; find() returns [] for every query. `storage` is the live
 * StructureStorage game object (or undefined for a room that has not built one).
 */
function ownedRoom(name, storage) {
  return {
    name,
    controller: { my: true, level: 5, progress: 100, progressTotal: 1000 },
    storage,
    energyAvailable: 300,
    energyCapacityAvailable: 550,
    getTerrain: () => ({ get: () => 0 }),
    find: () => [],
  };
}

/** A StructureStorage mock holding `energy` energy. */
function storageWith(energy) {
  return { store: { [RESOURCE_ENERGY]: energy } };
}

test("writeStats: no storage structure → storage 0, storageEnergy 0", () => {
  Memory.stats = undefined;
  Game.rooms = { W44N38: ownedRoom("W44N38", undefined) };
  writeStats();
  assert.equal(Memory.stats.rooms.W44N38.storage, 0, "absent → presence 0");
  assert.equal(Memory.stats.rooms.W44N38.storageEnergy, 0, "absent → energy 0");
});

test("writeStats: BUILT but EMPTY storage → storage 1, storageEnergy 0 (the bug)", () => {
  Memory.stats = undefined;
  Game.rooms = { W43N38: ownedRoom("W43N38", storageWith(0)) };
  writeStats();
  // The whole point: an empty buffer must NOT read as a missing structure.
  assert.equal(Memory.stats.rooms.W43N38.storage, 1, "built → presence 1 even when empty");
  assert.equal(Memory.stats.rooms.W43N38.storageEnergy, 0, "empty buffer → energy 0");
});

test("writeStats: FILLED storage → storage 1, storageEnergy = buffer level", () => {
  Memory.stats = undefined;
  Game.rooms = { W43N38: ownedRoom("W43N38", storageWith(180_000)) };
  writeStats();
  assert.equal(Memory.stats.rooms.W43N38.storage, 1, "built → presence 1");
  assert.equal(Memory.stats.rooms.W43N38.storageEnergy, 180_000, "buffer level reported verbatim");
});

test("writeStats: the blob serializes cleanly with the split storage fields", () => {
  Memory.stats = undefined;
  Game.rooms = { W43N38: ownedRoom("W43N38", storageWith(42_000)) };
  writeStats();
  const round = JSON.parse(JSON.stringify(Memory.stats));
  assert.equal(round.rooms.W43N38.storage, 1);
  assert.equal(round.rooms.W43N38.storageEnergy, 42_000);
});
