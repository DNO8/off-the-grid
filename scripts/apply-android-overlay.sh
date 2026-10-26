#!/usr/bin/env bash
# Copy the Sozu mesh overlay onto a checkout of the pinned bitchat-android tree.
# The pin stays unmodified in Sozu-Capital/bitchat-android. Releases are built here.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="${1:-$root/forks/android}"

if [[ ! -d "$dest/app" ]]; then
  echo "error: $dest is not a bitchat-android checkout. Run ./scripts/sync-forks.sh first, or pass that directory." >&2
  exit 1
fi

cp -R "$root/android/sozu/." "$dest/"
echo "applied Sozu overlay onto $dest"
