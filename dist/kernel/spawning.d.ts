/**
 * Cache — Spawn manager (per-room, prioritized, self-healing).
 *
 * For each owned room with a free spawn it spawns the highest-priority missing
 * creep, sizing the body to the room's full energy capacity (so creeps grow with
 * the colony) and waiting until that body is affordable rather than producing
 * runts. The exception is the emergency path: if the room's energy-delivery
 * pipeline has collapsed (no harvesters AND no miners-or-haulers), it
 * immediately spawns a self-sufficient harvester sized to whatever energy is on
 * hand — the safety net that lets a colony recover from a wipe.
 */
import { CreepRole } from "../types";
import { RoleTargets } from "../config";
import { Census } from "../utils/census";
import { RoomData } from "../utils/roomData";
export declare function runSpawnManager(): void;
/**
 * Pick the highest-priority role this room is under target on (or null if all
 * are satisfied). Exported for unit testing — it is the seam where the
 * ROLE_PRIORITY ordering decides whether builders ever get spawned ahead of the
 * upgrader fleet (see spawn-priority.test).
 */
export declare function pickEconomyRole(targets: RoleTargets, census: Census, home: string, reserved: Record<string, number>): CreepRole | null;
/**
 * Spawn-energy budget for a normal economy creep.
 *
 * Capacity-sized (energyCapacityAvailable) in normal operation — bigger creeps
 * are more efficient, and a healthy hauler fleet keeps the spawn topped up so we
 * can afford them. But sized to energy ON HAND in two cases where waiting for a
 * full body would stall forever:
 *   - bootstrap: no source container yet, so the room cannot fill its capacity;
 *   - degraded: post-bootstrap but the hauler fleet has collapsed to zero, so
 *     energy no longer reaches the spawn. Without sizing down here, the spawn
 *     idles waiting for a body it can never afford and the colony death-spirals
 *     (the observed RCL5 collapse: a full-capacity body of 1800 was unaffordable
 *     once the haulers were gone, so nothing spawned and nothing recovered).
 * In both, sizing to available lets the spawn produce a small creep NOW, which
 * restarts energy flow and recovers (mirrors the emergency-bootstrap path).
 */
export declare function economyBudget(data: RoomData, haulers: number): number;
