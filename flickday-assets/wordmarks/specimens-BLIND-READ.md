# Blind read — wordmark specimens, 2026-07-22

Recorded before opening `specimens-KEY.json`. Claude's read only; the decision is Nino's
through the forge-brand ledger.

## What REF actually is

Heavy geometric lowercase, tight fit, round bowls, a flat-topped `f` with a short hook,
a tight `ck` pair, and a straight-tailed `y`. It holds solid at 11px and at chest-tag
scale. Whatever replaces it has to survive being small more than it has to look good big.

## Closest to REF, and heavy enough to survive

- **S-06** — nearest overall. Same tight geometric fit, comparable bowl roundness and
  weight. Holds at watermark and chest-tag without filling in.
- **S-08** — very close behind. Slightly softer corners, same density.
- **S-10** — heaviest and widest. More display presence than REF, strongest at 11px,
  but the extra width changes the mark's silhouette in a header.

## Divergent but credible

- **S-04** — much softer, rounded terminals, near-bubbly. A real choice if the brand
  wants warmth over edge, but it reads younger than the current mark.
- **S-02** — same softer direction, less extreme.

## Weakest

- **S-03**, **S-05**, **S-09** — all lose too much weight small. S-09 is also the least
  geometric of the set, so it gives up the one trait REF is built on.

## Caveat

Judged from a downscaled sheet. Fine for ranking silhouette, weight and small-size
survival; not fine for spacing or curve quality. Narrow to two or three, then set those
at real size before deciding.

---

## Addendum, same day — the ranking above is anchored to one incumbent, and there are three

Nino spotted that the play-icon wordmark and the reel-icon wordmark are set in different
type. Checked by fingerprinting the glyph outlines in every shipped asset, and it is
worse than two:

| System | Assets | Provenance |
|---|---|---|
| A | `modular-wordmarks/` core, play-d, shutter-i | set from a font, then outlined — all three share byte-identical glyphs |
| B | `wordmark.svg`, `wordmarks/wordmark-play.svg` | potrace trace, identical to each other |
| C | `wordmark-reel.svg` | potrace trace, lighter and wider than B |
| D | `wordmark-twotone.svg` | potrace trace, different again |

See `existing-type-drift.png`. A and B are far apart: A is heavy and tight, B is
noticeably lighter and narrower with a different `a` and `y`. These are not one face at
two sizes.

Every one of them is outlined, so none carries a font identity and none can be
regenerated or extended. That is the whole case for deciding this gate.

**What this does to the ranking above.** It was made against system A only, because A was
the reference row on the first sheet. S-06 / S-08 / S-10 are the ones closest to *A* —
the heavy, tight incumbent. Against B, the lighter and narrower one, a different set
would rank closest. The sheet now carries both as REF-A and REF-B, normalised to the same
colour so weight comparisons are fair.

**The second read is not blind.** The key was opened before the drift was found, so no
re-ranking from here can claim what the first one did. The ranking above stands as the
blind result; treat anything after it as informed opinion.

**The prior question.** "Closest to the incumbent" is not a well-formed goal while there
are three incumbents. Either pick which one the brand is continuing — or drop the
matching criterion entirely and choose the typeface on its own merits, which is what a
from-scratch redesign implies anyway.
