/**
 * Tests for two economy follow-ups:
 *  (a) the hauler's surplus-dump builds by BUILD_PRIORITY (towers/storage before
 *      extensions/roads) via the shared pickSiteByPriority helper, instead of
 *      whatever site is merely nearest.
 *  (b) the upgrader target is not inflated to 6 when the room has no dedicated
 *      controller supply (no controller container AND no storage) — those
 *      upgraders would just walk to distant source containers and starve.
 *
 * Runs against compiled dist/ (CommonJS); `npm test` builds first. builder.js
 * constructs BUILD_PRIORITY with computed STRUCTURE_* keys at module load, so
 * those globals must exist BEFORE the require; roleTargets reads Game.gcl and
 * RESOURCE_ENERGY only when called. node --test isolates each file in its own
 * process, so these globals don't leak into the other test file.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

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
  RESOURCE_ENERGY: "energy",
  Game: { gcl: { level: 1 } },
});

const { pickSiteByPriority } = require("../dist/roles/builder.js");
const { roleTargets } = require("../dist/config.js");

// ---- (a) surplus-dump priority ordering --------------------------------------
const creepPos = { getRangeTo: (s) => s._range };

test("pickSiteByPriority builds a tower before nearer extensions/storage", () => {
  const sites = [
    { structureType: STRUCTURE_EXTENSION, _range: 1 },
    { structureType: STRUCTURE_STORAGE, _range: 2 },
    { structureType: STRUCTURE_TOWER, _range: 9 }, // farthest, but top priority
  ];
  assert.equal(pickSiteByPriority(creepPos, sites).structureType, STRUCTURE_TOWER);
});

test("pickSiteByPriority breaks ties by proximity within a priority class", () => {
  const sites = [
    { structureType: STRUCTURE_EXTENSION, _range: 7 },
    { structureType: STRUCTURE_EXTENSION, _range: 3 },
  ];
  assert.equal(pickSiteByPriority(creepPos, sites)._range, 3);
});

test("pickSiteByPriority returns null when there are no sites", () => {
  assert.equal(pickSiteByPriority(creepPos, []), null);
});

// ---- (b) upgrader target without a dedicated supply --------------------------
function fakeStore(energy, cap) {
  return { energy, getCapacity: () => cap, getFreeCapacity: () => Math.max(0, cap - energy) };
}
function roomData(over = {}) {
  // RCL-5, full spawn+extensions, GCL 1: the conditions under which the GCL push
  // would otherwise inflate the upgrader target to 6 off the fill proxy.
  return {
    rcl: 5,
    sources: [
      { container: { store: fakeStore(1500, 2000) }, openSlots: 3, source: { pos: {} } },
      { container: undefined, openSlots: 3, source: { pos: {} } },
    ],
    storage: undefined,
    controllerContainer: undefined,
    constructionSites: [{}, {}],
    hostiles: [],
    towers: [],
    spawns: [{ store: fakeStore(300, 300) }],
    extensions: Array.from({ length: 17 }, () => ({ store: fakeStore(50, 50) })),
    ...over,
  };
}

test("upgrader target is capped without a controller container or storage", () => {
  const t = roleTargets(roomData(), {});
  assert.ok(t.upgrader <= 4, `expected <= 4 without a dedicated supply, got ${t.upgrader}`);
});

test("upgrader push is unrestricted once a controller container supplies them", () => {
  const t = roleTargets(roomData({ controllerContainer: { store: fakeStore(2000, 2000) } }), {});
  assert.ok(t.upgrader >= 5, `expected >= 5 with a full controller container, got ${t.upgrader}`);
});
