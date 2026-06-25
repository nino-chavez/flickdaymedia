# Flickday Media — Reel Overlay Kit

Drop-in overlays for Instagram **Reels + Stories** (all 1080×1920 vertical — no
landscape). Built from Flickday's v2 visual language.

This is the kinetic/editorial system, **not** the old camera-viewfinder kit (no
crop marks, no EXIF readout, no AF reticle, no aperture glyph, no standalone F).
Every overlay is built from the brand's own parts:

- the **flickday wordmark** (play-in-the-'d') + `MEDIA` as the persistent bug
- a left **accent bar** (yellow→orange) framing captions — not crop brackets
- a **streak-grid** strip as the daily-cadence signature
- a **day counter** (`Day 247 / 365`) where the f-stop EXIF line used to be
- the **kinetic K wordmark** + **masthead nameplate** on the end card

Yellow `#facc15` → orange `#f97316` on near-black. **left-anchored** editorial type,
never centered title cards. No radial speed-lines, no mascot — those belong to
Let's Pepper. This is Flickday speaking for itself.

## What's here

| File | Alpha | Use |
|---|---|---|
| `intro-reel` | opaque | Title card at the top of a reel |
| `lowerthird-nameplate-reel` | transparent | **Blank** name/subject plate — type the name in CapCut (see below) |
| `lowerthird-gallery-reel` | transparent | Evergreen "see the full set" gallery CTA — fixed copy, no editing |
| `bug-reel` | transparent | Persistent corner mark (`flickday` wordmark + `MEDIA`) |
| `hud-frame-reel` | transparent | Persistent edge frame for the whole clip — bug + day strip + top/bottom scrims |
| `outro-reel` | opaque | End card → masthead nameplate + streak + handle |

`bug-reel` vs `hud-frame-reel`: the bug is a quiet corner credit; the frame adds the
bottom handle/day strip and faint top+bottom scrims so type stays legible over busy
footage — and leaves the middle clear so it never blocks the action. Pick one per clip.

### The name-plate is a blank template

`lowerthird-nameplate-reel` ships with an **empty text well** (the faint yellow
baseline shows where the name sits) so you add the subject as a CapCut text layer —
it isn't baked in. That keeps it sport-agnostic: type a player name, a team, a
location, whatever the clip needs. Set the CapCut text left-aligned, sitting on the
baseline, in Bebas Neue / Impact white. To bake the text in instead, pass
`{ tag, lead, sub }` (no `blank`) to `lowerThird()` in the render queue and re-render.

## CapCut layering

1. Footage on the base track.
2. `bug-reel` **or** `hud-frame-reel` on a track above it for the whole clip.
3. `lowerthird-*` over the relevant shot — alpha, so it composites straight on.
4. `intro-reel` / `outro-reel` as full-frame opaque clips at head / tail.

## Regenerate / customize

The brand language lives in `scripts/story-assets/_brand-v2.mjs` (one source of
truth for the F glyph, kinetic wordmark, streak grid, masthead, and end card).
Fonts are embedded (offline-safe) via `_fonts.mjs` — rebuild with `_build-fonts.mjs`
only if the font set changes.

Edit the `E` block in `render-reel-overlays.mjs` (event title, meta, day counter,
handle) and run:

```
node scripts/story-assets/render-reel-overlays.mjs   # this kit
node scripts/story-assets/render-social-bugs.mjs     # ../social-bugs/  (@handle pills)
node scripts/story-assets/render-outro-v2.mjs        # ../outro/  (end cards + lockups)
node scripts/story-assets/render-brand-v2.mjs        # ../  (site marks: og, header, favicon, footer)
```
