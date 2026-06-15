# `reference/` — Screeps knowledge base for the Cache agents

This directory is **reference material for the autonomous agents** that build and
evolve Cache (Sparse's architect / implementer / tester / diagnosis roles). It is
**not part of the bot**: nothing here is compiled, imported, or uploaded to
Screeps. It exists so agents can look up *real* Screeps semantics instead of
guessing when they are unsure about an API call, a return code, or a game rule.

The agents' sandbox is confined to this repo, so these materials live **inside**
the cache workspace where the tools can read them. Read them with `read_file` or
grep them with `run_shell` (e.g. `grep -n "moveTo" reference/screeps-api.md`).

## Contents

| Path | What it is | Use it when… |
| --- | --- | --- |
| `screeps-api.md` | The official Screeps World API reference (every prototype: `Game`, `Creep`, `Room`, `RoomObject`, `Structure*`, `PathFinder`, …) with property/method signatures, **CPU costs**, **return-code tables**, and the full **constants** list. Compiled from <https://docs.screeps.com/api/>. | You need an exact method signature, what an error code means, a property's type, or a constant's value. |
| `engine/` | A read-only clone of the open-source **Screeps engine** — the server that actually runs Cache. *(git-ignored; set up per-machine, see below.)* | The docs are ambiguous and you need ground truth: edge cases, tick ordering, exactly what an action does and which code it returns. |
| `build-api-md.mjs` | Regenerator for `screeps-api.md`. | The official docs changed and you want to refresh the reference. |
| `setup-engine.sh` | Clones the engine into `engine/`. | Setting up a new box, or refreshing the engine snapshot. |

### Where to look in `engine/`

- `engine/src/game/` — the API objects themselves: `creeps.js`, `rooms.js`,
  `structures.js`, `room-position.js`, `path-finder.js`, `store.js`, … This is
  the implementation behind everything in `screeps-api.md`.
- `engine/src/processor/intents/` — the authoritative logic for **what each
  action does and which return code it yields**, per structure / creep
  (`controllers/`, `towers/`, `spawns/`, `links/`, `labs/`, `creeps/`, …). When
  in doubt about an action's effect or its exact failure code, read the intent.

## Ground rules for agents

- **Reference only.** Never edit these files, never `require`/`import` them into
  Cache source, and never include them in a deploy. They must never reach the
  Screeps runtime.
- Prefer the docs (`screeps-api.md`) for signatures and return codes; drop to the
  engine source (`engine/src`) for behavior the docs don't pin down.

## Setup / regeneration (operators)

`engine/` is git-ignored (it is bulky and machine-local), so each checkout sets it
up once:

```sh
sh reference/setup-engine.sh          # clones screeps/engine into reference/engine
```

`screeps-api.md` **is** committed (so it ships everywhere via `git pull`). To
refresh it from the latest official docs:

```sh
node reference/build-api-md.mjs       # clones screeps/docs, rewrites screeps-api.md
```
