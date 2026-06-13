/**
 * Cache v0.3.0 — Main loop.
 *
 * Called every tick by the Screeps runtime. Order of operations:
 *   1. Memory hygiene (prune dead creeps; one-time schema migration).
 *   2. Managers: expansion → construction → towers → spawning.
 *   3. Creep role dispatch.
 *   4. Telemetry (Memory.stats) LAST, so SPARSE observes this tick's real state.
 *
 * Every subsystem and every creep is wrapped in try/catch that LOGS to the
 * console (it never swallows silently) — SPARSE diagnoses partly off console
 * errors, so a crashing subsystem must be visible, not invisible.
 */
export declare function loop(): void;
