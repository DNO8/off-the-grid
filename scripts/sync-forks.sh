#!/usr/bin/env bash
# Check out the pinned Sozu Capital bitchat forks under ./forks.
# Those trees already send text. This script does not patch them.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
mkdir -p forks

node --input-type=module <<'EOF' | while IFS=$'\t' read -r name url sha; do
import { readFileSync } from "node:fs";
const pins = JSON.parse(readFileSync("forks.json", "utf8"));
for (const [name, pin] of Object.entries(pins)) {
  process.stdout.write(`${name}\t${pin.fork}.git\t${pin.sha}\n`);
}
EOF
  dest="forks/$name"
  if [[ ! -d "$dest/.git" ]]; then
    git clone "$url" "$dest"
  fi
  git -C "$dest" fetch origin "$sha"
  git -C "$dest" checkout --detach "$sha"
  echo "$name at $sha"
done
