# Flickday wordmark — production master

The locked logotype for Flickday Media. This is the reproducible spec, not a
frozen outline: the mark is live text in a licensed variable font, so it
regenerates from these values anywhere it's used.

**Status:** locked 2026-07-27 (decision ledger `presets/flickday.json` →
`decisions.ledger`, gate `wordmark` → approved, candidate `W-PERIDOT`).

---

## Face

- **Typeface:** Peridot PE, weight **950** (variable weight axis, pinned).
- **Source:** Adobe Fonts (Typekit) kit `fju5pyz`, family `peridot-pe-variable`.
  Web use is covered by the Adobe Fonts web license via the kit — the mark ships
  as **live text**, never as redistributed outlines.
- **Case:** lowercase only. The all-caps Bebas-class wordmark was tried and
  rejected (ledger `no-bebas-caps-wordmark`).
- **Always set `font-optical-sizing: none`** so the optical axis matches this
  spec; the browser default (`auto`) silently re-derives `opsz` from font-size
  and shifts the shapes.

### Why Peridot

Chosen over Config, Schibsted, Roc, Latino, Next Exit, Bananas, IvyEpic. The
deciding filter was the **l-foot rule** (ledger `no-curled-l-foot`): a lowercase
`l` whose foot curls toward the `i` makes "fli" read as a fragmented "u".
Peridot's `l` is a straight, flat-cut stem, so "flick" stays clean. It is a
heavy geometric display face — courtside, not corporate — and its weakest
application (the 15px watermark) still holds.

---

## Kerning — by hand, by eye

Per-gap em offsets on the letters of "flickday". Gaps are
`[f|l, l|i, i|c, c|k, k|d, d|a, a|y]`; negative closes a pair, positive opens it.
Tuned against the render, never computed (algorithmic white-area kerning was
rejected — it drove `kd` to twice the `ck` move).

| Cut | Use | `k|d` | `c|k` | Tracking |
|---|---|---|---|---|
| **standard** | ≥ 24px — header, apparel, share cards, large overlays | −0.03 | +0.01 | 0 |
| **micro** | < 24px — watermark, favicon, handle bug | −0.02 | +0.008 | +0.045em |

The micro cut relaxes the tight `k|d` close and opens overall tracking so the
heavy forms don't fill in at small size.

**Single source of truth:** `scripts/wordmark-lib.mjs → PERIDOT_CUTS`. The live
site, the master render, and this table all read from it. Change it there.

---

## Lockups

- **Primary — `flickday`:** the wordmark alone. Default everywhere.
- **Full — `flickday media`:** wordmark + `media` in JetBrains Mono 600,
  uppercase, letter-spacing ≈ 0.47em, ≈ 0.34× the wordmark size, left-aligned
  under the mark. Use where the full company name is needed (footers, legal,
  first-use on a page).

## Colorways (flat solids only — DTF/print-safe, no glows)

| Colorway | Mark | Ground | Use |
|---|---|---|---|
| Primary | Flickday yellow `#facc15` | black | the default, site + most assets |
| Reversed | black | yellow | yellow fields, stickers |
| One-colour dark | white | black/dark | dark garments, single-ink print |
| One-colour light | ink `#111318` | light | light garments, paper |

## Clearspace & minimum size

- **Clearspace:** 0.62× cap height on all four sides (cap height = ascender top
  to baseline). Nothing intrudes.
- **Minimum:** 88px wide on screen / 18mm in print. Below that, use the **micro
  cut**. Never place the mark over busy image detail without the watermark
  scrim.

---

## Where it's wired

- **Live site** (`index.html`): header logo is live Peridot text via
  `--font-wordmark` and the kit `<link>`; standard cut, kerning inline on the
  `.site-header__logo` spans. The old `flickday-assets/site/header-logo.svg` is
  superseded (kept as archive, no longer referenced).
- **Supporting type is unchanged and separate:** Anton (display/headlines),
  Inter (body), JetBrains Mono (labels/handles), Barlow Condensed (tags). The
  wordmark is deliberately its own face. Pairing audit:
  `flickday-assets/wordmarks/pairing-audit.png` — no clashes; the one guardrail
  is keep Barlow Condensed at tag/utility size, never at wordmark scale directly
  beside the mark.

## Regenerate

```
node scripts/wordmark-production.mjs   # → wordmark-master.png (this spec, rendered)
node scripts/wordmark-peridot-mocks.mjs # → site + asset mocks
node scripts/wordmark-pairing-audit.mjs # → font-pairing audit
```

All three read the roster and spacing from `scripts/wordmark-lib.mjs`.
