# Cache strategy playbooks

Curated, human-readable Screeps strategy notes the **Overseer** consults before
uncertain decisions (pointed at by `CACHE-STRATEGY.md` and the `overseer` persona).

Reference-only: like the rest of `reference/`, these are NEVER uploaded to Screeps
or injected into a Stack trial — `cache-deploy.ts`'s `collectJs` skips `reference/`.
They ship via `git pull` (committed), exactly like `reference/screeps-api.md`.

Add one file per topic (build orders, miner:hauler math, remote-mining economics,
defense/tower logic, expansion timing, link networks). Keep them concise and
concrete: they are read into an agent's context, so signal-per-token matters.
