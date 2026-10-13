# Flickday social kit — bugs, badges, overlays

The locked Peridot wordmark as the assets that actually go out: corner
watermarks, handle badges, the avatar, transparent overlay frames for
reels/stories/feed, and the share card.

Regenerate any group on its own — nothing here re-stamps the whole set:

```
node scripts/social-kit.mjs                # everything
node scripts/social-kit.mjs overlay        # just the reel/feed frames
node scripts/social-kit.mjs bug handle og
```

Groups: `bug` `handle` `avatar` `overlay` `og` `proof`. `proof` reads the PNGs the
others write, so run it last (a bare run already orders them).

---

## Format: PNG, always

Every asset here is a raster. The wordmark is **live Peridot text rendered to
pixels** — glyph outlines are never extracted, so the Adobe Fonts licence
question never comes up. This is why `flickday-assets/brand/` holds SVGs and this
folder does not: those marks predate the Peridot lock and aren't Peridot.

The one vector in play is the play chip, whose geometry is hand-drawn in
`../wordmarks/symbol-play.svg`. The script reads its path from that file so the
two can't drift.

## Which optical cut, and why the numbers look wrong

`BRAND-PRIORS.md` sets the standard/micro crossover at **24px** — an *on-screen*
number. A phone renders a 1080-wide export at roughly 390 CSS px, so a mark shows
at about **0.36×** its canvas size, putting the crossover at **~66px of canvas**.

That is the trap: a 46px bug on a 1080 feed post *looks* comfortably large in the
file and lands at ~17px on the phone. Everything in this kit except the avatar is
therefore on the **micro** cut, and the script prints which cut each asset got.

The avatar is the exception in the other direction — 1024px of canvas displayed at
~40px in a feed. `cutFor()` is calibrated for a 1080 post and would pick standard,
so the avatar overrides it to micro explicitly.

## Safe areas

Harvested from this project's own validated 1080×1920 motion compositions
(`motion/flickday-overlay-kit/compositions/*.html`), not from recalled platform
numbers: the highlight stamp sits at top 300, the lower third's box ends 270 off
the bottom, left margin 84.

| Format | Left | Right | Top | Bottom |
|---|---:|---:|---:|---:|
| Reel / story 1080×1920 | 84 | 180 | 300 | 270 |
| Feed 1080×1350, 1080×1080 | 60 | 60 | 60 | 60 |

The reel's right inset is widened to 180 for the like/comment/share rail — which
is also why the reel puts its bug **top-left** and its handle **bottom-left**,
while feed posts (no platform chrome over the image) put the bug bottom-right
where a watermark is conventionally read.

The yellow seam beside the reel's handle is the motion kit's recurring editorial
device, carried over so the stills and the overlays read as one system.

## Shadow: video only

Overlay frames composite over footage nobody art-directed — a white mark can land
on a white jersey. They carry a tight `drop-shadow` scaled to canvas width.

The bugs, badges, avatar and share card stay **flat**, per BRAND-PRIORS: soft
shadows print as a muddy underbase on DTF.

## The files

| File | Size | Notes |
|---|---|---|
| `bug-wordmark-{white,yellow,ink}` | 538×132 | wordmark alone, cropped to ink |
| `handle-pill-{dark,yellow}` | 1294×248 | filled pill, drops on any ground |
| `handle-flat-{white,yellow}` | 1117×120 | no pill, for burn-in over video |
| `avatar-{yellow-on-black,black-on-yellow}` | 1024² | mark spans 74% of the frame |
| `overlay-reel-1080x1920` | 1080×1920 | transparent; `-scrim` adds a bottom gradient |
| `overlay-portrait-1080x1350` | 1080×1350 | transparent |
| `overlay-square-1080x1080` | 1080×1080 | transparent |
| `proof-social-kit` | — | contact sheet, review only, not an asset |

Bugs and badges render at 3× their intended display size, so they downscale
without softening. They are cropped to **measured ink**, not to the element box:
`.mk` is exactly one em tall and Peridot 950's ascenders and descenders run past
it, which sliced the `y` tail and the top of the `d` on the first pass. Tight
crops also mean no baked-in transparent margin to guess at — the consumer sets
its own inset.

## Open

- **The share card is not in this kit.** `scripts/build-site-wordmark.mjs` builds it from
  the live page's words, at `site/flickday-assets/site/og-share-card.png`. This kit's
  `og` group and its card were removed on 2026-10-12: they redrew the retired layout.
- **The motion overlay kit's type is still its own.** Its wordmark sting ships Peridot
  PNGs since 2026-10-12, but the lower third and the reaction stamp set Montserrat and
  Inter, not the site's faces. Open design question, not a file swap.
