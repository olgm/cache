/**
 * Cache — Construction planner (auto base-building).
 *
 * For every owned room this places construction sites idempotently and within
 * the RCL allowance (CONTROLLER_STRUCTURES): containers beside each source and
 * the controller, then extensions / towers / storage on a checkerboard stamp
 * around the spawn anchor (buildings on the anchor's parity, leaving the other
 * parity free as road lanes), plus basic roads from the anchor to the sources
 * and controller. A spawn site is placed in rooms that have none (expansion).
 *
 * Throttled (a full pass every PLAN_INTERVAL ticks) — base layout changes
 * slowly, and builders need time to work through the queue anyway.
 */

import { myRooms, getRoomData, RoomData } from "../utils/roomData";

const PLAN_INTERVAL = 25;
/** Keep structures this far from the room edges (exit safety / pathing). */
const EDGE_MARGIN = 3;
/** Search radius (Chebyshev) around the anchor for building tiles. */
const STAMP_RADIUS = 7;
/** Cap new sites placed per room per pass, so we never flood the 100-site limit. */
const MAX_SITES_PER_PASS = 12;

export function runConstruction(): void {
  for (const room of myRooms()) {
    try {
      planRoom(room);
    } catch (e) {
      console.log(`CACHE construction error in ${room.name}: ${(e as Error)?.message}`);
    }
  }
}

function planRoom(room: Room): void {
  const data = getRoomData(room);
  ensureAnchor(room, data);

  const mem = room.memory;
  const due = mem.lastPlan === undefined || Game.time - mem.lastPlan >= PLAN_INTERVAL;
  if (!due) return;
  mem.lastPlan = Game.time;

  // Don't queue more work while there is still a healthy backlog to build,
  // unless a critical structure (storage) has no site and cannot be placed
  // because its tiles are blocked by lower-priority sites — we must evict.
  const storageMissing =
    allowance(room, STRUCTURE_STORAGE) > 0 &&
    countBuilt(room, STRUCTURE_STORAGE) === 0 &&
    countSites(room, STRUCTURE_STORAGE) === 0;
  if (data.constructionSites.length >= MAX_SITES_PER_PASS && !storageMissing) return;

  let budget = Math.max(1, MAX_SITES_PER_PASS - data.constructionSites.length);

  // 1. A spawn, if this room has none (freshly-claimed expansion room).
  if (data.spawns.length === 0 && countSites(room, STRUCTURE_SPAWN) === 0 && allowance(room, STRUCTURE_SPAWN) > 0) {
    budget -= placeSpawn(room, data);
  }

  // 2. Source containers (one per source) and a controller container.
  budget -= planContainers(room, data, budget);
  if (budget <= 0) return;

  // 3. Point structures on the checkerboard stamp.
  const terrain = room.getTerrain();
  const anchor = new RoomPosition(mem.anchor!.x, mem.anchor!.y, room.name);
  const tiles = collectBuildTiles(room, anchor, terrain, data);

  for (const type of [STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_EXTENSION] as BuildableStructureConstant[]) {
    if (budget <= 0) break;
    const want = allowance(room, type) - countBuilt(room, type) - countSites(room, type);
    if (want <= 0) continue;
    const placed = placeOnTiles(room, tiles, type, Math.min(want, budget));
    if (placed > 0) {
      budget -= placed;
      continue;
    }
    // No free tile found. If this is a critical structure (storage) and there
    // are extension sites on the stamp, evict one to make room.  This recovers
    // from the legacy extension-first ordering: a room whose checkerboard tiles
    // are already saturated with extension sites can never place storage until
    // those sites are built — but the builder won't build them because it now
    // prioritises storage (which has no site).  Evicting one extension site
    // breaks the deadlock.
    //
    // CRITICAL: the deadlock breaker must scan the RAW checkerboard area, not
    // the pre-filtered `tiles` list.  `collectBuildTiles` filters out every tile
    // that has any construction site (via `tileFree`), so `tiles` contains ZERO
    // extension sites — the breaker would never find one to evict.  We recompute
    // the checkerboard positions here without the `tileFree` filter to locate an
    // extension site occupying a stamp tile.
    if (type === STRUCTURE_STORAGE && want > 0) {
      const stampParity = (anchor.x + anchor.y) % 2;
      let evicted = false;
      for (let r = 1; r <= STAMP_RADIUS && !evicted; r++) {
        for (let dx = -r; dx <= r && !evicted; dx++) {
          for (let dy = -r; dy <= r && !evicted; dy++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = anchor.x + dx;
            const y = anchor.y + dy;
            if (!inBounds(x, y)) continue;
            if ((x + y) % 2 !== stampParity) continue;
            if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
            const sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
            const extSite = sites.find((s) => s.structureType === STRUCTURE_EXTENSION);
            if (extSite) {
              extSite.remove();
              if (room.createConstructionSite(x, y, STRUCTURE_STORAGE) === OK) {
                budget--;
                evicted = true;
              }
            }
          }
        }
      }
    }
  }

  // 4. Basic roads (RCL3+). Re-pathing is expensive, so throttle it hard —
  //    roads change rarely and decay is handled by tower/builder repair.
  const roadDue = mem.lastRoadPlan === undefined || Game.time - mem.lastRoadPlan >= 500;
  if (budget > 0 && data.rcl >= 3 && roadDue) {
    mem.lastRoadPlan = Game.time;
    budget -= planRoads(room, data, anchor, budget);
  }
}

// ---------------------------------------------------------------------------
// Anchor
// ---------------------------------------------------------------------------

function ensureAnchor(room: Room, data: RoomData): void {
  if (room.memory.anchor) return;
  const spawn = data.spawns[0];
  if (spawn) {
    room.memory.anchor = { x: spawn.pos.x, y: spawn.pos.y };
  } else if (room.controller) {
    // Expansion room with no spawn yet: anchor near the controller.
    room.memory.anchor = { x: room.controller.pos.x, y: room.controller.pos.y };
  }
}

// ---------------------------------------------------------------------------
// Allowance helpers
// ---------------------------------------------------------------------------

function allowance(room: Room, type: BuildableStructureConstant): number {
  const rcl = room.controller ? room.controller.level : 0;
  const byRcl = CONTROLLER_STRUCTURES[type];
  return (byRcl && byRcl[rcl]) || 0;
}

function countBuilt(room: Room, type: StructureConstant): number {
  // FIND_STRUCTURES (not FIND_MY_STRUCTURES): containers/roads are unowned, so
  // they would be invisible to a "my structures" query.
  return room.find(FIND_STRUCTURES, { filter: (s) => s.structureType === type }).length;
}

function countSites(room: Room, type: StructureConstant): number {
  return room.find(FIND_MY_CONSTRUCTION_SITES, { filter: (s) => s.structureType === type }).length;
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------

function planContainers(room: Room, data: RoomData, budget: number): number {
  let placed = 0;
  const maxContainers = allowance(room, STRUCTURE_CONTAINER);
  let containerCount = countBuilt(room, STRUCTURE_CONTAINER) + countSites(room, STRUCTURE_CONTAINER);
  const anchor = room.memory.anchor;
  const anchorPos = anchor ? new RoomPosition(anchor.x, anchor.y, room.name) : data.sources[0]?.source.pos;

  // One container beside each source.
  for (const sd of data.sources) {
    if (placed >= budget || containerCount >= maxContainers) break;
    if (sd.container || sd.containerSite) continue;
    const tile = bestAdjacentTile(sd.source.pos, room, anchorPos);
    if (tile && room.createConstructionSite(tile.x, tile.y, STRUCTURE_CONTAINER) === OK) {
      placed++;
      containerCount++;
    }
  }

  // One container near the controller (upgrader supply).
  if (placed < budget && containerCount < maxContainers && room.controller && !data.controllerContainer) {
    const ctrl = room.controller.pos;
    const nearbyContainerSite = room
      .lookForAtArea(
        LOOK_CONSTRUCTION_SITES,
        Math.max(0, ctrl.y - 3),
        Math.max(0, ctrl.x - 3),
        Math.min(49, ctrl.y + 3),
        Math.min(49, ctrl.x + 3),
        true,
      )
      .some((r) => r.constructionSite.structureType === STRUCTURE_CONTAINER);
    if (!nearbyContainerSite) {
      // Prefer distance 2 (leaves the immediate ring as upgrader standing room),
      // then fall back to 3 and 1 so a tightly-built or edge-hugging controller
      // still gets a container — all are inside the range-3 supply radius that
      // roomData uses to recognise a controller container.
      let tile: { x: number; y: number } | null = null;
      for (const d of [2, 3, 1]) {
        tile = ringTileNear(ctrl, d, room, anchorPos, inRoom);
        if (tile) break;
      }
      if (tile && room.createConstructionSite(tile.x, tile.y, STRUCTURE_CONTAINER) === OK) {
        placed++;
        containerCount++;
      }
    }
  }

  return placed;
}

/** Best walkable tile adjacent to `pos`, preferring proximity to `toward`. */
function bestAdjacentTile(pos: RoomPosition, room: Room, toward?: RoomPosition): { x: number; y: number } | null {
  // Full room bounds (not the inset stamp margin): a source container must sit
  // beside its source even when that source hugs a room edge.
  return ringTileNear(pos, 1, room, toward, inRoom);
}

/** A buildable tile at Chebyshev distance `dist` from `pos`, closest to `toward`. */
export function ringTileNear(
  pos: RoomPosition,
  dist: number,
  room: Room,
  toward?: RoomPosition,
  bounds: (x: number, y: number) => boolean = inBounds,
): { x: number; y: number } | null {
  const terrain = room.getTerrain();
  let best: { x: number; y: number } | null = null;
  let bestScore = Infinity;
  for (let dx = -dist; dx <= dist; dx++) {
    for (let dy = -dist; dy <= dist; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== dist) continue;
      const x = pos.x + dx;
      const y = pos.y + dy;
      if (!bounds(x, y) || !tileFree(room, x, y, terrain)) continue;
      const score = toward ? Math.abs(x - toward.x) + Math.abs(y - toward.y) : 0;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Checkerboard stamp for point structures
// ---------------------------------------------------------------------------

function collectBuildTiles(room: Room, anchor: RoomPosition, terrain: RoomTerrain, data: RoomData): RoomPosition[] {
  const parity = (anchor.x + anchor.y) % 2;
  const tiles: { pos: RoomPosition; r: number }[] = [];
  for (let r = 1; r <= STAMP_RADIUS; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = anchor.x + dx;
        const y = anchor.y + dy;
        if (!inBounds(x, y)) continue;
        if ((x + y) % 2 !== parity) continue; // road lanes stay free
        if (!tileFree(room, x, y, terrain)) continue;
        if (tooCloseToKeepClear(x, y, data)) continue;
        tiles.push({ pos: new RoomPosition(x, y, room.name), r });
      }
    }
  }
  tiles.sort((a, b) => a.r - b.r);
  return tiles.map((t) => t.pos);
}

/** Don't stamp on/next to sources or the controller (mining & upgrade slots). */
function tooCloseToKeepClear(x: number, y: number, data: RoomData): boolean {
  for (const sd of data.sources) {
    if (Math.max(Math.abs(x - sd.source.pos.x), Math.abs(y - sd.source.pos.y)) <= 1) return true;
  }
  const ctrl = data.room.controller;
  if (ctrl && Math.max(Math.abs(x - ctrl.pos.x), Math.abs(y - ctrl.pos.y)) <= 1) return true;
  return false;
}

function placeOnTiles(room: Room, tiles: RoomPosition[], type: BuildableStructureConstant, count: number): number {
  let placed = 0;
  for (const pos of tiles) {
    if (placed >= count) break;
    if (!tileFree(room, pos.x, pos.y, room.getTerrain())) continue;
    if (room.createConstructionSite(pos.x, pos.y, type) === OK) placed++;
  }
  return placed;
}

// ---------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------

function planRoads(room: Room, data: RoomData, anchor: RoomPosition, budget: number): number {
  let placed = 0;
  const targets: RoomPosition[] = [];
  for (const sd of data.sources) targets.push(sd.source.pos);
  if (room.controller) targets.push(room.controller.pos);

  for (const dest of targets) {
    if (placed >= budget) break;
    const path = room.findPath(anchor, dest, {
      ignoreCreeps: true,
      swampCost: 5,
      range: 1,
      maxOps: 1000,
    });
    for (const step of path) {
      if (placed >= budget) break;
      if (!inBounds(step.x, step.y)) continue;
      const hasRoad = room
        .lookForAt(LOOK_STRUCTURES, step.x, step.y)
        .some((s) => s.structureType === STRUCTURE_ROAD);
      const hasSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, step.x, step.y).length > 0;
      const blocked = room
        .lookForAt(LOOK_STRUCTURES, step.x, step.y)
        .some((s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART);
      if (hasRoad || hasSite || blocked) continue;
      if (room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD) === OK) placed++;
    }
  }
  return placed;
}

// ---------------------------------------------------------------------------
// Spawn (expansion bootstrap)
// ---------------------------------------------------------------------------

function placeSpawn(room: Room, data: RoomData): number {
  const terrain = room.getTerrain();
  const anchor = room.memory.anchor;
  const center = anchor
    ? new RoomPosition(anchor.x, anchor.y, room.name)
    : room.controller
      ? room.controller.pos
      : new RoomPosition(25, 25, room.name);
  // Search outward for the first buildable tile near the chosen centre.
  for (let r = 1; r <= 6; r++) {
    const tile = ringTileNear(center, r, room, center);
    if (tile && !tooCloseToKeepClear(tile.x, tile.y, data) && tileFree(room, tile.x, tile.y, terrain)) {
      if (room.createConstructionSite(tile.x, tile.y, STRUCTURE_SPAWN) === OK) return 1;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Tile predicates
// ---------------------------------------------------------------------------

export function inBounds(x: number, y: number): boolean {
  return x >= EDGE_MARGIN && x <= 49 - EDGE_MARGIN && y >= EDGE_MARGIN && y <= 49 - EDGE_MARGIN;
}

/**
 * The engine's real buildable area: everything except the exit-border ring at
 * 0/49. Source & controller containers sit right beside their target, which
 * frequently lands inside the stamp's EDGE_MARGIN (sources/controllers often
 * hug a room edge). They must therefore use this full range rather than the
 * inset margin — otherwise the only adjacent tile is rejected and the room
 * never gets a container (the live containers:0 bug). createConstructionSite
 * itself rejects 0/49, so 1..48 is exactly what the server will accept.
 */
export function inRoom(x: number, y: number): boolean {
  return x >= 1 && x <= 48 && y >= 1 && y <= 48;
}

/** A tile is free to build a structure on: not a wall, no blocking structure, no site. */
function tileFree(room: Room, x: number, y: number, terrain: RoomTerrain): boolean {
  if (terrain.get(x, y) === TERRAIN_MASK_WALL) return false;
  if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) return false;
  const structs = room.lookForAt(LOOK_STRUCTURES, x, y);
  for (const s of structs) {
    // Roads & ramparts can coexist with most things; anything else blocks.
    if (s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_RAMPART) return false;
  }
  return true;
}
