# Flickday Media — Brand Priors

The irreducible inputs for designing wordmarks, graphics, and text assets **from scratch**.
This is not a spec of locked executions — it is the set of true things a designer needs
before making anything. Everything else (the old `brand-forge` kit, `_brand-v2.mjs`, the
40-file render pipeline, the traced marks) was deleted on 2026-07-05 because it had
fossilized a 2026-03 brand-kit into a god-module that drifted from the live site.

**Ground truth is the live site (`index.html`), not any generated doc.** When priors and a
generated artifact disagree, the site wins. (The old `DESIGN.md` claimed Inter body + an
Event-Orange accent; the actual site uses neither. Verify before trusting.)

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

- **Site display face:** Bebas Neue (tall, condensed, ALL-CAPS) — used for the hero and
  headlines. `letter-spacing: ~0.02em`, `text-transform: uppercase`.
- **Site body:** `system-ui` (the old kit claimed Inter; the site does not load it).
- **Overline / label / mono:** JetBrains Mono was used across prior assets for handles,
  MEDIA lockups, CTAs — a reasonable convention, not mandatory.
- **Wordmark type is OPEN and being redesigned.** Owner preference (2026-07-05): the
  **lowercase** logotype design works better than the Bebas all-caps wordmark — a Bebas-caps
  wordmark swap was tried and rejected. The lowercase mark's specific typeface is unidentified
  (a heavy rounded geometric sans, play/reel nested in the `d`); identify or choose one
  deliberately if rebuilding it. The logo is allowed to differ from the site's headline face.

## Signature ideas (motifs to draw from — not required in every asset)

- **Play button** — the media/"press play" mark. Was nested in the wordmark's `d`.
- **Film reel** — cinema/"flick" variant of the same slot.
- **Daily cadence** — "every day's a flickday": a contribution-graph / streak-heatmap texture,
  and a day-counter (e.g. "Day N / 365").
- **Sports scoreboard** — an LED-grid "FD" that reads as both a scoreboard and the initials.
- **Mascot** — "Almost Flickday," a cartoon caricature of Nino (the photographer). Source
  line-art kept at `flickday-assets/brand/face-lineart*.{svg,png}`; full renders live in Drive.

## Production constraints (so from-scratch assets stay usable)

- **DTF garment print:** transparent background, FLAT solid colors only (no glows/soft shadows
  — they print as muddy underbase), garment-aware pairs (`-dark` for dark garments = yellow/white
  ink; `-light` for light garments = dark ink), sized for ~300 DPI chest/back prints.
- **Reels / Stories overlays:** 1080×1920, transparent where they composite over video.
- **Social handle bug:** small pill/badge with the play mark + `@flickday.media`.
- **OG / share card:** 1200×675.
- **Favicon set:** 16/32, apple-touch 180, android 192/512, `.ico`, `site.webmanifest`.
- **Offline rendering:** the render environment has no network — fonts must be embedded
  (base64 woff2), never `@import`ed from Google Fonts (it hangs the load).

## Working principles (lessons from the old system)

- **Judge design quality directly** from these priors — don't treat a prior script's output as
  the spec to match.
- **No god-module.** Whatever regenerates assets should be legible and per-asset, not one
  frozen kit re-stamping 40 files on every tweak.
- **Live site is canonical.** New marks are validated against `index.html`, not against docs.
