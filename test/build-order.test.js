/**
 * Tests for three economy follow-ups:
 *  (a) the hauler's surplus-dump builds by BUILD_PRIORITY (towers/storage before
 *      extensions/roads) via the shared pickSiteByPriority helper, instead of
 *      whatever site is merely nearest.
 *  (b) the upgrader target is not inflated to 6 when the room has no dedicated
 *      controller supply (no controller container AND no storage) — those
 *      upgraders would just walk to distant source containers and starve.
 *  (c) the storage-emergency cap: while a RCL 4+ room still lacks its storage
 *      buffer the upgrader target is clamped to 3 (even with a full controller
 *      container), and the clamp lifts once a storage structure exists — so
 *      surplus energy finishes the 30 000-energy storage instead of feeding an
 *      oversized upgrader fleet that starves the builders (the 2026-06-27
 *      no-storage-brittleness lesson; config.ts `rcl >= 4 && !storage`).
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
  WORK: "work",
  CARRY: "carry",
  MOVE: "move",
  Game: { gcl: { level: 1 } },
});

const { pickSiteByPriority } = require("../dist/roles/builder.js");
const { roleTargets, minerBody } = require("../dist/config.js");

const PART_COST = { work: 100, carry: 50, move: 50 };
const bodyCost = (b) => b.reduce((c, p) => c + PART_COST[p], 0);

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

// The GCL push / full controller-container fill would otherwise drive the target
// to 5-6, but the storage-emergency cap (config.ts roleTargets:
// `rcl >= 4 && !storage -> Math.min(upg, 3)`, applied AFTER the GCL push so the
// Math.max floors can't undo it) clamps it to 3 while a RCL 4+ room still lacks
// its storage buffer. A full controller container does NOT lift the cap — only
// building storage does. This is the storage-first sequencing that avoids the
// 2026-06-27 no-storage-collapse brittleness (surplus routes into the 30 000e
// storage build instead of an oversized upgrader fleet that starves the builders).
test("upgrader push is CAPPED at 3 at RCL 4+ while storage is missing, even with a full controller container", () => {
  const t = roleTargets(roomData({ controllerContainer: { store: fakeStore(2000, 2000) } }), {});
  assert.ok(t.upgrader <= 3, `expected <= 3 at RCL 4+ without storage, got ${t.upgrader}`);
});

test("upgrader push is unrestricted once a storage structure exists to buffer the surplus", () => {
  // Same room, now WITH a storage structure: `rcl >= 4 && !storage` is false, so
  // the storage-emergency cap never fires and the GCL push / storage-fill drives
  // the target back up to 5-6. Matches the live colony (W43N38 RCL 6 WITH storage
  // runs ~5 upgraders — the cap simply does not bind, no live/test discrepancy).
  const t = roleTargets(
    roomData({
      controllerContainer: { store: fakeStore(2000, 2000) },
      storage: { store: fakeStore(50000, 1000000) },
    }),
    {},
  );
  assert.ok(t.upgrader >= 5, `expected >= 5 once storage buffers the surplus, got ${t.upgrader}`);
});

// ---- miner body is regen-capped (no more 1800e miners) -----------------------
test("minerBody caps WORK at the source regen limit (<= 5)", () => {
  const work = minerBody(1800).filter((p) => p === "work").length;
  assert.ok(work <= 5, `expected <= 5 WORK, got ${work}`);
});

test("minerBody at a large budget is cheap (~700, not ~1800)", () => {
  // The whole point: a miner the colony can always afford to replace.
  assert.ok(bodyCost(minerBody(1800)) <= 800, `expected <= 800e, got ${bodyCost(minerBody(1800))}`);
});

test("minerBody still scales DOWN on a small (bootstrap) budget", () => {
  const body = minerBody(300);
  assert.ok(body.includes("work"), "must have at least 1 WORK");
  assert.ok(bodyCost(body) <= 300, `must fit the budget, got ${bodyCost(body)}`);
});
