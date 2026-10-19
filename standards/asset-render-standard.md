# Asset render standard — Flickday Media

Read before rendering any wordmark, graphic or text asset here. Sets the model tier and the gates
that run at every tier. Machinery: `~/.claude/hooks/render-dispatch-guard.py` and the tier agents at
`~/.claude/agents/render-{mechanical,standard,judged}.md`.

## Render work is dispatched, not done inline

**Rule R-0.** Name the tier, then dispatch. The main loop cannot change model mid-session.

**Check.** Mechanical for `render-kit` invocations only. This repository retains two focused
deployed-site generators:
- `scripts/build-site-wordmark.mjs`: the header and footer wordmark PNGs and the share card
  (`--card` for the card alone, `--out <path>` to try a variant without touching the committed card);
- `scripts/build-site-assets.mjs`: the favicons.

Motion, social-kit, and historical generator sources are canonical in the private `brand-assets`
library: `brands/flickday/{web-identity,wordmark-motion,overlay-kit}/v001`. Materialize a native
project under that library's ignored `out/` directory with `python3 bin/assets.py materialize
<source-id> <new-directory>`; do not recreate its retired source folder here.

**Scope caveat (2026-10-12):** the dispatch hook does
not see them. It matches `render-kit` commands only, so R-0 holds for these scripts by discipline,
not mechanically. When the native-routing gate refuses a Judged-tier agent, run the work in a
session that is already on the Judged model and say so. Do not route it to a cheaper general agent.

## Tiers

**Rule R-1.** Route on who or what catches a wrong answer.

| Who catches it | Tier | Model |
|---|---|---|
| A gate — a build that fails, a diff against a committed asset in `site/` or a library materialization | Mechanical | `haiku` |
| A gate exists, but the work is real editing — payload edits, template geometry | Standard | `sonnet` |
| A person judges it on appearance; any new mark, wordmark or public graphic | Judged | `opus` |

**Rule R-2.** Highest matching tier wins. A wordmark is always Judged — it is identity, and no test
proves identity correct.

## Gates — every tier, no exceptions

0. **Rendering is not publishing.** Anything public-facing gets a human look first.
1. **Ground truth is the live site, not a generated doc.** [`BRAND-PRIORS.md`](../BRAND-PRIORS.md)
   states this explicitly and records why: the deleted `DESIGN.md` claimed an Event-Orange accent
   the site never used. This gate also said the site did not use Inter for two months after the
   site adopted it (2026-07-06): a fact about the site goes stale, so harvest it fresh, never
   quote it from a doc, this one included. **Check:** harvest computed styles from
   `index.html` — or the live domain — before choosing palette or type. Citing a generated artifact
   instead is the documented failure mode, not a shortcut.
2. **Priors are inputs, not locked executions.** `BRAND-PRIORS.md` is deliberately not a spec. Do not
   treat it as a component library, and do not regenerate a fossilized brand kit from it — that is
   what was deleted for drifting.
3. **The name and tagline are exact.** Flickday Media, "Every Day's a Flickday" (the home headline
   and the share card end it with a period; that is punctuation, not a new tagline). **Check:**
   string match, not paraphrase. When a request drops, moves or restyles part of the name or the
   tagline, say how you read it in the preview caption before rendering: "drop the MEDIA rule"
   was read as dropping the word too, and the card lost half the name (2026-10-12).
4. **Reuse before generating.** The current mark sources are named by the private library's
   `brands/flickday/current.json`; this repo retains only the site copies and their two generators.
   **Check:** reuse the current collection exports before producing a new one. The retired
   exploration (traced SVGs, `wordmarks/wordmark-play*`, `concepts/`, the study scripts) was
   deleted on 2026-10-12; if you dig it out of git history, do not reuse it as a mark.
5. **Overlays are judged where they will be seen.** **Check:** before asking anyone to approve an
   asset that composites over footage, look at it over a light frame, a dark frame, and at phone
   scale (about 0.36x of a 1080-wide export). On 2026-10-12 both legibility misses, the yellow
   mark over white sky and the white tagline over a light frame, were invisible over the dark
   proof frame.

## Escalation

**Rule R-3.** Stop and re-dispatch at Judged if the task turns out to involve a mark, a wordmark, the
tagline, or any surface a prospective client sees.

## What would change this standard

- A committed, harvested style token file taken from the live site would make gate 1 mechanical.
- A returning bespoke render pipeline would need the R-0 scope caveat this repo currently does not.
