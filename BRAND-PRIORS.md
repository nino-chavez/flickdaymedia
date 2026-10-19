# Flickday Media — Brand Priors

The irreducible inputs for designing wordmarks, graphics, and text assets **from scratch**.
This is not a spec of locked executions — it is the set of true things a designer needs
before making anything. Everything else (the old `brand-forge` kit, `_brand-v2.mjs`, the
40-file render pipeline, the traced marks) was deleted on 2026-07-05 because it had
fossilized a 2026-03 brand-kit into a god-module that drifted from the live site. Traced
marks came back for exploration on 2026-08-24 (17acce2); they are retired again, and the
play-in-the-d construction is ruled out (2026-10-12).

**Ground truth is the live site (`index.html`), not any generated doc.** When priors and a
generated artifact disagree, the site wins. (The old `DESIGN.md` claimed an Event-Orange
accent the site never used. Its Inter body claim became true on 2026-07-06, and this line
kept calling it false until 2026-10-12: verify before trusting, including this file.)

---

## What the brand is

- **Name:** Flickday Media  ·  **Domain:** flickdaymedia.com
- **Tagline:** "Every Day's a Flickday"
- **Mission:** Grassroots sports media — raw, fast, player-first.
- **Positioning:** Chicago-based action-sports media for the grassroots volleyball community
  (tournament coverage; also broader action sports).
- **Audience:** volleyball players, tournament organizers, sports parents, the grassroots
  sports community.
- **Personality:** authentic, energetic, bold, player-focused, grassroots — courtside, not
  corporate.

## Palette (from the live site `:root`)

Dark theme. Yellow on black is the whole identity.

| Token | Hex | Use |
|---|---|---|
| Black | `#000000` | background / base |
| White | `#ffffff` | primary text on dark |
| **Flickday Yellow** | `#facc15` | the brand color — accent, CTAs, the mark |
| Yellow-bright | `#fde047` | hover / lighter highlight |
| Gray-dark | `#111111` | raised surfaces |
| Gray-mid | `#333333` | borders / dividers |
| Gray-light | `#888888` | muted text |

Optional accent seen in some prior video/print assets (NOT a live-site token — use only with
intent): Event Orange `#f97316`, ember `#ea580c`.

## Type

- **Site display face:** Anton (`--font-display`) — used for the hero and headlines,
  uppercase. (This line previously said Bebas Neue; `index.html` loads Anton and has
  no Bebas. Verified 2026-07-27.)
- **Site body:** Inter (`--font-body`, falling back to `system-ui`). The site does load
  it — the old correction over-corrected.
- **Site tag face:** Barlow Condensed 700 (`--font-tag`), for tags and utility labels.
- **Overline / label / mono:** JetBrains Mono was used across prior assets for handles,
  MEDIA lockups, CTAs — a reasonable convention, not mandatory.
- **Wordmark type is LOCKED: Peridot PE 950, lowercase** (2026-07-27). This prior is
  closed. Standard cut down to 24 px on screen, micro cut below; the deployed-site
  generator keeps its spacing and kerning in `scripts/wordmark-lib.mjs → PERIDOT_CUTS`.
  The canonical revision source is `brands/flickday/web-identity/v001` in the private
  `brand-assets` library. The all-caps Bebas
  wordmark was tried and rejected. The logo
  deliberately differs from the site's headline face.

## Signature ideas (motifs to draw from — not required in every asset)

- **Play button** — the media/"press play" mark, its own symbol, never inside the wordmark:
  no play mark in the `d` (nino, 2026-10-12). Whether it sits beside the wordmark as a
  lockup is still open.
- **Film reel** — cinema/"flick" variant of the same symbol, under the same rule.
- **Daily cadence** — "every day's a flickday": a contribution-graph / streak-heatmap texture,
  and a day-counter (e.g. "Day N / 365").
- **Sports scoreboard** — an LED-grid "FD" that reads as both a scoreboard and the initials.
- **Mascot** — "Almost Flickday," a cartoon caricature of Nino (the photographer). Source
  line-art is in `brands/flickday/identity/v001/source/` in the private `brand-assets`
  library; full renders live in Drive.

## Production constraints (so from-scratch assets stay usable)

- **DTF garment print:** transparent background, FLAT solid colors only (no glows/soft shadows
  — they print as muddy underbase), garment-aware pairs (`-dark` for dark garments = yellow/white
  ink; `-light` for light garments = dark ink), sized for ~300 DPI chest/back prints.
- **Reels / Stories overlays:** 1080×1920, transparent where they composite over video.
  Safe areas are recorded in `brands/flickday/overlay-kit/v001/records/` in the private
  `brand-assets` library, the only numbers validated against real posts.
- **Social handle bug:** small pill/badge with the play mark + `@flickday.media`.
- **OG / share card:** **1200×630** — the size `index.html` declares. (This line said
  1200×675; nothing shipped at that size. Verified 2026-07-27.)
- **Favicon set:** 16/32, apple-touch 180, android 192/512, `site.webmanifest`.
- **Font loading:** the wordmark is Peridot PE, served live from the Adobe Fonts kit, so
  the render environment **does** need network. Base64-embedding is still right for
  Google-hosted faces that a script can fetch once (`wordmark-lib.mjs → prepareFaces`),
  but the blanket "embed everything, never load remotely" rule predates the Peridot lock
  and no longer holds. Never `@import` inside CSS — it hangs the load; use `<link>`.
- **Wordmark assets ship as PNG, not SVG.** Peridot is licensed for live text; an SVG
  would have to embed its outlines. Rasters sidestep that entirely. The traced
  pre-Peridot SVGs were deleted on 2026-10-12; the retained mascot line-art lives in
  `brands/flickday/identity/v001/source/` in the private `brand-assets` library.

## Working principles (lessons from the old system)

- **Judge design quality directly** from these priors — don't treat a prior script's output as
  the spec to match.
- **No god-module.** Whatever regenerates assets should be legible and per-asset, not one
  frozen kit re-stamping 40 files on every tweak.
- **Live site is canonical.** New marks are validated against `index.html`, not against docs.

## Rulings since the wordmark lock

Newest first. Each names the file that carries it; the values live there, not here.

- **2026-10-12 — the motion sting carries the share card's lockup** (wordmark, MEDIA, tagline).
  `brands/flickday/wordmark-motion/v001` in the private `brand-assets` library.
- **2026-10-12 — share card:** the Peridot wordmark, "MEDIA" as a word under it (no rule lines),
  the tagline as the headline, then "Volleyball photos & reels · Chicago".
  `scripts/build-site-wordmark.mjs`.
- **2026-10-12 — home hero:** the tagline is the headline, "Every Day's a Flickday.", led only by
  an eyebrow that says what Flickday is. `site/index.html`; the copy rules are in the experience
  brief in nino-chavez/public-site-rethink.
- **2026-10-12 — over footage:** the yellow mark carries a flat 6 px dark offset shadow, never a
  glow, and white text also carries a flat dark outline. The decision record is
  `brands/flickday/wordmark-motion/v001/records/flickday-wordmark-motion-v001-shot-plan.json`
  in the private `brand-assets` library.

- **2026-10-12 — no play mark in the `d`.** The symbol and any symbol-beside-wordmark lockup are
  open.

## Brand source materialization

The website keeps deployed copies and its favicon/share-card generators only. Reopen motion or
overlay sources from the private library, never by recreating the retired folders here:

```bash
cd ~/Workspace/dev/tools/brand-assets
python3 bin/assets.py materialize flickday-wordmark-motion out/flickday-wordmark-motion
python3 bin/assets.py materialize flickday-overlay-kit out/flickday-overlay-kit
```
