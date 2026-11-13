#!/usr/bin/env bash
# Build the folder to copy to the server: public game files, MP3 copies of the
# sounds for browsers without Ogg (iPhone/Safari), and the server script.
# Usage: server/build-web.sh [OUTDIR]   (default: dist/buttongame-server)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/dist/buttongame-server}"

rm -rf "$OUT"
mkdir -p "$OUT/www/assets/sfx"
cp "$ROOT/index.html" "$ROOT/game.js" "$OUT/www/"
find "$ROOT/assets" -maxdepth 1 -type f -exec cp {} "$OUT/www/assets/" \;
for source in "$ROOT/assets/sfx/"*.ogg; do
  cp "$source" "$OUT/www/assets/sfx/"
done
test -s "$OUT/www/assets/sfx/4273.ogg"

if command -v ffmpeg >/dev/null; then
  for source in "$OUT/www/assets/sfx/"*.ogg; do
    ffmpeg -loglevel error -y -i "$source" -codec:a libmp3lame -q:a 4 "${source%.ogg}.mp3"
  done
else
  echo "WARNING: ffmpeg not found, no MP3 sounds: iPhone/Safari may be silent." >&2
fi

cp "$ROOT/server/buttongame_server.py" "$ROOT/server/buttongame.service" \
   "$ROOT/server/install-on-server.sh" "$ROOT/server/nginx-buttongame-locations.conf" "$OUT/"
cmp "$ROOT/game.js" "$OUT/www/game.js"
cmp "$ROOT/index.html" "$OUT/www/index.html"
echo "Built $OUT ($(find "$OUT/www" -type f | wc -l) web files)"
