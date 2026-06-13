/**
 * Cache — Defender role.
 *
 * A melee fallback for when a room has hostiles but no tower (or the towers are
 * overwhelmed). Towers do the heavy lifting once built, so defenders are spawned
 * sparingly. Attacks the closest hostile; idles near the spawn otherwise.
 */
export declare function runDefender(creep: Creep): void;
