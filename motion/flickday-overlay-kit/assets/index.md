# Local asset ledger

| Asset | Source | Use | Notes |
|---|---|---|---|
| `brand/flickday-core-color.svg` | `flickdaymedia/flickday-assets/brand/modular-wordmarks/` | dark-footage wordmark | outlined vector; warm white |
| `brand/flickday-core-white.svg` | same | high-contrast wordmark | outlined vector; white |
| `brand/flickday-core-black.svg` | same | light-footage wordmark | outlined vector; near-black |
| `proof-footage.jpg` | `flickdaymedia/images/gallery/portfolio-49.jpg` | proof composites only | local sports photo; not embedded in alpha exports |
| `vendor/gsap.min.js` | npm `gsap@3.14.2` | deterministic local animation runtime | copied locally so renders do not depend on a CDN |
| `fonts/montserrat-900.woff2` | HyperFrames deterministic font cache | display copy | bundled locally for offline renders |
| `fonts/inter-800.woff2` | HyperFrames deterministic font cache | compact metadata | bundled locally for offline renders |

No web search, generation provider, or remote runtime asset is required for this pilot.
