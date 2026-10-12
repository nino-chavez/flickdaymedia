/**
 * Build the site's favicon set and web manifest. The favicon is the play mark
 * alone on a yellow tile, which the 2026-10-12 ruling allows.
 * Focused + single-purpose (no shared god-module). No network needed.
 *
 *   node scripts/build-site-assets.mjs
 *
 * Outputs into site/flickday-assets/site/favicon/, the folder Pages publishes.
 * The share card carries the wordmark, so build-site-wordmark.mjs owns it.
 */
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = join(ROOT, 'site', 'flickday-assets', 'site')
const FAV = join(SITE, 'favicon')
mkdirSync(FAV, { recursive: true })
const Y = '#facc15', BG = '#0a0a0a'

// solid play tile — legible at favicon sizes (rounded square, dark play triangle)
const playTile = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${rx}" fill="${Y}"/><polygon points="40,29 40,71 73,50" fill="${BG}"/></svg>`

const browser = await chromium.launch()

// ---- favicons: render the tile at each exact size ----
const FAVS = [
  ['favicon-16x16.png', 16, 22], ['favicon-32x32.png', 32, 22],
  ['apple-touch-icon.png', 180, 20], ['android-chrome-192x192.png', 192, 20],
  ['android-chrome-512x512.png', 512, 20],
]
for (const [name, px, rx] of FAVS) {
  const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 })
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}html,body{width:${px}px;height:${px}px;overflow:hidden}svg{display:block;width:${px}px;height:${px}px}</style></head><body>${playTile(rx)}</body></html>`, { waitUntil: 'domcontentloaded' })
  await page.screenshot({ path: join(FAV, name), clip: { x: 0, y: 0, width: px, height: px } })
  await page.close()
  console.log('✓', name, `${px}x${px}`)
}

// ---- web manifest ----
writeFileSync(join(FAV, 'site.webmanifest'), JSON.stringify({
  name: 'Flickday Media', short_name: 'Flickday', theme_color: '#0a0a0a', background_color: '#0a0a0a', display: 'standalone',
  icons: [
    { src: '/flickday-assets/site/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/flickday-assets/site/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2))
console.log('✓ site.webmanifest')

await browser.close()
console.log('\nDone → site/flickday-assets/site/')
