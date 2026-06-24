/**
 * Cache v0.3.0 — Main loop.
 *
 * Called every tick by the Screeps runtime. Order of operations:
 *   1. Memory hygiene (prune dead creeps; one-time schema migration).
 *   2. Managers: expansion → construction → towers → spawning.
 *   3. Creep role dispatch.
 *   4. Telemetry (Memory.stats) LAST, so SPARSE observes this tick's real state.
 *
 * Every subsystem and every creep is wrapped in try/catch that LOGS to the
 * console (it never swallows silently) — SPARSE diagnoses partly off console
 * errors, so a crashing subsystem must be visible, not invisible.
 */

import { runSpawnManager } from "./kernel/spawning";
import { runConstruction } from "./kernel/construction";
import { runTowers } from "./kernel/towers";
import { runExpansionManager } from "./expansion";
import { runRemoteMiningManager } from "./kernel/remoteMining";
import { writeStats } from "./stats";
import { CreepRole } from "./types";

import { runMiner } from "./roles/miner";
import { runHauler } from "./roles/hauler";
import { runHarvester } from "./roles/harvester";
import { runUpgrader } from "./roles/upgrader";
import { runBuilder } from "./roles/builder";
import { runDefender } from "./roles/defender";
import { runScout } from "./roles/scout";
import { runClaimer } from "./roles/claimer";
import { runPioneer } from "./roles/pioneer";
import { runRemoteHarvester } from "./roles/remoteHarvester";

const ROLE_RUNNERS: Record<CreepRole, (creep: Creep) => void> = {
  miner: runMiner,
  hauler: runHauler,
  harvester: runHarvester,
  upgrader: runUpgrader,
  builder: runBuilder,
  defender: runDefender,
  scout: runScout,
  claimer: runClaimer,
  pioneer: runPioneer,
  remoteHarvester: () => {}, // stub — not yet implemented
};

/** Bumped to trigger a one-time Memory migration on deploy. */
const SCHEMA_VERSION = 4;

export function loop(): void {
  cleanupCreepMemory();
  migrate();

  runSubsystem("expansion", runExpansionManager);
  runSubsystem("construction", runConstruction);
  runSubsystem("towers", runTowers);
  runSubsystem("spawn", runSpawnManager);

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    const role = creep.memory.role;
    const runner = role ? ROLE_RUNNERS[role] : undefined;
    if (!runner) continue;
    try {
      runner(creep);
    } catch (e) {
      console.log(`CACHE role ${role} (${name}) error: ${(e as Error)?.message ?? e}`);
    }
  }

  runSubsystem("stats", writeStats);
}

/** Delete Memory.creeps entries whose creep no longer exists (leak fix). */
function cleanupCreepMemory(): void {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) delete Memory.creeps[name];
  }
}

/** One-time cleanup of removed subsystems and corrupt/fossil legacy state. */
function migrate(): void {
  if (Memory.version === SCHEMA_VERSION) return;
  const legacy = Memory as unknown as Record<string, unknown>;
  // Remote-mining was removed — drop its (inert) memory.
  delete legacy.remoteMining;
  // Fossil blobs from prior bot architectures that nothing reads any more
  // (~200KB of dead weight: per-tick telemetry, empire, lastTick).
  delete legacy.telemetry;
  delete legacy.empire;
  delete legacy.lastTick;
  // The legacy expansion state was wedged (claiming an unreachable room); reset
  // it so the gated manager re-initialises a clean default.
  Memory.expansion = undefined;
  // Purge ghost-room memory: ~100 rooms from old scouting we don't own, plus
  // legacy-shaped entries for rooms we do own (the planner re-initialises ours).
  if (Memory.rooms) {
    for (const name in Memory.rooms) {
      const room = Game.rooms[name];
      if (room && room.controller && room.controller.my) Memory.rooms[name] = {};
      else delete Memory.rooms[name];
    }
  }
  Memory.version = SCHEMA_VERSION;
  console.log(`CACHE: migrated Memory to schema v${SCHEMA_VERSION} (purged fossil state)`);
}

function runSubsystem(label: string, fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.log(`CACHE ${label} error: ${(e as Error)?.message ?? e}`);
  }
}
