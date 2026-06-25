/**
 * Regression guard for the live "containers:0 at RCL5" bug.
 *
 * Root cause: the construction planner searched for a source/controller
 * container tile using the checkerboard STAMP's inset bound (EDGE_MARGIN = 3),
 * which is stricter than the server's real placement limit (1..48). A source or
 * controller that hugs a room edge — common in generated rooms — had every
 * candidate tile rejected, so `ringTileNear` returned null and no container site
 * was ever created, even with build budget to spare.
 *
 * The fix routes container tile selection through `inRoom` (1..48) instead of
 * `inBounds` (the stamp margin). These tests pin that: edge-band tiles the
 * server accepts must be reachable for containers, while away-from-edge
 * behaviour is unchanged. Runs against compiled dist/ (CommonJS); `npm test`
 * builds first.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

// tileFree() reads these; the terrain/look mocks below ignore the look args, but
// the globals must exist before requiring the module (referenced at call time).
Object.assign(globalThis, {
  TERRAIN_MASK_WALL: 1,
  LOOK_CONSTRUCTION_SITES: "constructionSite",
  LOOK_STRUCTURES: "structure",
  STRUCTURE_ROAD: "road",
  STRUCTURE_RAMPART: "rampart",
});

const { ringTileNear, inRoom, inBounds } = require("../dist/kernel/construction.js");

/** Minimal Room stand-in: a terrain wall predicate, no structures/sites. */
function makeRoom(isWall) {
  return {
    getTerrain: () => ({ get: (x, y) => (isWall(x, y) ? TERRAIN_MASK_WALL : 0) }),
    lookForAt: () => [],
  };
}

// ---- bound predicates -------------------------------------------------------

test("inRoom accepts the edge band that the stamp margin (inBounds) rejects", () => {
  // The server accepts any container tile in 1..48; only 0/49 are off-limits.
  assert.equal(inRoom(1, 25), true);
  assert.equal(inRoom(48, 25), true);
  assert.equal(inRoom(0, 25), false);
  assert.equal(inRoom(49, 25), false);
  // The stamp margin is stricter — exactly the tiles that were lost for containers.
  assert.equal(inBounds(1, 25), false);
  assert.equal(inBounds(2, 25), false);
  assert.equal(inBounds(3, 25), true);
});

// ---- the regression ---------------------------------------------------------

test("ringTileNear finds an edge-hugging source's container tile (the bug)", () => {
  // Source at x=2 whose only open neighbours sit at x<=2 (inside the margin);
  // every in-margin tile (x>=3) is wall. This is the live containers:0 shape.
  const room = makeRoom((x) => x >= 3);
  const src = { x: 2, y: 25 };

  // Old behaviour (stamp margin) finds nothing -> no container is ever placed.
  assert.equal(ringTileNear(src, 1, room, undefined, inBounds), null);

  // Fixed behaviour (room bounds) finds the open edge-band tile beside the source.
  const tile = ringTileNear(src, 1, room, undefined, inRoom);
  assert.ok(tile, "expected a buildable tile beside the edge-hugging source");
  assert.ok(tile.x <= 2 && Math.max(Math.abs(tile.x - src.x), Math.abs(tile.y - src.y)) === 1,
    `expected an adjacent edge-band tile, got ${JSON.stringify(tile)}`);
});

test("ringTileNear is unchanged for a source away from the edge", () => {
  // No walls, no edge: relaxing the bound must not alter normal placement.
  const room = makeRoom(() => false);
  const src = { x: 25, y: 25 };
  assert.ok(ringTileNear(src, 1, room, undefined, inBounds), "inset bound still finds a tile");
  assert.ok(ringTileNear(src, 1, room, undefined, inRoom), "room bound still finds a tile");
});
