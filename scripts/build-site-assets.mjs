/**
 * Build the site's favicon set + OG share card from the restored brand marks.
 * Focused + single-purpose (no shared god-module). Offline-safe: fonts via network.
 *
 *   node scripts/build-site-assets.mjs
 *
 * Outputs into flickday-assets/site/ (favicon/*, og-share-card.png).
 */
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = join(ROOT, 'flickday-assets', 'site')
const FAV = join(SITE, 'favicon')
mkdirSync(FAV, { recursive: true })
const Y = '#facc15', BG = '#0a0a0a'

// cropped yellow wordmark (for the OG card) — reuse the brand mark, tight viewBox
let wordmark = readFileSync(join(ROOT, 'flickday-assets', 'brand', 'wordmark.svg'), 'utf8')
  .replace(/viewBox="[^"]*"/, 'viewBox="463 315 2982 983"')
  .replace(/width="[^"]*"/, 'width="2982"').replace(/height="[^"]*"/, 'height="983"')

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

// ---- OG share card 1200x630 ----
{
  const w = 1200, h = 630
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@600&display=swap">
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden}
      body{background:${BG};background-image:radial-gradient(70% 55% at 30% 30%,rgba(250,204,21,0.12),transparent 60%),radial-gradient(80% 60% at 85% 95%,rgba(249,115,22,0.07),transparent 60%);
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px}
      .wm{width:620px}.wm svg{width:100%;height:auto;display:block}
      .med{display:flex;align-items:center;gap:16px;width:560px}
      .med span.line{flex:1;height:1px;background:#374151}
      .med span.txt{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:22px;letter-spacing:0.5em;text-transform:uppercase;color:${Y};padding-left:0.5em}
      .tag{font-family:'Bebas Neue',sans-serif;font-size:46px;letter-spacing:0.03em;text-transform:uppercase;color:#e5e5e5;line-height:1}</style></head>
    <body>
      <div class="wm">${wordmark}</div>
      <div class="med"><span class="line"></span><span class="txt">Media</span><span class="line"></span></div>
      <div class="tag">Every Day&rsquo;s a Flickday</div>
    </body></html>`
  const tmp = join(SITE, '_og.html'); writeFileSync(tmp, html)
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle', timeout: 25000 })
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400)
  await page.screenshot({ path: join(SITE, 'og-share-card.png'), clip: { x: 0, y: 0, width: w, height: h } })
  await page.close()
  const { rmSync } = await import('node:fs'); rmSync(tmp)
  console.log('✓ og-share-card.png 1200x630')
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
console.log('\nDone → flickday-assets/site/')
