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
const { pickEconomyRole, economyBudget, minerProductionFloor } = require("../dist/kernel/spawning.js");

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

test("remote mining is built AFTER home construction but BEFORE discretionary upgraders", () => {
  // Regression for the 2026-06-27 collapse: e548af4 placed remoteHarvester at
  // priority 3 (above builders), so remote mining to a useless second room
  // starved HOME construction — RCL5 storage sat unbuilt. remoteHarvester must
  // sit below builder (construction wins) yet above upgrader (e548af4's intent:
  // remote mining need not wait for a full upgrader fleet).
  assert.ok(
    ROLE_PRIORITY.builder < ROLE_PRIORITY.remoteHarvester,
    "construction must outrank remote mining (don't starve storage/containers/towers)",
  );
  assert.ok(
    ROLE_PRIORITY.remoteHarvester < ROLE_PRIORITY.upgrader,
    "remote mining still outranks the discretionary upgrader fleet",
  );
  // The energy pipeline that feeds the whole colony still comes first.
  assert.ok(ROLE_PRIORITY.miner < ROLE_PRIORITY.remoteHarvester);
  assert.ok(ROLE_PRIORITY.hauler < ROLE_PRIORITY.remoteHarvester);
});

test("pickEconomyRole chooses builder over upgrader when both are under target", () => {
  // The exact live pathology: haulers satisfied, 0 upgraders, 0 builders, with
  // construction pending (builder target > 0). Must pick builder, not upgrader.
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 6 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "builder");
});

test("pickEconomyRole starvation-guard: builder beats hauler when zero builders alive and sites exist", () => {
  // The exact live pathology: haulers 1 below target, builders at 0, construction
  // sites exist (builder target > 0). The guard must elevate builder so it spawns
  // ahead of the perpetually-under-target hauler fleet.
  const targets = { harvester: 2, miner: 1, hauler: 7, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 6 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "builder");
});

test("pickEconomyRole hauler fills before builder when builders are AT target (catch-up inactive)", () => {
  // Catch-up deactivates only when builderCount reaches builderTarget.
  // At count=3 (target=3) builders are satisfied, so hauler (priority 2)
  // fills before any discretionary role.
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 4, builder: 3 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "hauler");
});

test("pickEconomyRole builder catch-up stays active until target is met (not just ⅓)", () => {
  // With builderTarget=3 and builderCount=2, the old ceil(target/3)=1
  // threshold would deactivate catch-up and drop builder to priority 1.5,
  // where a perpetually-under-target hauler at 2 wins every cycle and the
  // builder corps never reaches the full 3.  The new threshold keeps catch-up
  // active until count == target, so builder at -0.5 beats hauler at 2.
  const targets = { harvester: 2, miner: 1, hauler: 6, upgrader: 6, builder: 3 };
  const census = censusFor("W43N38", { harvester: 2, miner: 1, hauler: 4, builder: 2 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "builder");
});

test("pickEconomyRole builder catch-up: critically-short builder beats harvester replacement", () => {
  // When builders are below target (target ≥ 3), the catch-up guard elevates
  // builder to -0.5 — above even harvester replacement.  The guard stays
  // active until the full target is met, guaranteeing the builder corps
  // reaches full strength instead of oscillating at 1-2 builders forever.
  const targets = { harvester: 2, miner: 1, hauler: 7, builder: 3 };
  const census = censusFor("W43N38", { harvester: 1, miner: 1, hauler: 6 });
  assert.equal(pickEconomyRole(targets, census, "W43N38", {}), "builder");

  // Builder catch-up also beats miner when both are under target.
  const census2 = censusFor("W43N38", { harvester: 2, miner: 0, hauler: 6 });
  assert.equal(pickEconomyRole(targets, census2, "W43N38", {}), "builder");
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

// ---- economyBudget: don't deadlock the spawn when haulers collapse -----------
const withContainers = [{ container: {} }, { container: {} }];
const noContainers = [{ container: undefined }];

test("economyBudget is capacity-sized in normal operation (haulers present)", () => {
  const data = { sources: withContainers, energyAvailable: 500, energyCapacity: 1800 };
  assert.equal(economyBudget(data, 3, false), 1800);
});

test("economyBudget sizes to available energy when haulers have collapsed", () => {
  // The death-spiral case: full-capacity body (1800) is unaffordable, so size to
  // what's on hand and spawn a small creep now to restart energy flow.
  const data = { sources: withContainers, energyAvailable: 1210, energyCapacity: 1800 };
  assert.equal(economyBudget(data, 0, false), 1210);
});

test("economyBudget sizes to available while recovering, even with haulers present", () => {
  // The partial-collapse case the haulers===0 trigger misses: one tiny hauler
  // exists, but the room still can't fund a capacity body — the stall-driven
  // recovery flag keeps sizing down so it doesn't plateau.
  const data = { sources: withContainers, energyAvailable: 600, energyCapacity: 1800 };
  assert.equal(economyBudget(data, 5, true), 600);
});

test("economyBudget sizes to available during bootstrap (no source container)", () => {
  const data = { sources: noContainers, energyAvailable: 250, energyCapacity: 1800 };
  assert.equal(economyBudget(data, 0, false), 250);
});

test("economyBudget floors at a minimal body when nearly empty", () => {
  const data = { sources: noContainers, energyAvailable: 40, energyCapacity: 1800 };
  assert.equal(economyBudget(data, 0, false), 200); // WORK+CARRY+MOVE floor
});

// ---- minerProductionFloor: don't lock in a runt miner (manual rescue 2026-07-08)
// A runt miner (1-3 WORK, from available-sizing during a stall) permanently caps a
// source's income. In an extension-rich room with another producer alive, floor the
// miner at 450e (4 WORK) and wait; elsewhere return 0 so the spawn never deadlocks.

test("minerProductionFloor floors an extension-rich room with a live producer at 450e (>= 4 WORK)", () => {
  assert.equal(minerProductionFloor(2300, 2), 450);
  assert.equal(minerProductionFloor(550, 1), 450); // exact boundary: capacity for a 4-WORK miner
});

test("minerProductionFloor returns 0 for a low-capacity/bootstrap room (available-sizing, no deadlock)", () => {
  assert.equal(minerProductionFloor(300, 2), 0); // W44N38: capacity 300, cannot afford 450
  assert.equal(minerProductionFloor(549, 5), 0); // just below the 4-WORK threshold
});

test("minerProductionFloor returns 0 when no other producer is alive (never block the sole lifeline)", () => {
  // With zero other producers, waiting for a proper miner could deadlock — size to
  // available instead (the emergency-harvester path covers a true 0-producer room).
  assert.equal(minerProductionFloor(2300, 0), 0);
});
