# Flickday Media

Volleyball tournament photos and reels, out of Chicago. Galleries within 24–48 hours. We
shoot for the players, not the brochure.

**[flickdaymedia.com](https://flickdaymedia.com)**

## What this repo is

The site itself — a static build, no framework, no build step. `site/index.html` is the
whole page.

Cloudflare Pages publishes `site/` as-is and nothing else. `wrangler.toml` sets that. Any
file a visitor's browser loads goes in `site/`; everything else in the repo stays private
to the repo.

| Path | Holds |
|---|---|
| `site/` | The live site: `index.html`, `_redirects`, images, favicons, share card |
| `motion/filmroom-pick-proof/` | Unrelated Film Room proof project |
| `BRAND-PRIORS.md` | The inputs a designer needs before making anything |

## Brand artwork

The private shared library at `~/Workspace/dev/tools/brand-assets` owns Flickday artwork and
revision sources. Its current pointer names `identity`, `web-identity`, `wordmark-motion`, and
`overlay-kit` v001 under `brands/flickday/`; this repository keeps only the copies deployed from
`site/`.

To reopen a retained native source, materialize it into the library's ignored `out/` directory:

```bash
cd ~/Workspace/dev/tools/brand-assets
python3 bin/assets.py materialize flickday-wordmark-motion out/flickday-wordmark-motion
python3 bin/assets.py materialize flickday-overlay-kit out/flickday-overlay-kit
```

Use `flickday-web-assets` for the retained social assets or `flickday-web-generators` for their
historical generators. Do not restore those folders in this website repository.

## The site is the brand, not a doc about the brand

`BRAND-PRIORS.md` is deliberately not a spec of locked executions. It records the irreducible
true things — name, tagline, mission, audience, personality, palette — and stops there.

It says so in its own first lines, and it earned the right to: a 40-file render pipeline and a
generated brand kit were deleted in July 2026 because they had fossilized a March brand into a
god-module that drifted from the live site. The old `DESIGN.md` claimed an Event-Orange accent
the site never used. (It also claimed an Inter body font, which the site adopted on 2026-07-06;
this README said otherwise until 2026-10-12. A fact about the site goes stale, so read it from
`index.html`, not from here.)

So the rule is written down: **ground truth is `index.html`.** When a generated artifact and
the site disagree, the site wins.

## Identity

Yellow on black is the whole thing.

| | |
|---|---|
| `#facc15` | Yellow — the identity |
| `#fde047` | Yellow, bright |
| `#000000` | Black — the ground |
| Display | Anton |
| Body | Inter |
| Labels | JetBrains Mono |
| Tags | Barlow Condensed |

## Run it

```bash
git clone https://github.com/nino-chavez/flickdaymedia.git
cd flickdaymedia
python3 -m http.server 8000 -d site
```

Open `http://localhost:8000`.

## Shooting with us

Tournament organizers and players: nino@ninochavez.co.
