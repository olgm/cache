/**
 * Regression guard for the live "W44N38 claimed but never bootstrapped" deadlock.
 *
 * The colony's first real expansion claimed a SECOND room (W44N38) the instant
 * its storage reserve unlocked the claim gate. That exposed a pre-existing bug in
 * the expansion state machine: the bootstrap never completed, so the new room sat
 * at RCL 1 with NO spawn, NO pioneers, and a downgrade timer ticking toward loss.
 *
 * Root cause (expansion.ts, runExpansionManager):
 *   - the "bootstrapping" case reset to "idle" on ANY tick the target room was
 *     not in Game.rooms — but vision of a spawn-less owned room flickers (it only
 *     comes from remote-harvesters passing through);
 *   - re-entry into bootstrapping only happened via claiming → bootstrapping,
 *     which is gated by expansionUnlocked() = false once ownedRooms >= GCL;
 *   - so the half-claimed room was dropped on the first dark tick and never
 *     re-entered. getExpansionSpawnRequest() only emits pioneers while
 *     state === "bootstrapping", so zero pioneers were ever spawned.
 *
 * The fix drives the bootstrap straight off live reality: any owned room that
 * still lacks a spawn re-enters "bootstrapping" regardless of the expansion gates
 * or transient vision loss, and the bootstrapping case no longer aborts on a
 * blind tick (only on a VISIBLE loss of the room). These tests pin that.
 * Runs against compiled dist/ (CommonJS); `npm test` builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

Object.assign(globalThis, {
  STRUCTURE_SPAWN: "spawn",
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
  FIND_MY_SPAWNS: "mySpawns",
  FIND_SOURCES: "sources",
  FIND_HOSTILE_CREEPS: "hostileCreeps",
  FIND_HOSTILE_STRUCTURES: "hostileStructures",
  // describeExits returns {} so the manager's intel-recording loop is a no-op
  // (we never need to mock adjacent-room intel for these bootstrap-path tests).
  Game: { gcl: { level: 2 }, rooms: {}, creeps: {}, time: 1000, map: { describeExits: () => ({}) } },
  Memory: {},
});

const { runExpansionManager, getExpansionSpawnRequest } = require("../dist/expansion.js");

// ---- mocks ------------------------------------------------------------------

/** A room with `spawns` spawns and `sources` sources; owned by us unless my=false. */
function makeRoom(name, { level, my = true, spawns = 0, sources = 0 } = {}) {
  const spawnList = Array.from({ length: spawns }, (_, i) => ({ id: `${name}_spawn_${i}` }));
  const sourceList = Array.from({ length: sources }, (_, i) => ({
    id: `${name}_src_${i}`,
    pos: { x: 10 + i, y: 20 },
  }));
  return {
    name,
    controller: { my, level },
    find: (type) => {
      if (type === FIND_MY_SPAWNS) return spawnList;
      if (type === FIND_SOURCES) return sourceList;
      return []; // hostiles / hostile structures: none
    },
  };
}

/**
 * Install the live colony: base W43N38 (RCL5, has a spawn) plus the freshly
 * claimed W44N38 (RCL1, NO spawn). ownedRooms(2) >= GCL(2) so the expansion gate
 * is CLOSED — exactly the state that stranded the real bootstrap.
 */
function setup(opts = {}) {
  const {
    state = "idle",
    targetRoom = undefined,
    w44Visible = true,
    w44Mine = true,
    w44Spawns = 0,
    gcl = 2,
  } = opts;
  Game.gcl.level = gcl;
  Game.creeps = {};
  Game.time = 1000;
  Game.rooms = { W43N38: makeRoom("W43N38", { level: 5, my: true, spawns: 1, sources: 2 }) };
  if (w44Visible) {
    Game.rooms.W44N38 = makeRoom("W44N38", { level: 1, my: w44Mine, spawns: w44Spawns, sources: 2 });
  }
  Memory.expansion = { state, targetRoom, scoutedRooms: {}, intel: {} };
}

// ---- the deadlock: claimed, spawn-less, gate-closed --------------------------

test("runExpansionManager re-enters bootstrapping for an owned spawn-less room (gate closed)", () => {
  setup({ state: "idle" }); // the live state: stranded in idle, target cleared
  runExpansionManager();
  assert.equal(Memory.expansion.state, "bootstrapping", "must drive the half-claimed room's bootstrap");
  assert.equal(Memory.expansion.targetRoom, "W44N38");
});

test("getExpansionSpawnRequest then yields a pioneer aimed at the spawn-less room", () => {
  setup({ state: "idle" });
  runExpansionManager(); // drives idle -> bootstrapping off reality
  const base = Game.rooms.W43N38;
  const req = getExpansionSpawnRequest(base, { energyCapacity: 1300 });
  assert.ok(req, "expected a spawn request");
  assert.equal(req.memory.role, "pioneer");
  assert.equal(req.memory.targetRoom, "W44N38");
  assert.equal(req.memory.homeRoom, "W43N38");
  assert.ok(req.body.length > 0, "pioneer must have a non-empty body");
});

// ---- robustness: vision of the half-built room flickers ----------------------

test("bootstrapping SURVIVES a transient vision loss of the target room", () => {
  // Mid-bootstrap, but W44N38 is not in Game.rooms this tick (its creeps moved).
  setup({ state: "bootstrapping", targetRoom: "W44N38", w44Visible: false });
  runExpansionManager();
  assert.equal(
    Memory.expansion.state,
    "bootstrapping",
    "a blind tick must NOT reset to idle — that was the deadlock",
  );
  assert.equal(Memory.expansion.targetRoom, "W44N38");
});

// ---- completion + abandonment (the only ways out of bootstrapping) -----------

test("bootstrapping COMPLETES to idle once the new room has its own spawn", () => {
  setup({ state: "bootstrapping", targetRoom: "W44N38", w44Spawns: 1 });
  runExpansionManager();
  assert.equal(Memory.expansion.state, "idle");
  assert.equal(Memory.expansion.targetRoom, undefined);
});

test("bootstrapping ABANDONS the target when it is visibly no longer ours", () => {
  setup({ state: "bootstrapping", targetRoom: "W44N38", w44Mine: false });
  runExpansionManager();
  assert.equal(Memory.expansion.state, "idle");
  assert.equal(Memory.expansion.targetRoom, undefined);
});

// ---- no false positives: a healthy single-room colony stays idle -------------

test("a single-room colony with no spawn-less room is left idle", () => {
  Game.gcl.level = 2;
  Game.creeps = {};
  Game.time = 1000;
  Game.rooms = { W43N38: makeRoom("W43N38", { level: 5, my: true, spawns: 1, sources: 2 }) };
  Memory.expansion = { state: "idle", targetRoom: undefined, scoutedRooms: {}, intel: {} };
  runExpansionManager();
  assert.notEqual(Memory.expansion.state, "bootstrapping", "nothing to bootstrap → must not invent one");
  assert.equal(Memory.expansion.targetRoom, undefined);
});
