/**
 * Regression test for the "structures planned but never built" bug.
 *
 * Live symptom (room W43N38, RCL 5): the construction planner correctly placed
 * 2 tower sites + 1 storage site, but they sat at progress 0 forever because the
 * spawn manager NEVER spawned a builder — upgraders (priority 4, target inflated
 * to 6 by the GCL-1 push) permanently outranked the lowest-priority builder
 * (priority 5), so the single spawn never worked down to it.
 *
 * The fix makes builders outrank upgraders (their target is construction-gated,
 * so they only compete when there is real work). These tests pin that ordering
 * via the real pickEconomyRole decision function.
 *
 * Runs against the compiled output in dist/ (CommonJS) — `npm test` builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { ROLE_PRIORITY } = require("../dist/config.js");
const { pickEconomyRole } = require("../dist/kernel/spawning.js");

/** Minimal Census stub — pickEconomyRole only reads census.byRoom[home]. */
function censusFor(home, counts) {
  return { byRoom: { [home]: counts }, totalByRoom: {}, minersBySource: {}, global: {} };
}

test("builders outrank upgraders in spawn priority", () => {
  assert.ok(
    ROLE_PRIORITY.builder < ROLE_PRIORITY.upgrader,
    "builder must spawn before upgrader, else queued tower/storage sites never get built",
  );
});

test("energy pipeline still outranks builders (no economy regression)", () => {
  // Builders must NOT preempt the harvester/miner/hauler economy that feeds them.
  assert.ok(ROLE_PRIORITY.harvester < ROLE_PRIORITY.builder);
  assert.ok(ROLE_PRIORITY.miner < ROLE_PRIORITY.builder);
  assert.ok(ROLE_PRIORITY.hauler < ROLE_PRIORITY.builder);
});

test("pickEconomyRole chooses builder over upgrader when both are under target", () => {
  // The exact live pathology: haulers satisfied, 0 upgraders, 0 builders, with
  // construction pending (builder target > 0). Must pick builder, not upgrader.
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 6 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "builder");
});

test("pickEconomyRole fills the energy pipeline before builders", () => {
  // Haulers under target → still spawn haulers first (don't starve the feeders).
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 4 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "hauler");
});

test("pickEconomyRole spawns upgraders once builders are satisfied", () => {
  // Construction funded (builders at target) → discretionary upgraders follow.
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 6, builder: 3 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "upgrader");
});

test("pickEconomyRole returns null when every role is at target", () => {
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", {
    harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3,
  });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), null);
});
