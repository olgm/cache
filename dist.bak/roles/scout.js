"use strict";
/**
 * Cache — Scout role.
 *
 * A disposable 1-MOVE creep that maps the rooms adjacent to its home, recording
 * intel the expansion manager uses to pick a claim target. When every neighbour
 * has fresh intel it idles at home (cheap) until the intel goes stale, then
 * resumes — so we don't respawn scouts needlessly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScout = runScout;
const movement_1 = require("../utils/movement");
const expansion_1 = require("../expansion");
const INTEL_FRESH = 5000;
function runScout(creep) {
    (0, expansion_1.recordIntel)(creep.room);
    const home = creep.memory.homeRoom || creep.room.name;
    const target = nextTarget(home);
    if (!target) {
        // All mapped — wait at home.
        if (creep.room.name !== home)
            (0, movement_1.travelToRoom)(creep, home);
        else if (creep.room.controller)
            (0, movement_1.travel)(creep, creep.room.controller, 3);
        return;
    }
    if (creep.room.name !== target)
        (0, movement_1.travelToRoom)(creep, target);
}
/** First adjacent-to-home room lacking fresh intel. */
function nextTarget(home) {
    var _a, _b;
    const exits = Game.map.describeExits(home);
    if (!exits)
        return null;
    const intel = (_b = (_a = Memory.expansion) === null || _a === void 0 ? void 0 : _a.intel) !== null && _b !== void 0 ? _b : {};
    for (const name of Object.values(exits)) {
        const i = intel[name];
        if (!i || Game.time - i.lastSeen > INTEL_FRESH)
            return name;
    }
    return null;
}
//# sourceMappingURL=scout.js.map