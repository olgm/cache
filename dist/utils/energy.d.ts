/**
 * Cache — shared energy acquisition.
 *
 * Used by generalist consumers (builders, upgraders) to fill up from the best
 * available source. Order is chosen to keep the colony healthy: free/cheap
 * energy first (dropped, tombstones, ruins), then buffers (storage, source
 * containers), and finally a direct-harvest fallback so a creep is NEVER idle
 * during the early bootstrap when no buffers exist yet.
 *
 * Deliberately does NOT pull from spawns/extensions — that energy is reserved
 * for spawning, and draining it would stall creep production.
 */
import { RoomData } from "./roomData";
/** True if the creep issued a gather action (move/withdraw/pickup/harvest). */
export declare function gatherEnergy(creep: Creep, data: RoomData): boolean;
