# Flickday modular wordmark — round 1

Deterministic vector exploration based on the strongest Firefly directions. Every
variant shares one outlined `flickday` base. Only the media cue changes, preventing
the letterform drift that affected the independently generated play and reel marks.

## Variants

1. `01-core` — neutral wordmark with no media cue.
2. `02-shutter-i` — photography cue; aperture replaces only the `i` dot.
3. `03-play-d` — everyday video/site cue; play counter inside the `d`.
4. `04-reel-d` — cinema/reel cue; film reel inside the `d`.
5. `05-filmstrip-y` — large-format motion cue; filmstrip becomes the `y` descender.
6. `06-reel-to-y` — cinematic hero variant; reel `d` flows into the filmstrip `y`.

Each ships as:

- `*-on-dark.svg` and `*-on-light.svg` — editable outlined vectors.
- `*-on-dark.png` and `*-on-light.png` — transparent 2655×870 PNGs for review,
  Adobe Express, CapCut, and compositing.
- `contact-sheet-dark.jpg`, `contact-sheet-light.jpg` — full-size comparisons.
- `contact-sheet-small.jpg` — small-size survival test.

## Status and constraints

This is an evaluation set, not a replacement for the live identity. The shared base
is **Avenir Next Heavy converted to paths**, chosen because earlier sessions favored
Avenir and because it is close to the accepted Firefly geometry. No runtime font is
required by the SVG files. The exact production typeface is still a design decision.

- Core, shutter-`i`, and play-`d` survive small use.
- Reel-`d` needs medium size for its holes to read.
- Filmstrip-`y` and reel-to-`y` are deliberately large-format variants; do not use
  them as favicons or tiny persistent watermarks.
- The filmstrip is a single controlled gesture. No additional shutter, lens, camera,
  or decorative film symbols should be added to those variants.
- All copy and supporting typography should be composed separately in a real font.

## Rebuild

From the project root:

```bash
node scripts/build-modular-wordmarks.mjs
```

The builder requires macOS `pango-view` to outline the base. Preview PNG/contact-sheet
rendering is a separate ImageMagick step and is intentionally not coupled to the SVG
builder.

