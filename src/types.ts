/**
 * Cache v0.0.4 — Shared types, constants, and interfaces.
 */

// --- Room-level metrics (mirrors Screeps stats) ---
export interface RoomStats {
  gcl: number;
  cpu: { used: number; limit: number; bucket: number };
  rooms: Record<string, unknown>;
}

// --- Creep role identifiers ---
export type CreepRole =
  | "harvester"
  | "builder"
  | "upgrader"
  | "claimer"
  | "scout"
  | "remoteScout"
  | "remoteHarvester"
  | "remoteHauler";

// --- Augment Screeps memory types ---
declare global {
  interface CreepMemory {
    role?: CreepRole;
    targetRoom?: string;
    claimed?: boolean;
    sourceId?: Id<Source>;
    homeRoom?: string;
    hauling?: boolean;
  }

  interface Memory {
    expansion?: ExpansionMemory;
    remoteMining?: RemoteMiningMemory;
    stats?: CacheStats;
  }
}

// --- Expansion types (v0.0.4) ---

export type ExpansionState = "idle" | "scouting" | "claiming" | "bootstrapping";

export interface ExpansionMemory {
  state: ExpansionState;
  targetRoom?: string;
  scoutDispatched: boolean;
  claimerSpawned: boolean;
  scoutedRooms: Record<string, number>; // roomName → last scout tick
}

export function defaultExpansionMemory(): ExpansionMemory {
  return {
    state: "idle",
    scoutDispatched: false,
    claimerSpawned: false,
    scoutedRooms: {},
  };
}

// --- Remote-mining types (v0.1.0) ---

export type RemoteMiningState = "idle" | "active";

export interface RemoteSourceInfo {
  id: string; // Source id
  x: number;
  y: number;
  roomName: string;
  assignedHarvesters: number;
  assignedHaulers: number;
}

export interface RemoteOp {
  roomName: string;
  state: RemoteMiningState;
  homeRoom: string;
  sources: RemoteSourceInfo[];
  lastEval: number;
  /** Cumulative energy hauled from this remote op (reset on deactivation). */
  totalHauled: number;
  /** Tick when energy was last hauled from this op. */
  lastHaulTick: number;
}

export interface RemoteMiningMemory {
  ops: Record<string, RemoteOp>; // keyed by remote room name
  /** Cached source info from adjacent rooms, populated when visible.
   *  Persists across ticks so ops can start even when the room is dark. */
  knownSources: Record<string, RemoteSourceInfo[]>; // roomName → sources
  /** Tick when the last remote scout was dispatched. */
  lastScoutTick: number;
}

export function defaultRemoteMiningMemory(): RemoteMiningMemory {
  return {
    ops: {},
    knownSources: {},
    lastScoutTick: 0,
  };
}

// --- Body part costs (taken from Screeps constants) ---
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

// --- Spawn request descriptor ---
export interface SpawnRequest {
  role: CreepRole;
  body: BodyPartConstant[];
  priority: number; // lower = more urgent
}

// --- Energy budget tiers (RCL 1–2 only) ---
export const TIER1_BODIES: Record<string, BodyPartConstant[]> = {
  harvester: [WORK, CARRY, MOVE],
  builder:   [WORK, CARRY, MOVE],
  upgrader:  [WORK, CARRY, MOVE],
};

// --- Bodies for expansion & remote roles ---
export const EXPANSION_BODIES: Record<string, BodyPartConstant[]> = {
  scout:   [MOVE],
  claimer: [CLAIM, MOVE],
};

export const REMOTE_BODIES: Record<string, BodyPartConstant[]> = {
  remoteHarvester: [WORK, WORK, MOVE],
  remoteHauler:    [CARRY, CARRY, MOVE, MOVE],
};

// --- Creep counts per role we target at RCL 1–2 ---
export const TARGET_COUNTS: Record<string, number> = {
  harvester: 2,
  builder:   1,
  upgrader:  2,
};

// --- Role priority for spawning (lower spawns first) ---
export const ROLE_PRIORITY: Record<string, number> = {
  harvester: 0,
  builder:   1,
  upgrader:  2,
  claimer:  3,
  scout:    3,
  remoteHarvester: 3,
  remoteHauler:    4,
};


// --- Stats telemetry (mirrors what SPARSE's parseStats reads) ---
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
      storage: number;
      hostiles: number;
      myCreeps: number;
      income1k: number;
    }
  >;
  creepsByRole: Record<string, number>;
  spawnQueues: number;
}
