# Economy basics (early game)

- **Sources → containers → haulers.** Park a static miner (WORK-heavy) on a
  container beside each source; dedicated haulers carry energy to
  spawn/extensions/controller. A miner that walks to deposit wastes its life on
  travel — keep it on the container.
- **Miner:hauler ratio scales with distance.** One hauler per source for short
  hauls; add a second as the spawn/controller distance grows. Size haulers in
  CARRY pairs (2C/1M moves full on roads).
- **Upgraders are funded LAST, from surplus** — never at the cost of spawning the
  economy that feeds them. A controller-adjacent container ("upgrader battery")
  fed by haulers keeps upgraders parked and cheap.
- **Storage is the buffer that prevents death spirals.** Once RCL4 allows it, a
  storage holding a few hundred k energy lets the colony ride out a harvester gap
  instead of collapsing. Prefer resilience over peak throughput.
- **Spawn priority under starvation:** a replacement harvester/hauler outranks any
  upgrader or builder. Losing the income creeps is how a colony death-spirals
  (see the 2026-06-27 W43N38 collapse).

These are starting heuristics, not laws — verify with `run_experiment` when a
change is non-obvious, and record what actually moved the metric in the notebook.
