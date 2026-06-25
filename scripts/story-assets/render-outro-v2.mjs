/**
 * Flickday Media — outro kit in v2 (replaces the aperture/viewfinder outro).
 *
 *   node scripts/story-assets/render-outro-v2.mjs
 *
 * Output: flickday-assets/outro/
 *   outro-reel.png        1080×1920  vertical end card (opaque)
 *   outro-highlight.png   1920×1080  landscape end card (opaque)
 *   lockup-transparent.png  ~1100×300  kinetic wordmark (transparent) — used by reel kit
 *   f-glyph-transparent.png   512×512  chronophoto F (transparent) — replaces aperture-icon
 *
 * Offline-safe (embedded fonts). The shared outroCard builder lives in _brand-v2.mjs.
 */
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { rmSync, existsSync, writeFileSync } from 'node:fs'
import { page, outroCard, kWord, chrono, renderJobs } from './_brand-v2.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'outro')

const lockupTransparent = () =>
  page(`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${kWord(150)}</div>`,
    { w: 1100, h: 300, alpha: true })

const fGlyphTransparent = () =>
  page(`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
    <div style="transform:translateX(28px)">${chrono('F', 300, { spread: 0.42, n: 3, glow: 0.5 })}</div></div>`,
    { w: 512, h: 512, alpha: true })

const jobs = [
  { name: 'outro-reel', w: 1080, h: 1920, alpha: false, html: page(outroCard(1080, 1920), { w: 1080, h: 1920 }), scale: 1 },
  { name: 'outro-highlight', w: 1920, h: 1080, alpha: false, html: page(outroCard(1920, 1080), { w: 1920, h: 1080 }), scale: 1 },
  { name: 'lockup-transparent', w: 1100, h: 300, alpha: true, html: lockupTransparent(), scale: 2 },
  { name: 'f-glyph-transparent', w: 512, h: 512, alpha: true, html: fGlyphTransparent(), scale: 2 },
]

console.log(`Rendering ${jobs.length} outro assets (v2)...\n`)
await renderJobs(jobs, outDir)

// keep a self-contained, offline-openable HTML source for the landscape end card
// (embedded fonts) so outro.html and outro-highlight.png never drift
writeFileSync(join(outDir, 'outro.html'), page(outroCard(1920, 1080), { w: 1920, h: 1080 }))
console.log('wrote outro.html (self-contained v2 source)')

// remove the old aperture/viewfinder icons this kit no longer uses
for (const old of ['aperture-icon-transparent.png', 'motion-icon-transparent.png']) {
  const p = join(outDir, old)
  if (existsSync(p)) {
    rmSync(p)
    console.log('removed', old)
  }
}
console.log('\nDone →', outDir)
