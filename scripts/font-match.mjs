/**
 * Font-match sheet: the traced 'flickday' mark (reference) vs "flickday" set in
 * candidate heavy geometric fonts, so we can pick the closest real font — the
 * one that becomes the editable, extendable wordmark for Adobe Express.
 *
 *   node scripts/font-match.mjs   →  flickday-assets/wordmarks/_font-match.png
 */
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'flickday-assets', 'wordmarks')
const ref = 'data:image/png;base64,' + readFileSync(join(OUT, 'wordmark-play-yellow.png')).toString('base64')

// candidate heavy lowercase geometric faces (weight picked toward the trace)
const FONTS = [
  ['Poppins', 800], ['Montserrat', 800], ['Baloo 2', 800], ['Fredoka', 600],
  ['Nunito', 900], ['Rubik', 800], ['Plus Jakarta Sans', 800], ['Sora', 800],
  ['Figtree', 900], ['Manrope', 800],
]
const fam = FONTS.map(([f, w]) => `family=${f.replace(/ /g, '+')}:wght@${w}`).join('&')

const rows = FONTS.map(([f, w]) => `
  <div class="row">
    <div class="lbl">${f} ${w}</div>
    <div class="word" style="font-family:'${f}';font-weight:${w}">flickday</div>
  </div>`).join('')

const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fam}&display=swap">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0f0f12;padding:56px 64px;font-family:system-ui}
    h1{color:#facc15;font-size:26px;margin-bottom:4px}
    .sub{color:#7a7a7a;font-size:15px;margin-bottom:30px}
    .refwrap{border:1px solid rgba(250,204,21,.35);border-radius:14px;padding:26px 34px;margin-bottom:14px;background:#000}
    .refwrap .tag{color:#facc15;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;font-weight:700}
    .refwrap img{height:150px;display:block}
    .row{display:flex;align-items:center;gap:40px;border-bottom:1px solid #232327;padding:22px 8px}
    .lbl{color:#8a8a8a;font-size:15px;width:220px;flex:none;font-family:'JetBrains Mono',monospace}
    .word{color:#facc15;font-size:130px;line-height:1;letter-spacing:-.01em}
  </style></head>
  <body>
    <h1>flickday — font match</h1>
    <div class="sub">Top box = your traced mark (reference). Pick the row whose letterforms sit closest — that becomes the editable wordmark.</div>
    <div class="refwrap"><div class="tag">Reference · traced mark (not a font)</div><img src="${ref}"></div>
    ${rows}
  </body></html>`

const W = 1500
const tmp = join(OUT, '_fontmatch.html'); writeFileSync(tmp, html)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2 })
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle', timeout: 25000 })
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400)
const full = await page.evaluate(() => document.body.scrollHeight)
await page.setViewportSize({ width: W, height: full })
await page.screenshot({ path: join(OUT, '_font-match.png') })
await browser.close(); rmSync(tmp)
console.log('✓ _font-match.png', `${W}x${full}`)
