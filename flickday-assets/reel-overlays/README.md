# Flickday Media — Reel Overlay Kit

Drop-in overlays for Instagram **Reels + Stories** (all 1080×1920 vertical). Built
from Flickday's v2 visual language: left-anchored editorial type, yellow `#facc15`
→ orange `#f97316` on near-black, the streak-grid signature, the flickday wordmark
(play-in-the-'d') + `MEDIA` bug. No camera-viewfinder chrome, no mascot — that
belongs to Let's Pepper. This is Flickday speaking for itself.

## The one rule that makes it look pro

**Type lives on a scrim or a solid card — never on a raw blend mode.** Soft light /
Overlay are contrast blends; they wash typographic cards into the footage (that
muddy look). Every overlay here either carries its own dark scrim or is a full
card, so it composites with **Normal** blend and stays crisp. The only Screen-blend
asset is the ghost, and it's built on pure black specifically for that.

## Three ways to open (and close)

| Pattern | Asset | Footage shows? | Best for |
|---|---|---|---|
| **Hard-cut card** | `intro-reel` / `outro-reel` / `outro-swipe` | No — full frame | Cleanest, most legible. Cut to it for 0.8–1.5s, then cut to footage. |
| **Composite-over-footage** | `intro-overlay` / `intro-letterbox` / `outro-overlay` | Yes — action plays under it | Modern social. Keeps energy/action visible; scrim guarantees legibility. |
| **Double-exposure ghost** | `intro-ghost` | Yes — ghosted | Stylized. Bright marks ghost over footage with clean negative space. |

## What's here

| File | Alpha | Blend / opacity | Use |
|---|---|---|---|
| `intro-reel` | opaque | **Normal** 100% | Full-frame title card at the head of a reel |
| `intro-overlay-reel` | transparent | **Normal** 100% | Title over the opening action — clear top, headline on a bottom scrim |
| `intro-letterbox-reel` | transparent | **Normal** 100% | Cinematic top/bottom bars, action clear in the center |
| `intro-ghost-reel` | opaque (pure #000) | **Screen** 100% | Double-exposure title — black drops out, marks ghost over footage |
| `bug-reel` | transparent | **Normal** 100% | Persistent corner mark (`flickday` + `MEDIA`) |
| `hud-frame-reel` | transparent | **Normal** 100% | Persistent edge frame — bug + day strip + faint top/bottom scrims, middle clear |
| `lowerthird-nameplate-reel` | transparent | **Normal** 100% | **Blank** name/subject plate — type the name in CapCut (see below) |
| `lowerthird-gallery-reel` | transparent | **Normal** 100% | Evergreen "see the full set" gallery CTA — fixed copy |
| `outro-reel` | opaque | **Normal** 100% | Full-frame end card — masthead + streak + handle |
| `outro-overlay-reel` | transparent | **Normal** 100% | Closing brand block over a slowed/frozen final shot |
| `outro-swipe-reel` | opaque (yellow) | **Normal** 100% | Punchy full-bleed end card for a wipe/swipe reveal |

`bug-reel` vs `hud-frame-reel`: the bug is a quiet corner credit; the frame adds the
bottom handle/day strip + faint scrims so type stays legible over busy footage, and
leaves the middle clear so it never blocks the action. Pick one per clip.

## Blend cheat-sheet (this kit is light type on dark)

| You want | Blend | Opacity | On |
|---|---|---|---|
| Legible card / scrim overlay / lower-third | **Normal** | 100% | any overlay above |
| Bright marks only, ghosted over footage | **Screen** | 100% | `intro-ghost` (pure-black asset) |
| Streak / grain / light-leak *texture* | Screen or Soft light | 30–50% | a texture-only asset |
| Darken footage behind type | Multiply | 60–100% | a dark scrim/vignette asset |
| **Headline type** | never a contrast blend | — | — |

If a card looks washed: you're on Soft light / Overlay. Switch to **Normal** (cards)
or **Screen** (the ghost on its pure-black background).

## Motion (CapCut keyframes — what sells the "pro" feel)

Static PNGs; animate them in CapCut. Keep moves fast (8–14 frames) and ease-out.

- **Hard-cut card** (`intro-reel`): hold 0.8–1.2s. Optional: the headline rises +24px
  with a fade, the streak strip wipes left→right. Whip-cut or 6-frame dip-to-black
  into the first shot.
- **Over-action** (`intro-overlay`): scrim + headline fade up over 10 frames as the
  clip starts; hold ~1.5s; let the headline slide down 30px and fade as the action
  peaks.
- **Letterbox** (`intro-letterbox`): bars slide in from top/bottom (12 frames); the
  accent rules draw on; hold; bars retract on the first big moment.
- **Ghost** (`intro-ghost`, **Screen**): scale 104%→100% + fade over the first ~1.5s.
  Pick a shot with clean sky/turf negative space so the white reads.
- **Freeze outro** (`outro-overlay`): freeze the last frame (or slow to 0.3×),
  desaturate slightly, fade the scrim + block up; hold 2–3s.
- **Swipe card** (`outro-swipe`): wipe it on with a left→right or clock wipe (or mask
  the play-triangle as the wipe shape) off the final shot; hold 2s.

## CapCut layering

1. Footage on the base track.
2. **Open**: `intro-reel` head clip (full-frame) — OR `intro-overlay` / `intro-letterbox`
   on a track above the first ~2s — OR `intro-ghost` above the footage set to **Screen**.
3. Whole-clip: `bug-reel` **or** `hud-frame-reel` on a track above the footage.
4. `lowerthird-*` over the relevant shot.
5. **Close**: `outro-reel` / `outro-swipe` tail clip (full-frame) — OR `outro-overlay`
   over a slowed final shot.

### Safe zones

Instagram's UI covers the **right edge** (action buttons) and the **bottom ~250px**
(caption/handle). The kit is left-anchored to dodge the buttons; if a clip will keep
the IG caption visible, nudge tail clips so the day-strip isn't hidden behind it.

### The name-plate is a blank template

`lowerthird-nameplate-reel` ships with an **empty text well** (the faint yellow
baseline shows where the name sits) so you add the subject as a CapCut text layer.
Left-aligned, on the baseline, Bebas Neue / Impact white. To bake text in instead,
pass `{ tag, lead, sub }` (no `blank`) to `lowerThird()` and re-render.

## Regenerate / customize

The brand language lives in `scripts/story-assets/_brand-v2.mjs` (one source of truth
for the wordmark, play icon, streak grid, and end card). Fonts are embedded (offline).

Edit the `E` block in `render-reel-overlays.mjs` (event title, kicker, meta, day
counter, handle) — it drives **every** intro/outro/overlay at once — then run:

```
node scripts/story-assets/render-reel-overlays.mjs   # this kit
node scripts/story-assets/render-outro-v2.mjs        # ../outro/  (end cards + lockups)
node scripts/story-assets/render-brand-v2.mjs        # ../  (site marks: og, header, favicon)
```
