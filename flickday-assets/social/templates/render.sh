#!/usr/bin/env bash
# Re-render all four templates at both sizes.
#   ./render.sh                 all four
#   ./render.sh drop-notice     just one
# Facts live in *.data.json. Edit those, not the HTML, then run this.
set -euo pipefail
cd "$(dirname "$0")"
RK="$HOME/Workspace/dev/tools/render-kit/bin/render-kit.mjs"

bases=("$@")
if [ ${#bases[@]} -eq 0 ]; then
  bases=(booking-push drop-notice partner-thanks coverage-schedule)
fi

for base in "${bases[@]}"; do
  for spec in feed:1350 story:1920; do
    fmt="${spec%%:*}"; h="${spec##*:}"
    tmp="_${base}.${fmt}.json"
    python3 -c "
import json
d = json.load(open('${base}.data.json')); d['format'] = '${fmt}'
json.dump(d, open('${tmp}', 'w'), ensure_ascii=False)
"
    node "$RK" "${base}.html" --data "$tmp" --width 1080 --height "$h" --out "${base}-${fmt}.png"
    rm -f "$tmp"
  done
done
echo "Rendered ${#bases[@]} template(s) at 2 sizes each."
