/**
 * Cache — Expansion manager (gated, correct).
 *
 * Drives a SECOND room only once the home colony can clearly afford it. The
 * old version wedged itself (claiming an unreachable room at GCL1, claimer never
 * able to claim); this one is hard-gated and self-validating:
 *
 *   scout gate:   RCL >= 3 (map neighbours early — cheap prep, runs in parallel
 *                 with upgrading; intel is ready the moment GCL unlocks).
 *   claim gate:   ownedRooms < GCL AND RCL >= 4 AND storage (mature surplus).
 *
 * Flow: idle → scouting (a scout maps adjacent rooms) → claiming (a claimer
 * takes the best adjacent controller) → bootstrapping (pioneers build the new
 * room's first spawn; the construction planner places the spawn site) → idle.
 *
 * Scouting is cheap (one MOVE part) and pays off later when GCL unlocks —
 * we arrive at GCL 2 with intel already in hand instead of starting blind.
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
