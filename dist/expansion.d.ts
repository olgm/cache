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
/**
 * Storage energy a base must hold before it may CLAIM a new room. The expansion
 * gate already requires a storage STRUCTURE, but an empty just-built storage
 * passes that check — which is how the colony over-extended into W44N38 with no
 * surplus to fund it (2026-06-27). Requiring a real reserve means a second room
 * is only taken on when the home economy has proven surplus to spare for the
 * claimer + pioneer upkeep. Tunable; the point is "expand only when genuinely
 * rich", and not-expanding is the safe failure mode.
 */
export declare const EXPANSION_STORAGE_RESERVE = 30000;
/** True when storage holds enough surplus energy to fund a new-room expansion. */
export declare function hasExpansionSurplus(storageEnergy: number): boolean;
/**
 * True when this owned room is still ACCUMULATING the energy buffer the claim
 * gate demands before it may expand. While this holds, storage energy is
 * reserved capital: haulers fill storage instead of over-feeding the GCL push,
 * and consumers (upgraders/builders via gatherEnergy) leave it alone — so the
 * buffer can actually reach EXPANSION_STORAGE_RESERVE.
 *
 * Without this the colony DEADLOCKS at low GCL: the claim gate needs a storage
 * surplus, but the hauler's GCL-push funnels every surplus into the controller
 * container, so storage sits at 0 forever — never expanding, so GCL never rises,
 * so the GCL push never relents. (This is the live "W43N38 storage:0, stuck at
 * GCL 2" bug; SPARSE reads the empty storage as "storage capability missing".)
 *
 * Headroom (`ownedRooms < GCL`) is required so a colony that cannot legally
 * claim another room yet does not needlessly hoard energy away from upgrading;
 * once it claims the room, ownedRooms catches up to GCL and the reserve unlocks.
 */
export declare function buildingExpansionReserve(room: Room): boolean;
/** Record intel about a visible room (called by scouts/claimers and the manager). */
export declare function recordIntel(room: Room): void;
export declare function runExpansionManager(): void;
export declare function getExpansionSpawnRequest(room: Room, data: RoomData): SpawnRequest | null;
