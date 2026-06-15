#!/usr/bin/env sh
# setup-engine.sh — clone the open-source Screeps engine as read-only reference
# material for the Cache agents. The engine is the server that runs Cache, so its
# source is the ground truth for game mechanics, intents, and return codes.
#
# `reference/engine/` is git-ignored (bulky, machine-local), so this is run once
# per checkout / box. Re-running refreshes the snapshot.
#
#   Run from the cache repo root:  sh reference/setup-engine.sh
set -e

REF_DIR="$(cd "$(dirname "$0")" && pwd)"   # .../cache/reference
DEST="$REF_DIR/engine"

echo "cloning screeps/engine -> $DEST"
rm -rf "$DEST"
git clone --depth 1 https://github.com/screeps/engine.git "$DEST"
rm -rf "$DEST/.git"                          # plain snapshot, not a nested repo

echo "done. Game objects: engine/src/game/  |  action logic: engine/src/processor/intents/"
