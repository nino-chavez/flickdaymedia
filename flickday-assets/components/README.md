# Flickday Media — Component Library

Every brand element as an **individual, transparent, flat asset** — combine them
however you want in Figma / Photoshop / Illustrator. Nothing here is pre-composed;
these are the atoms. (Assembled versions live in the parent `flickday-assets/`.)

## Formats

- **`.svg`** — icons + graphic elements. Vector: scale and recolor freely.
- **`.png`** — everything (icons, elements, type), transparent, rendered at 2×.

Type atoms are PNG only (real letterforms baked in).

## Colorways

| Suffix | Mark color | Use on |
|---|---|---|
| `-on-dark` | light (yellow / white / warm) | dark backgrounds + dark garments |
| `-on-light` | dark (ink + orange/ember accents) | white / heather backgrounds + light garments |

Graphic elements (`element-*`) are single-color and work on either when recolored.
Brand yellow is near-invisible on white, so `-on-light` swaps yellow → orange/ink.

## Contents

**Lockups** (`lockup-*`) — clean, pre-assembled, ready to drop in (no board chrome):
- `lockup-primary` — wordmark · MEDIA (rule) · tagline, stacked + centered
- `lockup-horizontal` — wordmark | MEDIA / tagline (header style)
- `lockup-stacked` — wordmark over MEDIA (compact)
- `lockup-wordmark-media` — wordmark + MEDIA inline (no tagline)
- `lockup-twotone` — two-tone wordmark (accent 'd' + circle play) · accent rule · accent MEDIA
- `lockup-reel` — film-reel wordmark · rule + MEDIA in `text` color (cinema variant)

**Icons** (`icon-*`):
- `play` — **the brand icon.** The traced play mark (locked). Pairs with the wordmark's play-in-the-'d'. SVG + PNG, both colorways.
- the rest are alternates / graphic options:
- `strobe-play` — play triangle + motion echoes (reels + the flick)
- `flipbook` — stacked frames + play (stills → motion)
- `streak-grid` — rising daily-cadence grid
- `frame-play` — play inside a photo frame
- `flick-comet` — the kinetic gesture, abstracted
- `strobe-chevron` — speed »»
- `play-triangle` — the bare play shape

**Type** (`type-*`):
- `wordmark` — the **flickday** logotype (play in the 'd'), traced vector
- `wordmark-twotone` — variant: letters in `text`, the **d** in the accent + a circle play (the d pops)
- `wordmark-reel` — variant: all-accent wordmark with a **film reel** in the 'd' (cinema / "flick")
- `media` · `slogan` (Every Day's a Flickday) · `handle` (@flickday.media) · `url`
- `cta` (See the full set →) · `shot-by` (Shot by Flickday Media)

**Elements** (`element-*`):
- `kick-streak` — the motion bars
- `accent-bar` — yellow→orange gradient bar (caption framing)
- `rule` — yellow→orange divider bar (lockup separator)
- `chip` — empty rounded lozenge (drop any glyph inside)
- `tile` — dark rounded-square container (drop a glyph/icon on top)
- `disc` — dark circle container (avatars)
- `streak-strip` — daily-cadence heatmap row (texture)

**Not shipped as atoms** — variable text you type per use: datelines (`Vol. I · No. 365`,
city), the day counter (`Day 247 / 365`), event headlines, lower-third names/subs.

## Regenerate

```
node scripts/story-assets/render-components.mjs
```

Geometry + colors live in the script (and shared atoms in `_brand-v2.mjs`).
Offline-safe — fonts are embedded.
