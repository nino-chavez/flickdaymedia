/**
 * Export the icon-in-the-'d' wordmarks in isolation for Adobe Express.
 * Auto-crops each mark tight (measured getBBox), then emits a clean SVG +
 * transparent PNGs in yellow / white / black so it drops onto any background.
 *
 *   node scripts/export-wordmarks.mjs   →  flickday-assets/wordmarks/
 */
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BRAND = join(ROOT, 'flickday-assets', 'brand')
const OUT = join(ROOT, 'flickday-assets', 'wordmarks')
mkdirSync(OUT, { recursive: true })

const COLORS = { yellow: '#facc15', white: '#ffffff', black: '#111111' }
const PNG_W = 4000 // plenty for Express / large prints
const MARKS = [
  ['play', 'wordmark.svg'],      // play triangle nested in the 'd'
  ['reel', 'wordmark-reel.svg'], // film reel nested in the 'd'
]

const recolor = (svg, c) => svg.replace(/fill="#facc15"/gi, `fill="${c}"`)

const browser = await chromium.launch()

async function tightBox(svg) {
  const page = await browser.newPage()
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: 'domcontentloaded' })
  const b = await page.evaluate(() => {
    const s = document.querySelector('svg'); const x = s.getBBox()
    return { x: x.x, y: x.y, w: x.width, h: x.height }
  })
  await page.close()
  return b
}

for (const [name, file] of MARKS) {
  const src = readFileSync(join(BRAND, file), 'utf8')
  const b = await tightBox(src)
  const pad = Math.max(b.w, b.h) * 0.04
  const vb = `${(b.x - pad).toFixed(1)} ${(b.y - pad).toFixed(1)} ${(b.w + 2 * pad).toFixed(1)} ${(b.h + 2 * pad).toFixed(1)}`
  const W = b.w + 2 * pad, H = b.h + 2 * pad
  const pngH = Math.round(PNG_W * (H / W))

  // tight vector — retag viewBox + numeric width/height (drop the 'pt' units)
  const tight = src
    .replace(/viewBox="[^"]*"/, `viewBox="${vb}"`)
    .replace(/width="[^"]*"/, `width="${W.toFixed(1)}"`)
    .replace(/height="[^"]*"/, `height="${H.toFixed(1)}"`)

  // SVG deliverable (native yellow, scalable — recolor freely in Express)
  writeFileSync(join(OUT, `wordmark-${name}.svg`), tight)
  console.log('✓', `wordmark-${name}.svg`)

  // transparent PNGs per color
  for (const [cname, hex] of Object.entries(COLORS)) {
    const colored = recolor(tight, hex)
      .replace(/width="[^"]*"/, `width="${PNG_W}"`)
      .replace(/height="[^"]*"/, `height="${pngH}"`)
    const page = await browser.newPage({ deviceScaleFactor: 1 })
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:transparent">${colored}</body></html>`, { waitUntil: 'networkidle' })
    await page.locator('svg').screenshot({ path: join(OUT, `wordmark-${name}-${cname}.png`), omitBackground: true })
    await page.close()
    console.log('  ✓', `wordmark-${name}-${cname}.png`, `${PNG_W}x${pngH}`)
  }
}

await browser.close()
console.log('\nDone → flickday-assets/wordmarks/')
