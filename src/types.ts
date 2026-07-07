/**
 * Cache v0.3.0 — Shared types, constants, and interfaces.
 *
 * This release is a fundamentals rewrite: a static-mining economy (dedicated
 * container miners + haulers), RCL-scaled creep counts and body sizes, an
 * auto-construction planner, tower defense, and a gated multi-room expansion.
 * The legacy remote-mining subsystem was removed (premature for an early
 * single-room colony — re-introduce at RCL4+).
 */

// --- Creep role identifiers ---
export type CreepRole =
  // economy
  | "harvester" // generalist bootstrap: mines AND delivers (used until a source has a container)
  | "miner" // stationary container miner, one per source (drop/container mining)
  | "hauler" // moves energy from source containers/dropped piles to sinks
  | "upgrader" // upgrades the room controller
  | "builder" // builds construction sites; repairs when idle
  // remote mining
  | "remoteHarvester" // mines unclaimed sources in adjacent rooms; delivers energy home
  // defense
  | "defender" // attacks hostile creeps (fallback when towers are absent/insufficient)
  // expansion
  | "scout" // cheap MOVE creep that gathers room intel
  | "claimer" // claims a target room's controller
  | "pioneer"; // bootstraps a freshly-claimed room until it has its own spawn

// --- Augment Screeps memory types ---
declare global {
  interface CreepMemory {
    role: CreepRole;
    /** Room this creep belongs to and operates in (falls back to current room). */
    homeRoom?: string;
    /** Miner: the source it is assigned to. */
    sourceId?: Id<Source>;
    /** Scout/claimer/pioneer: the room to travel to. */
    targetRoom?: string;
    /** Builder/upgrader/harvester: true = spending energy, false = gathering. */
    working?: boolean;
    /** Upgrader: consecutive ticks parked idle at an empty controller container. */
    upgraderIdleTicks?: number;
    /** Hauler: true = delivering, false = collecting. */
    hauling?: boolean;
    /** Claimer: set once the target controller is claimed. */
    claimed?: boolean;
    /** True if this creep was spawned in emergency-bootstrap mode (undersized). */
    bootstrap?: boolean;
    /** Hauler: container ID it is currently targeting (for cross-hauler coordination). */
    targetContainer?: string;
  }

  interface RoomMemory {
    /** Base-layout anchor — the first spawn's position. Structures stamp around it. */
    anchor?: { x: number; y: number };
    /** Tick the construction planner last ran a full pass (throttling). */
    lastPlan?: number;
    /** Tick roads were last planned (re-pathing is expensive; throttle hard). */
    lastRoadPlan?: number;
    /** Consecutive ticks the spawn wanted an economy creep it could not afford.
     *  Drives the recovery fallback (size to energy on hand) in the spawn manager. */
    spawnStall?: number;
    /** Map of sourceId → container id beside it (cached so dark/odd ticks are cheap). */
    sourceContainers?: Record<string, Id<StructureContainer>>;
  }

  interface Memory {
    expansion?: ExpansionMemory;
    stats?: CacheStats;
    /**
     * Bounded, newest-wins ring buffer of recent NON-OK spawnCreep return codes
     * (see SpawnErrorEntry). Persisted here (a stable top-level slot) rather than
     * on Memory.stats, because Memory.stats is REASSIGNED every tick — the stats
     * writer folds a snapshot of this into Memory.stats.spawnErrors for SPARSE to
     * read. A silent spawn failure (e.g. a claimed room that never spawns) used
     * to leave no trace anywhere; this is that trace.
     */
    spawnErrors?: SpawnErrorEntry[];
    /** Schema version, bumped to trigger one-time migrations in main.ts. */
    version?: number;
  }
}

// --- Spawn diagnostics ---

/**
 * One captured spawn failure: which room's spawn tried to make which role, the
 * non-OK return code the game gave, and the tick. Every spawnCreep call site
 * funnels its return code into this so a silent failure is visible to SPARSE.
 */
export interface SpawnErrorEntry {
  /** Room whose spawn attempted the creep. */
  room: string;
  /** Role that failed to spawn. */
  role: string;
  /** The non-OK ScreepsReturnCode (e.g. ERR_RCL_NOT_ENOUGH = -14). */
  code: number;
  /** Game tick the failure occurred at. */
  tick: number;
}

/** Max spawn-error entries retained (newest-wins). Small: this is a recent-signal buffer, not a log. */
export const SPAWN_ERROR_CAP = 10;

// --- Expansion types ---

export type ExpansionState =
  | "idle" // not expanding (gated off, or at room cap)
  | "scouting" // gathering intel on adjacent rooms
  | "claiming" // a claimer is en route / claiming
  | "bootstrapping"; // claimed; pioneers building the first spawn

export interface RoomIntel {
  sources: number;
  /** Controller owner username, if any. */
  owner?: string;
  /** Reserved by another player. */
  reserved?: boolean;
  /** Hostiles or source-keeper lairs present. */
  hostile?: boolean;
  lastSeen: number;
}

export interface ExpansionMemory {
  state: ExpansionState;
  targetRoom?: string;
  /** roomName → last-scouted tick. */
  scoutedRooms: Record<string, number>;
  /** roomName → cached intel for target selection. */
  intel: Record<string, RoomIntel>;
}

export function defaultExpansionMemory(): ExpansionMemory {
  return { state: "idle", scoutedRooms: {}, intel: {} };
}

// --- Body part costs (from Screeps constants) ---
export const BODY_COST: Record<BodyPartConstant, number> = {
  move: 50,
  work: 100,
  carry: 50,
  attack: 80,
  ranged_attack: 150,
  heal: 250,
  claim: 600,
  tough: 10,
};

// --- Stats telemetry (the shape SPARSE's parseStats reads — DO NOT break) ---
export interface CacheStats {
  /** Game tick this snapshot was written at (SPARSE's freshness signal). */
  tick: number;
  /** Wall-clock ms (Date.now()) when written. */
  time: number;
  gcl: { level: number; progress: number; progressTotal: number };
  gpl: { level: number; progress: number; progressTotal: number };
  cpu: { used: number; limit: number; bucket: number };
  credits: number;
  shard: string;
  rooms: Record<
    string,
    {
      rcl: number;
      rclProgress: number;
      rclProgressTotal: number;
      energy: number;
      energyCapacity: number;
      /** 1 if a storage structure exists in the room, else 0 (presence flag). */
      storage: number;
      /** Energy buffered in storage; 0 when storage is absent OR built-but-empty. */
      storageEnergy: number;
      hostiles: number;
      myCreeps: number;
      /** Per-role creep counts in this room (e.g. { miner: 1, hauler: 3 }). */
      creepsByRole: Record<string, number>;
      income1k: number;
      // Construction-progress signal (additive; SPARSE ignores unknown fields).
      sites: number;
      extensions: number;
      containers: number;
      towers: number;
    }
  >;
  creepsByRole: Record<string, number>;
  spawnQueues: number;
  /**
   * Recent NON-OK spawn return codes (a snapshot of Memory.spawnErrors). Additive
   * — SPARSE ignores unknown fields, so an older reader is unaffected; a spawn-aware
   * reader sees WHY a room stopped spawning instead of guessing. Absent when empty.
   */
  spawnErrors?: SpawnErrorEntry[];
  /**
   * Compact expansion snapshot folded from Memory.expansion, so the always-read
   * stats blob answers "is the second room progressing?" without a separate
   * Memory read. Additive/optional.
   */
  expansion?: { state: string; targetRoom?: string; ownedRooms: number };
}
