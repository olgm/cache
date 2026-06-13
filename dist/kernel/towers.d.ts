/**
 * Cache — Tower control + safe-mode defense.
 *
 * Each owned room's towers: attack hostiles (focus-firing one target for kills),
 * else heal damaged friendly creeps, else perform conservative repairs (decayed
 * roads/containers, and ramparts/walls kept to a modest cap) only while the
 * tower has enough energy spare to not compromise defense.
 *
 * Safe mode is triggered only as a last resort — when a spawn is actually taking
 * damage and the room can't defend itself — to avoid burning the limited
 * activations on harmless intruders.
 */
export declare function runTowers(): void;
