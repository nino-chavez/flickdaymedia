#!/usr/bin/env bash
#
# Flickday Media — Direct-to-Film (DTF) apparel art.
#
#   bash scripts/apparel/render-dtf.sh
#
# Takes the brand marks and produces print-ready, transparent, VECTOR-TRACED
# colorways for heat-press onto apparel. The marks are flat 2-colour (yellow
# #facc15 + structural black), which traces cleanly, so output is crisp at any
# print size — left chest to full back.
#
# Per mark, up to four colorways:
#   fullcolor     yellow + black            → light / medium garments
#   dark-keyline  fullcolor + cream outline → dark garments (lifts the mark off black)
#   mono-white    1-colour white knockout   → dark garments (seams show the shirt)
#   mono-black    1-colour black knockout   → light garments / tonal
# (dark-keyline is only generated for the icon marks; on wordmarks a per-letter
#  outline reads badly, so mono-white is the dark-garment option there.)
#
# Output: flickday-assets/dtf/<mark>/   +   dtf/_mockups.png contact sheet
#
# Requires: ImageMagick 7 (magick), potrace, node. All on PATH via Homebrew.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
ASSETS="$ROOT/flickday-assets"
OUT="$ASSETS/dtf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PX=3600                 # long-edge print res (~12in @ 300dpi — usable up to a full back)
YELLOW="#facc15"
INK="#0a0a0a"
KEYLINE="#f7f3e8"       # warm off-white outline for dark garments
combine="$HERE/_combine.mjs"

mkdir -p "$OUT"

# vectorize <transparent-src> <name> <keyline:yes|no>
vectorize() {
  local src="$1" name="$2" keyline="$3"
  local dir="$OUT/$name"; mkdir -p "$dir"
  local W H; read -r W H < <(magick identify -format "%w %h\n" "$src")

  # three masks (white = the feature):
  #   opaque  = all artwork (from alpha)           → the silhouette
  #   blackm  = only TRUE-dark pixels (luminance)  → structural black; ignores shaded yellow
  #   bodym   = opaque minus black                 → yellow body with seams knocked open
  magick "$src" -background white -flatten "$TMP/flat.png"
  magick "$src" -alpha extract -threshold 50% "$TMP/opaque.png"
  magick "$TMP/flat.png" -colorspace Gray -threshold 25% -negate "$TMP/blackm.png"
  magick "$TMP/opaque.png" "$TMP/blackm.png" -compose Difference -composite "$TMP/bodym.png"
  # potrace bitmaps need the shape in black
  magick "$TMP/opaque.png" -negate "$TMP/sil.bmp"
  magick "$TMP/blackm.png" -negate "$TMP/blk.bmp"
  magick "$TMP/bodym.png"  -negate "$TMP/body.bmp"
  potrace "$TMP/sil.bmp"  -s --turdsize 2 -o "$TMP/sil.svg"
  potrace "$TMP/blk.bmp"  -s --turdsize 2 -o "$TMP/blk.svg"
  potrace "$TMP/body.bmp" -s --turdsize 2 -o "$TMP/body.svg"

  # full colour: full silhouette in yellow, true black detail on top (black caps the edge → no fringe)
  node "$combine" "$TMP/full.svg" "$W" "$H" "$TMP/sil.svg" "$YELLOW" "$TMP/blk.svg" "$INK"
  magick -background none "$TMP/full.svg" -resize "${PX}x" "$dir/$name-fullcolor.png"

  # mono knockouts (body only — seams remain open)
  node "$combine" "$TMP/mw.svg" "$W" "$H" "$TMP/body.svg" "#ffffff"
  node "$combine" "$TMP/mb.svg" "$W" "$H" "$TMP/body.svg" "$INK"
  magick -background none "$TMP/mw.svg" -resize "${PX}x" "$dir/$name-mono-white.png"
  magick -background none "$TMP/mb.svg" -resize "${PX}x" "$dir/$name-mono-black.png"

  # dark-garment keyline (icon marks only)
  if [ "$keyline" = "yes" ]; then
    magick "$dir/$name-fullcolor.png" \( +clone -alpha extract -morphology Dilate Disk:26 \) \
      -alpha off -compose CopyOpacity -composite -fill "$KEYLINE" -colorize 100 "$TMP/kl.png"
    magick "$TMP/kl.png" "$dir/$name-fullcolor.png" -compose over -composite "$dir/$name-dark-keyline.png"
  fi
  echo "  ✓ $name"
}

echo "Rendering DTF apparel art (${PX}px long edge)..."

# slogan lockup ships on black — floodfill the background out, keep interior seams
magick "$ASSETS/lockup-slogan-pro.png" -alpha set -fuzz 22% -fill none \
  -draw "alpha 0,0 floodfill" -draw "alpha %[fx:w-1],0 floodfill" \
  -draw "alpha 0,%[fx:h-1] floodfill" -draw "alpha %[fx:w-1],%[fx:h-1] floodfill" \
  "$TMP/slogan-src.png"

# keyline only for the clean solid icon — on the particle-heavy motion mark and on
# the wordmarks an outline reads noisy; those use mono-white on dark garments.
vectorize "$ASSETS/outro/aperture-icon-transparent.png" "icon"   yes
vectorize "$ASSETS/outro/motion-icon-transparent.png"   "motion" no
vectorize "$ASSETS/outro/lockup-transparent.png"        "lockup" no
vectorize "$TMP/slogan-src.png"                          "slogan" no

# ── type-based marks: secondary wordmark + f-stop monogram ──────────────────
# Built live from Poppins + the brand iris (make-iris.mjs), as flat 2-colour
# (yellow letters + black aperture blades) so they trace like every other mark.
# The composite offsets below are tuned for these exact fonts + point sizes;
# re-tune the matching -geometry if you change a size.
FONTS="$HERE/fonts"
node "$HERE/make-iris.mjs" "$TMP/iris.svg"
rsvg-convert -w 360 "$TMP/iris.svg" -o "$TMP/iris-wm.png"
rsvg-convert -w 470 "$TMP/iris.svg" -o "$TMP/iris-fs.png"

# secondary wordmark: lowercase "flickday" with the iris filling the d bowl
magick -background none -fill "$YELLOW" -font "$FONTS/Poppins-SemiBold.ttf" \
  -pointsize 600 label:flickday "$TMP/wm.png"
magick "$TMP/wm.png" "$TMP/iris-wm.png" -geometry +1254+306 -composite \
  -trim +repage "$TMP/wordmark-src.png"

# f-stop monogram: f / aperture (reads as an f-number, e.g. f/2.8)
magick -background none -fill "$YELLOW" -font "$FONTS/Poppins-Bold.ttf" -pointsize 700 label:'f' "$TMP/f.png"
magick -background none -fill "$YELLOW" -font "$FONTS/Poppins-Bold.ttf" -pointsize 700 label:'/' "$TMP/sl.png"
magick -size 1000x981 xc:none \
  "$TMP/f.png"       -gravity NorthWest -geometry +0+0     -composite \
  "$TMP/sl.png"      -gravity NorthWest -geometry +150+0   -composite \
  "$TMP/iris-fs.png" -gravity NorthWest -geometry +405+345 -composite \
  -trim +repage "$TMP/fstop-src.png"

vectorize "$TMP/wordmark-src.png" "wordmark" no
vectorize "$TMP/fstop-src.png"    "fstop"    no

# tag every output with 300 DPI so DTF software reads the true print size (px/300 = inches)
find "$OUT" -name '*.png' -exec magick mogrify -units PixelsPerInch -density 300 {} +

# ── mockup contact sheet: each mark's colorways on the garment it's made for ──
cell() { # <art> <bg> <out>
  magick -size 620x620 xc:"$2" \( "$1" -trim +repage -resize 480x440 \) \
    -gravity center -composite "$3"
}
rows=()
for name in icon motion lockup slogan wordmark fstop; do
  d="$OUT/$name"
  cell "$d/$name-fullcolor.png"  "#f4f2ec" "$TMP/${name}_a.png"
  cell "$d/$name-mono-black.png" "#f4f2ec" "$TMP/${name}_b.png"
  if [ -f "$d/$name-dark-keyline.png" ]; then
    cell "$d/$name-dark-keyline.png" "#141414" "$TMP/${name}_c.png"
  else
    cell "$d/$name-fullcolor.png" "#141414" "$TMP/${name}_c.png"
  fi
  cell "$d/$name-mono-white.png" "#141414" "$TMP/${name}_d.png"
  magick "$TMP/${name}_a.png" "$TMP/${name}_b.png" "$TMP/${name}_c.png" "$TMP/${name}_d.png" +append "$TMP/row_${name}.png"
  rows+=("$TMP/row_${name}.png")
done
magick "${rows[@]}" -append "$OUT/_mockups.png"

echo "Done. DTF art in flickday-assets/dtf/  (preview: dtf/_mockups.png)"
