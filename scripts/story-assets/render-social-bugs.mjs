/**
 * Flickday Media — social handle bugs for CapCut / Reels.
 * Clean, tightly-cropped, transparent PNGs that read over any footage.
 *
 *   node scripts/story-assets/render-social-bugs.mjs
 *
 * Output: flickday-assets/social-bugs/   (alpha, auto-cropped to pill + glow)
 *   Drop into CapCut, scale to taste. Rendered at 2x so down-scaling stays crisp.
 *
 * Brand language (see DESIGN.md): Flickday yellow #facc15, orange #f97316 accent,
 * the volleyball-aperture mark as the glyph, JetBrains Mono handle. No green, no
 * mascot — that's Let's Pepper. This is Flickday speaking for itself.
 *
 * NB: no backdrop-filter:blur — on a transparent export there is nothing behind
 * the pill to blur, so glass blur bakes out as a flat fill. Every style below
 * reads on its own over bright grass/sky footage.
 *
 * Styles:
 *   solid  — opaque near-black pill, yellow→orange accent edge (max legibility)
 *   glass  — dark translucent pill, yellow hairline + soft glow
 *   light  — white pill, dark handle, full-colour aperture mark (the clean look)
 *
 * Dependency note: reuses Playwright from the sibling letspepper repo to keep this
 * static-site repo free of a heavy browser dep. letspepper must be installed.
 */
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'social-bugs')
mkdirSync(outDir, { recursive: true })

const aperture = pathToFileURL(join(ROOT, 'flickday-assets', 'outro', 'aperture-icon-transparent.png')).href

const YELLOW = '#facc15'
const ORANGE = '#f97316'
const INK = '#0a0a0a'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&display=swap');`

const reset = `*{margin:0;padding:0;box-sizing:border-box}
  html,body{background:transparent}
  body{font-family:'JetBrains Mono',monospace;-webkit-font-smoothing:antialiased;display:inline-block}
  /* pad gives glows/shadows room so the auto-crop doesn't clip them */
  .pad{display:inline-block;padding:48px}
  .ap{flex:none;object-fit:contain}`

const HANDLE = 'flickday.media'

// --- style definitions ---------------------------------------------------
function solid(handle) {
  return `<div class="pad"><div class="pill" style="
      position:relative;display:inline-flex;align-items:center;gap:22px;
      padding:26px 46px 26px 38px;border-radius:18px;overflow:hidden;
      background:${INK};box-shadow:0 16px 46px rgba(0,0,0,0.55)">
    <span style="position:absolute;left:0;top:0;bottom:0;width:12px;
      background:linear-gradient(180deg,${YELLOW},${ORANGE})"></span>
    <img class="ap" src="${aperture}" style="width:62px;height:62px;margin-left:6px;
      filter:drop-shadow(0 0 10px rgba(250,204,21,0.35))">
    <span style="font-weight:800;font-size:52px;letter-spacing:0.01em;color:#fff;white-space:nowrap">
      <span style="color:${YELLOW}">@</span>${handle}</span>
  </div></div>`
}

function glass(handle) {
  return `<div class="pad"><div class="pill" style="
      display:inline-flex;align-items:center;gap:22px;
      padding:26px 46px 26px 34px;border-radius:999px;
      background:rgba(8,8,8,0.62);border:2px solid rgba(250,204,21,0.45);
      box-shadow:0 14px 50px rgba(0,0,0,0.5), 0 0 30px rgba(250,204,21,0.20)">
    <img class="ap" src="${aperture}" style="width:64px;height:64px;
      filter:drop-shadow(0 0 12px rgba(250,204,21,0.45))">
    <span style="font-weight:800;font-size:52px;letter-spacing:0.01em;color:#f6f6f1;white-space:nowrap">
      <span style="color:${YELLOW}">@</span>${handle}</span>
  </div></div>`
}

function light(handle) {
  return `<div class="pad"><div class="pill" style="
      display:inline-flex;align-items:center;gap:20px;
      padding:24px 44px 24px 30px;border-radius:999px;
      background:#fbfbf7;box-shadow:0 16px 46px rgba(0,0,0,0.4)">
    <img class="ap" src="${aperture}" style="width:64px;height:64px">
    <span style="font-weight:800;font-size:50px;letter-spacing:0.01em;color:#16110f;white-space:nowrap">
      @${handle}</span>
  </div></div>`
}

const STYLES = { solid, glass, light }

const doc = (body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${reset}</style></head><body>${body}</body></html>`

const jobs = Object.entries(STYLES).map(([style, fn]) => ({
  name: `ig-flickday-${style}`,
  html: doc(fn(HANDLE)),
}))

const browser = await chromium.launch()
console.log(`Rendering ${jobs.length} social bugs...\n`)
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 600 }, deviceScaleFactor: 2 })
  const tmp = join(outDir, `_tmp.html`)
  writeFileSync(tmp, job.html)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
  const el = await page.$('.pad')
  await el.screenshot({ path: join(outDir, `${job.name}.png`), omitBackground: true })
  console.log(`✓ ${job.name}.png`)
  await page.close()
  rmSync(tmp)
}
await browser.close()
console.log('\nDone. Social bugs in flickday-assets/social-bugs/')
