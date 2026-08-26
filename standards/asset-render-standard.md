# Asset render standard — Flickday Media

Read before rendering any wordmark, graphic or text asset here. Sets the model tier and the gates
that run at every tier. Machinery: `~/.claude/hooks/render-dispatch-guard.py` and the tier agents at
`~/.claude/agents/render-{mechanical,standard,judged}.md`.

## Render work is dispatched, not done inline

**Rule R-0.** Name the tier, then dispatch. The main loop cannot change model mid-session.

**Check.** Mechanical for `render-kit` invocations. This repo has no render scripts of its own today
— the 40-file render pipeline was deleted on 2026-07-05 — so `render-kit` is the expected path and
hook coverage is complete. If a bespoke renderer returns, add a scope caveat here.

## Tiers

**Rule R-1.** Route on who or what catches a wrong answer.

| Who catches it | Tier | Model |
|---|---|---|
| A gate — a build that fails, a diff against a committed asset in `assets/` or `flickday-assets/` | Mechanical | `haiku` |
| A gate exists, but the work is real editing — payload edits, template geometry | Standard | `sonnet` |
| A person judges it on appearance; any new mark, wordmark or public graphic | Judged | `opus` |

**Rule R-2.** Highest matching tier wins. A wordmark is always Judged — it is identity, and no test
proves identity correct.

## Gates — every tier, no exceptions

0. **Rendering is not publishing.** Anything public-facing gets a human look first.
1. **Ground truth is the live site, not a generated doc.** [`BRAND-PRIORS.md`](../BRAND-PRIORS.md)
   states this explicitly and records why: the deleted `DESIGN.md` claimed Inter body and an
   Event-Orange accent, and the actual site uses neither. **Check:** harvest computed styles from
   `index.html` — or the live domain — before choosing palette or type. Citing a generated artifact
   instead is the documented failure mode, not a shortcut.
2. **Priors are inputs, not locked executions.** `BRAND-PRIORS.md` is deliberately not a spec. Do not
   treat it as a component library, and do not regenerate a fossilized brand kit from it — that is
   what was deleted for drifting.
3. **The name and tagline are exact.** Flickday Media, "Every Day's a Flickday". **Check:** string
   match, not paraphrase.
4. **Reuse before generating.** `assets/` and `flickday-assets/` hold real marks. **Check:** look
   there before producing a new one.

## Escalation

**Rule R-3.** Stop and re-dispatch at Judged if the task turns out to involve a mark, a wordmark, the
tagline, or any surface a prospective client sees.

## What would change this standard

- A committed, harvested style token file taken from the live site would make gate 1 mechanical.
- A returning bespoke render pipeline would need the R-0 scope caveat this repo currently does not.
