/**
 * Flickday Media — DTF heat-press print masters (v2).
 *
 *   node scripts/story-assets/render-dtf-v2.mjs
 *
 * Output: flickday-assets/dtf/   (transparent, FLAT, hard-edged, ~300 DPI)
 *
 * DTF rules these obey (the video/web marks don't):
 *   · transparent background — every non-transparent pixel prints (+ white underbase)
 *   · FLAT solid colors only — no glows, no soft shadows, no low-alpha ghosts
 *     (low-alpha feathers print as muddy/speckled underbase with a hard cutoff)
 *   · garment-aware contrast — a -dark master (for black/navy/charcoal) and a
 *     -light master (for white/heather); white letters can't print on white
 *   · print resolution — sized so a chest/back print stays crisp at 300 DPI
 *
 * The chronophoto fade becomes a SOLID stepped strobe (ember→orange→amber→front)
 * so the motion idea survives DTF. Single-color F masters are the cheapest transfer.
 */
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { mkdirSync, existsSync, rmSync } from 'node:fs'
import { FONTS, YELLOW, ORANGE, wordmark, playIcon, renderJobs } from './_brand-v2.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'dtf')
mkdirSync(outDir, { recursive: true })

const INK = '#16110f'

const doc = (body, w, h) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;background:transparent}
  body{display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif}
  </style></head><body>${body}</body></html>`

// flat lockup — traced wordmark + MEDIA + tagline, hard edges, no glow
function lockupFlat(wmW, { wmColor, media, tag }) {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:${Math.round(wmW * 0.05)}px">
    ${wordmark(wmW, { color: wmColor })}
    <div style="display:flex;align-items:center;gap:${Math.round(wmW * 0.04)}px;width:${Math.round(wmW * 0.66)}px">
      <span style="flex:1;height:6px;background:${media}"></span>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${Math.round(wmW * 0.06)}px;letter-spacing:0.5em;text-transform:uppercase;color:${media};padding-left:0.5em">Media</span>
      <span style="flex:1;height:6px;background:${media}"></span>
    </div>
    <span style="font-family:'JetBrains Mono',monospace;font-weight:600;font-size:${Math.round(wmW * 0.038)}px;letter-spacing:0.34em;text-transform:uppercase;color:${tag}">Every day&rsquo;s a Flickday</span>
  </div>`
}

const jobs = [
  // ── play icon (pocket / hat / sleeve) ──
  { name: 'dtf-icon-dark', w: 1400, h: 900, alpha: true, html: doc(playIcon(1100, { color: YELLOW }), 1400, 900) },
  { name: 'dtf-icon-light', w: 1400, h: 900, alpha: true, html: doc(playIcon(1100, { color: INK }), 1400, 900) },
  // ── wordmark ──
  { name: 'dtf-wordmark-dark', w: 2900, h: 1300, alpha: true, html: doc(wordmark(2600, { color: YELLOW }), 2900, 1300) },
  { name: 'dtf-wordmark-light', w: 2900, h: 1300, alpha: true, html: doc(wordmark(2600, { color: INK }), 2900, 1300) },
  // ── full lockup ──
  { name: 'dtf-lockup-dark', w: 2600, h: 1600, alpha: true, html: doc(lockupFlat(2000, { wmColor: YELLOW, media: YELLOW, tag: '#d1d5db' }), 2600, 1600) },
  { name: 'dtf-lockup-light', w: 2600, h: 1600, alpha: true, html: doc(lockupFlat(2000, { wmColor: INK, media: ORANGE, tag: '#52525b' }), 2600, 1600) },
]

console.log(`Rendering ${jobs.length} DTF print masters (v2)...\n`)
await renderJobs(jobs, outDir)

// remove the old standalone-F badges (replaced by the kinetic K)
for (const old of ['dtf-f-strobe-dark.png', 'dtf-f-strobe-light.png', 'dtf-f-solid-dark.png', 'dtf-f-solid-light.png', 'dtf-kmark-dark.png', 'dtf-kmark-light.png']) {
  const p = join(outDir, old)
  if (existsSync(p)) {
    rmSync(p)
    console.log('removed', old)
  }
}
console.log('\nDone →', outDir, '\n(transparent, flat, ~300 DPI; -dark for dark garments, -light for light)')
