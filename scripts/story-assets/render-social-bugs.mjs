/**
 * Flickday Media — social handle bugs for CapCut / Reels (v2 language).
 * Clean, tightly-cropped, transparent PNGs that read over any footage.
 *
 *   node scripts/story-assets/render-social-bugs.mjs
 *
 * Output: flickday-assets/social-bugs/   (alpha, element-cropped to pill + glow)
 *   Rendered at 2× so down-scaling stays crisp.
 *
 * Brand language (see DESIGN.md + _brand-v2.mjs): the solid F glyph is the mark
 * (no aperture — that was the old viewfinder kit). Yellow #facc15 → orange
 * #f97316, JetBrains Mono handle. No green, no mascot — that's Let's Pepper.
 *
 * Styles:
 *   solid  — opaque near-black pill, yellow→orange accent edge (max legibility)
 *   glass  — dark translucent pill, yellow hairline + soft glow (footage shows through)
 *   light  — white pill, dark handle (the clean look)
 *
 * Offline-safe: fonts are embedded via _fonts.mjs (no Google Fonts network call).
 */
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { FONTS, YELLOW, ORANGE } from './_brand-v2.mjs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'social-bugs')
mkdirSync(outDir, { recursive: true })

const HANDLE = 'flickday.media'

// F glyph — Bebas Neue cap, the brand's active mark
const fmark = (color, glow) =>
  `<span style="font-family:'Bebas Neue',sans-serif;font-size:74px;line-height:0.66;color:${color};
    ${glow ? `text-shadow:0 0 14px ${glow};` : ''}">F</span>`

const reset = `*{margin:0;padding:0;box-sizing:border-box}
  html,body{background:transparent}
  body{font-family:'JetBrains Mono',monospace;-webkit-font-smoothing:antialiased;display:inline-block}
  .pad{display:inline-block;padding:48px}`

function solid(handle) {
  return `<div class="pad"><div style="position:relative;display:inline-flex;align-items:center;gap:22px;
      padding:26px 46px 26px 40px;border-radius:18px;overflow:hidden;
      background:#0b0b0c;box-shadow:0 16px 46px rgba(0,0,0,0.55)">
    <span style="position:absolute;left:0;top:0;bottom:0;width:12px;background:linear-gradient(180deg,${YELLOW},${ORANGE})"></span>
    ${fmark(YELLOW, 'rgba(250,204,21,0.4)')}
    <span style="font-weight:800;font-size:52px;letter-spacing:0.01em;color:#fff;white-space:nowrap">
      <span style="color:${YELLOW}">@</span>${handle}</span>
  </div></div>`
}

function glass(handle) {
  return `<div class="pad"><div style="display:inline-flex;align-items:center;gap:22px;
      padding:26px 46px 26px 36px;border-radius:999px;
      background:rgba(8,8,8,0.62);border:2px solid rgba(250,204,21,0.45);
      box-shadow:0 14px 50px rgba(0,0,0,0.5),0 0 30px rgba(250,204,21,0.20)">
    ${fmark(YELLOW, 'rgba(250,204,21,0.5)')}
    <span style="font-weight:800;font-size:52px;letter-spacing:0.01em;color:#f6f6f1;white-space:nowrap">
      <span style="color:${YELLOW}">@</span>${handle}</span>
  </div></div>`
}

function light(handle) {
  return `<div class="pad"><div style="display:inline-flex;align-items:center;gap:20px;
      padding:24px 44px 24px 32px;border-radius:999px;
      background:#fbfbf7;box-shadow:0 16px 46px rgba(0,0,0,0.4)">
    ${fmark('#16110f', null)}
    <span style="font-weight:800;font-size:50px;letter-spacing:0.01em;color:#16110f;white-space:nowrap">@${handle}</span>
  </div></div>`
}

const STYLES = { solid, glass, light }
const doc = (body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${reset}</style></head><body>${body}</body></html>`

const jobs = Object.entries(STYLES).map(([style, fn]) => ({ name: `ig-flickday-${style}`, html: doc(fn(HANDLE)) }))

const browser = await chromium.launch()
console.log(`Rendering ${jobs.length} social bugs...\n`)
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 600 }, deviceScaleFactor: 2 })
  const tmp = join(outDir, `_tmp.html`)
  writeFileSync(tmp, job.html)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))]))
  await page.waitForTimeout(200)
  const el = await page.$('.pad')
  await el.screenshot({ path: join(outDir, `${job.name}.png`), omitBackground: true })
  console.log(`✓ ${job.name}.png`)
  await page.close()
  rmSync(tmp)
}
await browser.close()
console.log('\nDone. Social bugs in flickday-assets/social-bugs/')
