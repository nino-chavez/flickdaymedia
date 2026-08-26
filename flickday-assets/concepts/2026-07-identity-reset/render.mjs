import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')
const root = dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })

await page.goto(pathToFileURL(join(root, 'index.html')).href, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(250)

for (const [id, file] of [
  ['wordmarks', '01-wordmark-territories.png'],
  ['symbols', '02-independent-mark-territories.png'],
  ['applications', '03-application-test.png'],
  ['lockups', '04-lockup-logic-copy-check.png'],
]) {
  await page.locator(`#${id}`).screenshot({ path: join(root, file) })
}

await browser.close()
console.log('Rendered 4 Flickday identity review boards.')
