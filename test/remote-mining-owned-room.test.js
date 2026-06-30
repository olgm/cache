/**
 * Guard for the remote-mining half of the W44N38 bootstrap fix.
 *
 * While the colony is bootstrapping a freshly-claimed room (owned, no spawn yet),
 * the remote-mining scanner used to treat that room as a remote outpost and mine
 * its sources. That starved the bootstrap two ways: remoteHarvesters spawn from
 * the home room AHEAD of pioneers (pioneers are only requested after the economy
 * + remoteHarvester targets are met), and the remoteHarvesters contended with the
 * pioneers for the new room's own source energy.
 *
 * scanRemoteRoom() now treats ANY owned controller (ours or another player's) as
 * off-limits, so a room we own is never remote-mined — it is either bootstrapping
 * (pioneers' job) or a self-sufficient colony (its own miners' job). These tests
 * pin that ownership filter and the unowned-room happy path. Runs against
 * compiled dist/ (CommonJS); `npm test` builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

Object.assign(globalThis, {
  FIND_SOURCES: "sources",
  FIND_HOSTILE_CREEPS: "hostileCreeps",
  FIND_HOSTILE_STRUCTURES: "hostileStructures",
  STRUCTURE_KEEPER_LAIR: "keeperLair",
  TERRAIN_MASK_WALL: 1,
});

const { scanRemoteRoom } = require("../dist/kernel/remoteMining.js");

/** A visible room with `sources` sources on open terrain (8 open slots each). */
function makeRoom(name, { owner, reservation, sources = 1, hostiles = 0, lairs = 0 } = {}) {
  const controller = { my: owner === "me" };
  if (owner) controller.owner = { username: owner };
  if (reservation) controller.reservation = { username: reservation };
  return {
    name,
    controller,
    getTerrain: () => ({ get: () => 0 }), // all open: no walls
    find: (type) => {
      if (type === FIND_SOURCES) {
        return Array.from({ length: sources }, (_, i) => ({ id: `${name}_s${i}`, pos: { x: 25, y: 25 } }));
      }
      if (type === FIND_HOSTILE_CREEPS) return Array.from({ length: hostiles }, () => ({}));
      if (type === FIND_HOSTILE_STRUCTURES) {
        return Array.from({ length: lairs }, () => ({ structureType: STRUCTURE_KEEPER_LAIR }));
      }
      return [];
    },
  };
}

// ---- the fix: never remote-mine a room WE own --------------------------------

test("scanRemoteRoom skips a room WE own with no spawn (don't starve its bootstrap)", () => {
  const ours = makeRoom("W44N38", { owner: "me", sources: 2 });
  assert.deepEqual(scanRemoteRoom(ours), [], "a room we are bootstrapping must not be a remote target");
});

// ---- pre-existing exclusions still hold --------------------------------------

test("scanRemoteRoom skips a room owned by another player", () => {
  assert.deepEqual(scanRemoteRoom(makeRoom("W45N38", { owner: "enemy", sources: 2 })), []);
});

test("scanRemoteRoom skips reserved, hostile, and keeper-lair rooms", () => {
  assert.deepEqual(scanRemoteRoom(makeRoom("R1", { reservation: "someone", sources: 2 })), []);
  assert.deepEqual(scanRemoteRoom(makeRoom("R2", { hostiles: 1, sources: 2 })), []);
  assert.deepEqual(scanRemoteRoom(makeRoom("R3", { lairs: 1, sources: 2 })), []);
});

// ---- happy path: an unowned, clear room is still mineable ---------------------

test("scanRemoteRoom returns viable sources for an unowned, clear room", () => {
  const out = scanRemoteRoom(makeRoom("W46N38", { sources: 2 }));
  assert.equal(out.length, 2);
  assert.ok(out.every((s) => s.room === "W46N38" && s.openSlots === 8));
});
