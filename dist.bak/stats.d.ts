/**
 * Cache — Memory.stats telemetry writer.
 *
 * SPARSE (the autonomous overseer) steers ENTIRELY off Memory.stats: it polls
 * `GET /api/user/memory?path=stats`, decodes it, and runs its eval + phase model
 * + diagnosis on the result. If the bot does not WRITE Memory.stats every tick,
 * SPARSE is blind and steers on a fossil snapshot — which is exactly what
 * happened (the stats tick froze for days while the bot kept playing). So this
 * MUST run, and it must run every tick.
 *
 * The shape mirrors what SPARSE's `parseStats` reads: a freshness `tick`, nested
 * `gcl`/`cpu`, and per-room `{rcl, rclProgress, income1k, …}`. Only OWNED rooms
 * are reported, so a transient scouted/reserved room (e.g. a one-tick scout
 * outpost) never pollutes the colony-health averages or becomes a phantom
 * "weakest room". The caller wraps this in try/catch, so a stats failure can
 * never break the tick.
 */
/** Build and persist the Memory.stats telemetry blob for the current tick. */
export declare function writeStats(): void;
