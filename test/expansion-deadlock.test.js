/**
 * Regression guard for the live "W43N38 storage:0, stuck at GCL 2" bug.
 *
 * The storage STRUCTURE was built fine (the construction planner placed it) — the
 * bug is that it was never FILLED, so `Memory.stats.rooms.X.storage` (which is the
 * storage's ENERGY amount, stats.ts:79) sat at 0 forever and SPARSE perpetually
 * mis-diagnosed it as "storage / energy buffering capability missing".
 *
 * Root cause was a low-GCL DEADLOCK:
 *   - the claim gate (expansion.ts) needs storage >= EXPANSION_STORAGE_RESERVE;
 *   - but while GCL <= 2 the hauler's GCL-push funnels every surplus into the
 *     controller container and never fills storage, and gatherEnergy drains any
 *     storage energy for upgraders/builders;
 *   - so storage stays at 0 -> never expands -> GCL never rises -> push never
 *     relents. A second room is the fast GCL lever, and it was unreachable.
 *
 * The fix adds `buildingExpansionReserve(room)`: while a mature 1-room colony has
 * GCL headroom but an empty storage, haulers fill storage (war chest) and
 * consumers leave it alone, so the buffer reaches the reserve and expansion can
 * fire. These tests pin both halves. Runs against compiled dist/ (CommonJS).
 */
const test = require("node:test");
const assert = require("node:assert/strict");

// builder.js builds BUILD_PRIORITY with computed STRUCTURE_* keys at module load
// (hauler.js requires it), so these globals must exist BEFORE the requires.
Object.assign(globalThis, {
  STRUCTURE_SPAWN: "spawn",
  STRUCTURE_EXTENSION: "extension",
  STRUCTURE_CONTAINER: "container",
  STRUCTURE_TOWER: "tower",
  STRUCTURE_STORAGE: "storage",
  STRUCTURE_LINK: "link",
  STRUCTURE_ROAD: "road",
  STRUCTURE_RAMPART: "rampart",
  STRUCTURE_WALL: "constructedWall",
  STRUCTURE_KEEPER_LAIR: "keeperLair",
  RESOURCE_ENERGY: "energy",
  WORK: "work",
  CARRY: "carry",
  MOVE: "move",
  CLAIM: "claim",
  ATTACK: "attack",
  RANGED_ATTACK: "ranged_attack",
  HEAL: "heal",
  TOUGH: "tough",
  FIND_DROPPED_RESOURCES: "droppedResources",
  FIND_TOMBSTONES: "tombstones",
  FIND_RUINS: "ruins",
  FIND_MY_STRUCTURES: "myStructures",
  FIND_SOURCES_ACTIVE: "sourcesActive",
  FIND_MY_SPAWNS: "mySpawns",
  FIND_SOURCES: "sources",
  FIND_STRUCTURES: "structures",
  FIND_HOSTILE_CREEPS: "hostileCreeps",
  FIND_HOSTILE_STRUCTURES: "hostileStructures",
  FIND_CONSTRUCTION_SITES: "sites",
  FIND_MY_CONSTRUCTION_SITES: "mySites",
  OK: 0,
  ERR_NOT_IN_RANGE: -9,
  Game: { gcl: { level: 2 }, rooms: {}, creeps: {}, time: 1000 },
});

const { buildingExpansionReserve, EXPANSION_STORAGE_RESERVE } = require("../dist/expansion.js");
const { chooseSink } = require("../dist/roles/hauler.js");
const { gatherEnergy } = require("../dist/utils/energy.js");

// ---- mocks ------------------------------------------------------------------

function store(energy, cap) {
  return {
    [RESOURCE_ENERGY]: energy,
    getFreeCapacity: () => Math.max(0, cap - energy),
    getCapacity: () => cap,
  };
}

/** An owned room with a storage holding `storageEnergy`. */
function makeRoom(storageEnergy, rcl = 5) {
  return {
    name: "W43N38",
    controller: { my: true, level: rcl },
    storage: { store: store(storageEnergy, 1_000_000) },
  };
}

/** Register `room` as the only owned room so ownedRoomCount() === 1. */
function setColony(room, gclLevel = 2) {
  Game.gcl.level = gclLevel;
  Game.rooms = { [room.name]: room };
}

function makeCreep(carried) {
  const withdrawn = [];
  return {
    store: store(carried, carried),
    pos: { findClosestByRange: (arg) => (Array.isArray(arg) ? arg[0] ?? null : null) },
    withdraw: (target) => {
      withdrawn.push(target);
      return OK;
    },
    pickup: () => OK,
    harvest: () => OK,
    _withdrawn: withdrawn,
  };
}

// All sinks except the one under test are FULL, so the routing decision is
// unambiguous: a full spawn/extension/tower has zero free capacity.
function haulerData(room, over = {}) {
  return Object.assign(
    {
      room,
      spawns: [{ store: store(300, 300) }],
      extensions: [{ store: store(50, 50) }],
      towers: [{ store: store(1000, 1000) }],
      hostiles: [],
      controllerContainer: { id: "cc", store: store(0, 2000) }, // empty -> has free room
      storage: room.storage,
    },
    over,
  );
}

function gatherData(room, over = {}) {
  return Object.assign({ room, storage: room.storage, controllerContainer: undefined, sources: [] }, over);
}

// ---- buildingExpansionReserve: the deadlock predicate ------------------------

test("buildingExpansionReserve: TRUE for a mature 1-room colony with an empty storage (the deadlock)", () => {
  const room = makeRoom(0);
  setColony(room, 2); // 1 owned room < GCL 2 -> headroom to claim a second
  assert.equal(buildingExpansionReserve(room), true);
});

test("buildingExpansionReserve: FALSE once the reserve is met (war chest full)", () => {
  const room = makeRoom(EXPANSION_STORAGE_RESERVE);
  setColony(room, 2);
  assert.equal(buildingExpansionReserve(room), false);
});

test("buildingExpansionReserve: FALSE without GCL headroom (ownedRooms >= GCL)", () => {
  const room = makeRoom(0);
  setColony(room, 1); // 1 owned room, GCL 1 -> cannot legally claim, don't hoard
  assert.equal(buildingExpansionReserve(room), false);
});

test("buildingExpansionReserve: FALSE below RCL4, and FALSE with no storage", () => {
  const low = makeRoom(0, 3);
  setColony(low, 2);
  assert.equal(buildingExpansionReserve(low), false);

  const noStore = makeRoom(0);
  noStore.storage = undefined;
  setColony(noStore, 2);
  assert.equal(buildingExpansionReserve(noStore), false);
});

// ---- hauler fills the war chest (breaks the funnel) --------------------------

test("chooseSink: routes surplus to STORAGE while building the war chest (breaks the deadlock)", () => {
  const room = makeRoom(0);
  setColony(room, 2);
  const data = haulerData(room);
  const sink = chooseSink(makeCreep(100), data);
  assert.equal(
    sink,
    data.storage,
    "while storage is empty and expansion is pending, the hauler must fill storage, not the controller container",
  );
});

test("chooseSink: once the reserve is met, the low-GCL push resumes (controller container)", () => {
  const room = makeRoom(EXPANSION_STORAGE_RESERVE);
  setColony(room, 2);
  const data = haulerData(room);
  const sink = chooseSink(makeCreep(100), data);
  assert.equal(
    sink,
    data.controllerContainer,
    "with the war chest full, normal low-GCL routing (controller container) is unchanged",
  );
});

// ---- consumers leave the war chest alone so it can accumulate ----------------

test("gatherEnergy: does NOT drain storage while it is the war chest (lets the buffer fill)", () => {
  const room = makeRoom(5000); // has energy, but below the reserve and expansion pending
  setColony(room, 2);
  const creep = makeCreep(0);
  gatherEnergy(creep, gatherData(room));
  assert.ok(!creep._withdrawn.includes(room.storage), "storage must be left alone while below the expansion reserve");
});

test("gatherEnergy: drains storage normally once the war chest is full (reserve met)", () => {
  const room = makeRoom(EXPANSION_STORAGE_RESERVE);
  setColony(room, 2);
  const creep = makeCreep(0);
  const data = gatherData(room);
  const acted = gatherEnergy(creep, data);
  assert.equal(acted, true);
  assert.ok(creep._withdrawn.includes(room.storage), "storage is a normal supply once it holds the reserve");
});
