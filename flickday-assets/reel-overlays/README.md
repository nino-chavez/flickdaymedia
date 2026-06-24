# Flickday Media — Reel Overlay Kit

Drop-in overlays for Instagram **Reels + Stories** (all 1080×1920 vertical — no
landscape). Built from Flickday's own visual language: **the camera viewfinder.**

Not a recolored hype reel. Flickday is a photography brand, so every overlay reads
like a frame seen through the camera's EVF:

- corner **crop marks** (registration brackets) frame the action
- a faint **rule-of-thirds** guide
- a top **OSD bar** — aperture glyph + `FLICKDAY MEDIA` · `REC ●` timecode
- a bottom **OSD bar** — the live EXIF readout (`f/2.8 · 1/2000 · ISO 200 · 200mm`)
- an **anamorphic lens flare** for energy (the camera's "sizzle" — no radial
  speed-lines, no mascot; those belong to Let's Pepper)
- **left-anchored editorial** type, never centered title cards

Yellow `#facc15` → orange `#f97316` on near-black. The `FLICKDAY MEDIA` wordmark is
a real PNG (custom letterforms — never rebuilt in CSS).

## What's here

| File | Alpha | Use |
|---|---|---|
| `intro-reel` | opaque | Title card at the top of a reel |
| `lowerthird-nameplate-reel` | transparent | **Blank** name/subject plate — type the name in CapCut (see below) |
| `lowerthird-gallery-reel` | transparent | Evergreen "see the full set" gallery CTA — fixed copy, no editing |
| `bug-reel` | transparent | Persistent corner mark (viewfinder bracket + wordmark) |
| `hud-viewfinder-reel` | transparent | Persistent full viewfinder frame for the whole clip |
| `outro-reel` | opaque | End card → lockup + slogan + handle |

`bug-reel` vs `hud-viewfinder-reel`: the bug is a quiet corner credit; the HUD wraps
the whole frame like a live viewfinder (crop marks, OSD bars, REC, a small centre AF
reticle) and leaves the middle clear so it never blocks the action. Pick one per clip.

### The name-plate is a blank template

`lowerthird-nameplate-reel` ships with an **empty text well** (the faint yellow
baseline shows where the name sits) so you add the subject as a CapCut text layer —
it isn't baked in. That keeps it sport-agnostic: type a player name, a team, a
location, whatever the clip needs. Set the CapCut text left-aligned, sitting on the
baseline, in Anton/Impact white. If you'd rather bake the text in instead, pass
`{ tag, lead, sub }` (no `blank`) to `lowerThird()` in the render queue and re-render.

## CapCut layering

1. Footage on the base track.
2. `bug-reel` **or** `hud-viewfinder-reel` on a track above it for the whole clip.
3. `lowerthird-*` over the relevant shot — alpha, so it composites straight on.
4. `intro-reel` / `outro-reel` as full-frame opaque clips at head / tail.

## Regenerate / customize

Edit the `E` block in `scripts/story-assets/render-reel-overlays.mjs` (event title,
date/location, readout) and run:

```
node scripts/story-assets/render-reel-overlays.mjs   # this kit
node scripts/story-assets/render-social-bugs.mjs     # ../social-bugs/  (@handle pills)
```

Lower-third copy (`PLAYER NAME`, tags, sub lines) is set in the render queue at the
bottom of the overlay script — swap per shoot. Defaults are placeholders.

> Rendering reuses Playwright from the sibling `letspepper` repo, so that repo must
> be installed (`pnpm i`) for a regenerate to work.
