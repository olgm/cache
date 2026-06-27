/**
 * Regression tests for the 2026-06-27 economy-collapse resilience fixes.
 *
 *  - shouldRefillFromStorage (hauler): a hauler must ferry energy from STORAGE to
 *    the spawn when the source pipeline is dry, so the storage buffer can fuel
 *    recovery from a 0-miner collapse instead of relying on luck (residual
 *    container energy).
 *  - hasExpansionSurplus (expansion): claiming a second room requires a REAL
 *    storage reserve, not merely a storage structure — an empty just-built storage
 *    is exactly the state in which the colony over-extended into W44N38.
 *
 * Runs against the compiled output in dist/ (CommonJS) — `npm test` builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

// hauler.js imports builder.js, whose BUILD_PRIORITY object uses Screeps structure
// constants as computed keys AT MODULE LOAD. These globals don't exist in plain
// Node, so stub them before requiring (values are irrelevant to the pure helper).
for (const c of [
  "STRUCTURE_SPAWN", "STRUCTURE_TOWER", "STRUCTURE_STORAGE", "STRUCTURE_EXTENSION",
  "STRUCTURE_CONTAINER", "STRUCTURE_LINK", "STRUCTURE_ROAD", "STRUCTURE_RAMPART",
  "STRUCTURE_WALL",
]) {
  if (global[c] === undefined) global[c] = c.replace("STRUCTURE_", "").toLowerCase();
}
if (global.RESOURCE_ENERGY === undefined) global.RESOURCE_ENERGY = "energy";

const { shouldRefillFromStorage } = require("../dist/roles/hauler.js");
const { hasExpansionSurplus, EXPANSION_STORAGE_RESERVE } = require("../dist/expansion.js");

// ---- shouldRefillFromStorage -------------------------------------------------

test("hauler pulls from storage when storage has energy AND a sink needs it", () => {
  assert.equal(shouldRefillFromStorage(50_000, 300), true);
});

test("hauler does NOT pull from storage when storage is empty (nothing to ferry)", () => {
  assert.equal(shouldRefillFromStorage(0, 300), false);
});

test("hauler does NOT pull from storage when every sink is full (would loop)", () => {
  // No non-storage sink needs energy → withdrawing would just cycle back to storage.
  assert.equal(shouldRefillFromStorage(50_000, 0), false);
});

// ---- hasExpansionSurplus -----------------------------------------------------

test("expansion is blocked when storage holds no real surplus (the W44N38 mistake)", () => {
  assert.equal(hasExpansionSurplus(0), false);
  assert.equal(hasExpansionSurplus(EXPANSION_STORAGE_RESERVE - 1), false);
});

test("expansion is allowed once storage holds the required reserve", () => {
  assert.equal(hasExpansionSurplus(EXPANSION_STORAGE_RESERVE), true);
  assert.equal(hasExpansionSurplus(EXPANSION_STORAGE_RESERVE + 100_000), true);
});

test("the expansion reserve is a meaningful, non-zero surplus", () => {
  // Guard against an accidental 0/undefined threshold that would re-open the gate.
  assert.ok(EXPANSION_STORAGE_RESERVE >= 10_000);
});
