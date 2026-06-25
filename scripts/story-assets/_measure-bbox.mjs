// Measure true ink bounding box of brand SVGs (potrace output carries whitespace).
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { writeFileSync, rmSync } from 'node:fs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')
const HERE = dirname(fileURLToPath(import.meta.url))
const BRAND = resolve(HERE, '..', '..', 'flickday-assets', 'brand')

const files = ['wordmark.svg', 'wordmark-twotone.svg', 'wordmark-reel.svg', 'icon-play.svg']
const browser = await chromium.launch()
const page = await browser.newPage()
for (const f of files) {
  const raw = readFileSync(join(BRAND, f), 'utf8')
  const vb = raw.match(/viewBox="([\d.\s]+)"/)[1].trim().split(/\s+/).map(Number)
  const tmp = join(BRAND, `_m.html`)
  writeFileSync(tmp, `<!doctype html><body>${raw}</body>`)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'domcontentloaded' })
  const bbox = await page.evaluate(() => {
    const svg = document.querySelector('svg')
    // union of all rendered geometry
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const el of svg.querySelectorAll('path,rect,circle,polygon')) {
      const b = el.getBBox()
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y)
      x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height)
    }
    return { x0, y0, x1, y1 }
  })
  rmSync(tmp)
  const inkW = bbox.x1 - bbox.x0, inkH = bbox.y1 - bbox.y0
  console.log(`${f}`)
  console.log(`  viewBox: ${vb[2]} x ${vb[3]}  (ratio ${(vb[2] / vb[3]).toFixed(3)})`)
  console.log(`  ink bbox: x ${bbox.x0.toFixed(1)}..${bbox.x1.toFixed(1)}  y ${bbox.y0.toFixed(1)}..${bbox.y1.toFixed(1)}`)
  console.log(`  ink size: ${inkW.toFixed(1)} x ${inkH.toFixed(1)}  (ratio ${(inkW / inkH).toFixed(3)})`)
  console.log(`  whitespace: left ${(bbox.x0).toFixed(0)} | right ${(vb[2] - bbox.x1).toFixed(0)} | top ${(bbox.y0).toFixed(0)} | bottom ${(vb[3] - bbox.y1).toFixed(0)}`)
}
await browser.close()
