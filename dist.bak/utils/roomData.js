"use strict";
/**
 * Cache — per-room, per-tick data snapshot.
 *
 * Centralises the expensive room.find() calls so every subsystem (spawning,
 * construction, towers, roles) shares one cached view per room per tick instead
 * of each re-scanning. Cached in a module Map keyed by room name; invalidated
 * automatically when Game.time advances.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomData = getRoomData;
exports.myRooms = myRooms;
const _cache = new Map();
let _cacheTick = -1;
/** Number of walkable tiles directly adjacent to a position. */
function countOpenSlots(pos, terrain) {
    let n = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0)
                continue;
            const x = pos.x + dx;
            const y = pos.y + dy;
            if (x < 0 || x > 49 || y < 0 || y > 49)
                continue;
            if (terrain.get(x, y) !== TERRAIN_MASK_WALL)
                n++;
        }
    }
    return n;
}
/** Build (or fetch the cached) per-tick data for a room. */
function getRoomData(room) {
    if (_cacheTick !== Game.time) {
        _cache.clear();
        _cacheTick = Game.time;
    }
    const hit = _cache.get(room.name);
    if (hit)
        return hit;
    const terrain = room.getTerrain();
    const structures = room.find(FIND_STRUCTURES);
    const containers = [];
    const towers = [];
    const extensions = [];
    let storage;
    for (const s of structures) {
        if (s.structureType === STRUCTURE_CONTAINER)
            containers.push(s);
        else if (s.structureType === STRUCTURE_TOWER)
            towers.push(s);
        else if (s.structureType === STRUCTURE_EXTENSION)
            extensions.push(s);
        else if (s.structureType === STRUCTURE_STORAGE)
            storage = s;
    }
    const sites = room.find(FIND_CONSTRUCTION_SITES);
    const containerSites = sites.filter((s) => s.structureType === STRUCTURE_CONTAINER);
    const sources = room.find(FIND_SOURCES).map((source) => {
        const container = containers.find((c) => c.pos.inRangeTo(source.pos, 1));
        const containerSite = containerSites.find((c) => c.pos.inRangeTo(source.pos, 1));
        return {
            source,
            container,
            containerSite,
            openSlots: countOpenSlots(source.pos, terrain),
        };
    });
    let controllerContainer;
    if (room.controller) {
        controllerContainer = containers.find((c) => c.pos.inRangeTo(room.controller.pos, 3) && !sources.some((sd) => sd.container === c));
    }
    const allHostiles = room.find(FIND_HOSTILE_CREEPS);
    const hostiles = allHostiles.filter((c) => c.getActiveBodyparts(ATTACK) > 0 ||
        c.getActiveBodyparts(RANGED_ATTACK) > 0 ||
        c.getActiveBodyparts(HEAL) > 0 ||
        c.getActiveBodyparts(WORK) > 0);
    const data = {
        room,
        rcl: room.controller ? room.controller.level : 0,
        sources,
        spawns: room.find(FIND_MY_SPAWNS),
        extensions,
        towers,
        containers,
        storage,
        controllerContainer,
        constructionSites: sites,
        hostiles,
        allHostiles,
        energyAvailable: room.energyAvailable,
        energyCapacity: room.energyCapacityAvailable,
    };
    _cache.set(room.name, data);
    return data;
}
/** All rooms we own a controller in. */
function myRooms() {
    const out = [];
    for (const name in Game.rooms) {
        const room = Game.rooms[name];
        if (room.controller && room.controller.my)
            out.push(room);
    }
    return out;
}
//# sourceMappingURL=roomData.js.map