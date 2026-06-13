/**
 * Cache — per-room, per-tick data snapshot.
 *
 * Centralises the expensive room.find() calls so every subsystem (spawning,
 * construction, towers, roles) shares one cached view per room per tick instead
 * of each re-scanning. Cached in a module Map keyed by room name; invalidated
 * automatically when Game.time advances.
 */
/** Info about a single source and its mining infrastructure. */
export interface SourceData {
    source: Source;
    /** Built container within range 1 of the source, if any. */
    container?: StructureContainer;
    /** Container construction site within range 1, if any. */
    containerSite?: ConstructionSite;
    /** Number of walkable (non-wall) tiles adjacent to the source. */
    openSlots: number;
}
export interface RoomData {
    room: Room;
    /** Controller level (0 if unowned). */
    rcl: number;
    sources: SourceData[];
    spawns: StructureSpawn[];
    extensions: StructureExtension[];
    towers: StructureTower[];
    containers: StructureContainer[];
    storage?: StructureStorage;
    /** Container within range 3 of the controller (upgrader supply). */
    controllerContainer?: StructureContainer;
    constructionSites: ConstructionSite[];
    /** Hostile creeps with offensive parts (attack/ranged/heal). */
    hostiles: Creep[];
    /** All hostile creeps (incl. unarmed scouts). */
    allHostiles: Creep[];
    energyAvailable: number;
    energyCapacity: number;
}
/** Build (or fetch the cached) per-tick data for a room. */
export declare function getRoomData(room: Room): RoomData;
/** All rooms we own a controller in. */
export declare function myRooms(): Room[];
