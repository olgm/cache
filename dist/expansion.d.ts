/**
 * Cache — Expansion manager (gated, correct).
 *
 * Drives a SECOND room only once the home colony can clearly afford it. The
 * old version wedged itself (claiming an unreachable room at GCL1, claimer never
 * able to claim); this one is hard-gated and self-validating:
 *
 *   gate: ownedRooms < GCL (the real claim limit) AND a mature base
 *         (RCL >= 4 with a storage = genuine energy surplus).
 *
 * Flow: idle → scouting (a scout maps adjacent rooms) → claiming (a claimer
 * takes the best adjacent controller) → bootstrapping (pioneers build the new
 * room's first spawn; the construction planner places the spawn site) → idle.
 *
 * At GCL1 / RCL3 (the current live colony) the gate is closed, so this stays
 * dormant and can never wedge — the corrupt legacy state is reset on migration.
 */
import { CreepRole } from "./types";
import { RoomData } from "./utils/roomData";
export interface SpawnRequest {
    role: CreepRole;
    body: BodyPartConstant[];
    memory: CreepMemory;
}
/** Record intel about a visible room (called by scouts/claimers and the manager). */
export declare function recordIntel(room: Room): void;
export declare function runExpansionManager(): void;
export declare function getExpansionSpawnRequest(room: Room, data: RoomData): SpawnRequest | null;
