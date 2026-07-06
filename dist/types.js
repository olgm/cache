"use strict";
/**
 * Cache v0.3.0 — Shared types, constants, and interfaces.
 *
 * This release is a fundamentals rewrite: a static-mining economy (dedicated
 * container miners + haulers), RCL-scaled creep counts and body sizes, an
 * auto-construction planner, tower defense, and a gated multi-room expansion.
 * The legacy remote-mining subsystem was removed (premature for an early
 * single-room colony — re-introduce at RCL4+).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BODY_COST = exports.SPAWN_ERROR_CAP = void 0;
exports.defaultExpansionMemory = defaultExpansionMemory;
/** Max spawn-error entries retained (newest-wins). Small: this is a recent-signal buffer, not a log. */
exports.SPAWN_ERROR_CAP = 10;
function defaultExpansionMemory() {
    return { state: "idle", scoutedRooms: {}, intel: {} };
}
// --- Body part costs (from Screeps constants) ---
exports.BODY_COST = {
    move: 50,
    work: 100,
    carry: 50,
    attack: 80,
    ranged_attack: 150,
    heal: 250,
    claim: 600,
    tough: 10,
};
//# sourceMappingURL=types.js.map