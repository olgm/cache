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
/**
 * Gather energy from the best available source.
 *
 * @param creep        The creep that needs energy.
 * @param data         Per-tick cached room snapshot.
 * @param minSpawnDrain Minimum energy a spawn/extension must hold before step 6
 *                      will withdraw from it (default 50).  Callers that have a
 *                      dedicated supply (e.g. upgraders with a controller
 *                      container) pass a higher value to avoid draining the
 *                      spawn and stalling creep production.
 */
export declare function gatherEnergy(creep: Creep, data: RoomData, minSpawnDrain?: number): boolean;
