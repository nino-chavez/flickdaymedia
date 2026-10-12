# Local asset ledger

| Asset | Source | Use | Notes |
|---|---|---|---|
| `brand/flickday-wordmark-color.png` | `scripts/build-sting-wordmark.mjs` (repo root) | dark-footage wordmark (default) | Peridot PE 950; warm white `#F7F4ED`; 1600 px PNG |
| `brand/flickday-wordmark-white.png` | same | high-contrast wordmark | Peridot PE 950; white; 1600 px PNG |
| `brand/flickday-wordmark-black.png` | same | light-footage wordmark | Peridot PE 950; near black `#111318`; 1600 px PNG |
| `proof-footage.jpg` | `flickdaymedia/site/images/gallery/portfolio-49.jpg` | proof composites only | local sports photo; not embedded in alpha exports |
| `vendor/gsap.min.js` | npm `gsap@3.14.2` | deterministic local animation runtime | copied locally so renders do not depend on a CDN |
| `fonts/montserrat-900.woff2` | HyperFrames deterministic font cache | display copy | bundled locally for offline renders |
| `fonts/inter-800.woff2` | HyperFrames deterministic font cache | compact metadata | bundled locally for offline renders |

The wordmark ships as PNG, not SVG: Peridot is licensed for live text, not for embedded outlines (BRAND-PRIORS.md). The earlier core SVGs were a different typeface and are removed.

No web search, generation provider, or remote runtime asset is required for this pilot.
