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
- **Icon — `play in the d` / `reel in the d` / `shutter in the i`:** the wordmark
  with one letter's negative space replaced by a symbol. **Large format only —
  120px minimum**, see below. Play is the primary; shutter is the
  photography-specific alternate; reel is the weakest on this face.

### The icon lockup

The symbol **replaces** the counter rather than sitting inside it. Sizing it to
fit the existing counter is the wrong instinct and produces a speck: the counter
is 33×49 in a 150×199 glyph, about 5% of its area. It is the thing being
replaced, not the budget.

Nothing here needs the glyph outlined, so it runs on **live text** like the rest
of the wordmark — no licence question. Where the letterform yields, it yields to
a CSS mask on live text, not to an extracted outline.

**Provenance.** The geometry is reconstructed from the approved proofs in
`flickday-assets/concepts/2026-07-modular-wordmark/final-candidates/`. Those
proofs are **image-generated rasters, not artwork** — the round-3 README is
explicit that they must not be traced or shipped, and that the approved cues get
rebuilt as clean vector geometry against the fixed typographic base. This is
that rebuild.

**The two cues use opposite polarity, and that is deliberate** — it is what the
proofs do, and swapping them is the single biggest way to get this wrong.

| | Play (`d`) | Reel (`d`) | Shutter (`i`) |
|---|---|---|---|
| Polarity | round **hole**, symbol is positive ink | solid bowl, symbol **cut out** | dot masked away, larger disc in its place |
| Radius | **0.165em** (hole) | **0.179em** (disc) | **0.138em** — 1.2× the dot's 0.115em |
| Centre | **0.308em** right, **0.892em** down from the `d`'s box origin | same | the `i` dot's own centre |
| Symbol | triangle, x −0.42r → +0.58r, y ±0.52r, corners rounded 0.12r | hub 0.17r; five lobes 0.33r on a 0.55r orbit, first at 12 o'clock | six blade edges, 55° twist, inner radius 0.30r, weight 0.10r |
| Gap | — | — | 0.16r of ground between disc and letter |
| Minimum size | **120px** | **120px** | **120px** |

The shutter's blades run from a point on the rim to a point on an inner circle
rotated 55° ahead of it. That twist is what makes them read as an iris; blades
drawn as wedges meeting at the centre give a starburst instead, which is what
round-1 produced. At 1.2× the dot the disc clears the `l`, matching the proof;
at 1.5× and above it bites into the `l`'s stem.

Corner rounding on the play triangle is applied by scaling the triangle about
its centroid and stroking it back out with a round linejoin, so all three
corners round uniformly instead of being shaped by hand.

Two derived bounds fix the radius. The disc must be at least half the counter's
**diagonal** (29.5 at 260px) or slivers of the old counter survive at its
corners. And it must stay far enough inside the glyph's silhouette to leave
≥1.2px of ink at the minimum size (46.4 at 260px). Both are computed at run time
from the rendered glyph, not stored.

**The 120px minimum is the real constraint.** The symbol dies long before the
letterforms do: at 40px and 64px it is not visible at all, while the plain
wordmark is still crisp at the 15px watermark. So the icon lockup is for hero,
apparel, share cards and large overlays — the 40px header, the watermark, and
the favicon all use the plain wordmark.

**Measured ceiling — how much symbol Peridot's `d` can actually hold.** Fitting
the largest equilateral play triangle that contains the counter, and requiring a
wall of ink around it: at 260px the triangle reaches **103×118** with an **8px**
wall, and at a 9px wall **no triangle fits at all**. Eight pixels is 3% of the
glyph height — a hairline at hero size, ~3.7px at the 120px minimum. So on this
face the trade is fixed: a bold symbol with a structurally thin `d`, or a
smaller symbol that keeps the letter solid. There is no setting that gives both.

The pre-Peridot marks in this folder (`wordmark-play.svg`, `wordmark-reel.svg`
and their PNGs, Jul 6) do not have this problem because **they are not Peridot** —
they are potrace traces of the image-generated letterforms, whose `d` has a
rounder, wider bowl. They look better and they are inconsistent with the locked
wordmark. That is a live decision, not a defect to fix in code.

**Known limitation — the reel is the weaker cue.** Peridot's bowl is narrower
than the rounder `d` the proof was generated with, so five lobes at this scale
merge into a star rather than reading as a film reel. Finer and chunkier lobe
sets were both tried and read worse. Prefer the play for the primary mark; the
round-1 review reached the same conclusion independently, calling the play "the
strongest primary video identity" and the reel "more literal and conventional."

Regenerate and re-judge the full study with
`node scripts/wordmark-symbol-study.mjs`; the numbers above are printed on every
run as a `SPEC —` line, measured off the rendered glyph rather than stored.

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
