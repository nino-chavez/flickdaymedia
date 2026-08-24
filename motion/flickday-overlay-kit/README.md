# Flickday overlay kit — HyperFrames pilot

Three deterministic 1080×1920 transparent motion assets for CapCut and other editors. The kit uses the unchanged Flickday core wordmark plus one repeatable editorial device: a narrow yellow selection seam.

## Compositions

| Asset | Source | Duration | Editable fields |
|---|---|---:|---|
| Wordmark sting | `compositions/wordmark-sting.html` | 3.2s | wordmark asset, accent color |
| Player lower third | `compositions/player-lower-third.html` | 4.5s | player name, player detail, accent, text color |
| Highlight reaction stamp | `compositions/highlight-reaction-stamp.html` | 2.2s | stamp text, accent, text color |

The root `index.html` mirrors the wordmark sting so the default Studio preview opens on a useful composition.

## Design rules

- Keep the lowercase wordmark intact.
- Use the yellow seam as timing and framing, not as a replacement logo.
- Keep overlays rectangular, compact, and legible over live footage.
- Do not add the rejected cut-`f`, reels, filmstrips, camera-icon stacks, glow, bounce, emojis, or trend slang.
- Copy guidance lives in `COPY-REVIEW.md`.

## Preview and verify

```bash
npm install
npm run lint
npm run dev
```

HyperFrames Studio opens the project. Each composition under `compositions/` is independently renderable. Local SVGs, fonts, and GSAP are bundled, so the compositions do not require remote assets.

## CapCut exports

After visual approval, render transparent ProRes 4444 MOV files:

```bash
npm run render:wordmark
npm run render:lower-third
npm run render:stamp
```

For a customized lower third:

```bash
npx --yes hyperframes@0.7.64 render . \
  --composition compositions/player-lower-third.html \
  --format mov --quality high \
  --variables '{"playerName":"PLAYER NAME","playerDetail":"12 · OUTSIDE"}' \
  --output renders/player-name-lower-third.mov
```

Import the MOV as an overlay in CapCut. If an editor mishandles MOV alpha, render `--format png-sequence` and import the RGBA sequence instead. WebM alpha is a browser delivery option, not the preferred CapCut master.

## QA status

- Project-wide lint: 0 errors, 0 warnings.
- Wordmark sting browser/runtime/layout/motion check: passed at 0.00, 0.24, 0.56, 2.50, and 2.96 seconds.
- Player lower-third isolated check: passed at 0.00, 0.22, 0.70, 2.76, and 4.08 seconds.
- Highlight stamp isolated check: passed at 0.00, 0.12, 0.52, 1.40, and 1.86 seconds.
- Final MOV rendering is intentionally approval-gated.
