/**
 * Cache v0.0.1 — Shared types, constants, and interfaces.
 */

// --- Room-level metrics (mirrors Screeps stats) ---
export interface RoomStats {
  gcl: number;
  cpu: { used: number; limit: number; bucket: number };
  rooms: Record<string, unknown>;
}

// --- Creep role identifiers ---
export type CreepRole = "harvester" | "builder" | "upgrader";

// --- Augment Screeps memory types ---
declare global {
  interface CreepMemory {
    role?: CreepRole;
  }
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
export const TIER1_BODIES: Record<CreepRole, BodyPartConstant[]> = {
  harvester: [WORK, CARRY, MOVE],
  builder:   [WORK, CARRY, MOVE],
  upgrader:  [WORK, CARRY, MOVE],
};

// --- Creep counts per role we target at RCL 1–2 ---
export const TARGET_COUNTS: Record<CreepRole, number> = {
  harvester: 2,
  builder:   1,
  upgrader:  2,
};

// --- Role priority for spawning (lower spawns first) ---
export const ROLE_PRIORITY: Record<CreepRole, number> = {
  harvester: 0,
  builder:   1,
  upgrader:  2,
};
