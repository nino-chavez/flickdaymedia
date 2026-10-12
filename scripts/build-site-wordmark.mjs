/**
 * Site wordmark — the locked Peridot wordmark as the two PNGs the home page
 * shows: yellow in the header over the hero photo, white in the footer.
 *
 * A PNG, not live text and not an SVG (BRAND-PRIORS.md). The page loads no
 * font kit for one word, and Peridot is licensed for live text, not for
 * embedded outlines. Spacing is the standard optical cut from PERIDOT_CUTS:
 * the page shows the mark well above the 24 px where the micro cut takes over.
 *
 * No play mark in the d (nino, 2026-10-12). The play mark is its own symbol.
 *
 * Needs network (the Adobe Fonts kit) and ImageMagick (`magick`) for the trim.
 *
 *   node scripts/build-site-wordmark.mjs
 *     → site/flickday-assets/site/wordmark-yellow.png, wordmark-white.png
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium, KIT_LINKS, peridotMark, PERIDOT, PERIDOT_CUTS, YELLOW } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site', 'flickday-assets', 'site');
// The width the page's wordmark asset has always shipped at.
const WIDTH = 640;
const COLORWAYS = [
  ['wordmark-yellow.png', YELLOW],
  ['wordmark-white.png', '#ffffff'],
];
const S = PERIDOT_CUTS.standard;

async function main() {
  const tmp = mkdtempSync(join(tmpdir(), 'flickday-wordmark-'));
  // wordmark-lib borrows another repo's Playwright, whose headless-shell build
  // may not be installed; fall back to installed Chrome, as blueprint's
  // web-capture does, and say which browser drew the mark.
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
  console.log(`browser: ${browser.version()}`);
  try {
    const page = await browser.newPage({ deviceScaleFactor: 2 });
    for (const [file, color] of COLORWAYS) {
      const html = join(tmp, 'mark.html');
      writeFileSync(
        html,
        `<!DOCTYPE html><html><head><meta charset="utf-8">${KIT_LINKS}
<style>*{margin:0;padding:0}body{background:transparent}
.box{display:inline-block;padding:0.4em;line-height:1.6;white-space:nowrap}</style>
</head><body><div class="box">${peridotMark(color, '400px', S.track, S.hand)}</div></body></html>`,
      );
      await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      // document.fonts.check() is true for a family that never loaded at all,
      // so ask whether the Peridot face itself reports loaded. Without this a
      // blocked kit writes the word in a fallback face and nothing says so.
      const loaded = await page.evaluate(
        (family) =>
          [...document.fonts].some((f) => f.family.replace(/["']/g, '') === family && f.status === 'loaded'),
        PERIDOT.cssFamily,
      );
      if (!loaded) throw new Error(`${PERIDOT.cssFamily} did not load; refusing to write ${file} in a fallback face`);

      const raw = join(tmp, file);
      await page.locator('.box').screenshot({ path: raw, omitBackground: true });
      const out = join(OUT, file);
      execFileSync('magick', [raw, '-trim', '+repage', '-resize', `${WIDTH}x`, out]);
      console.log(`✓ ${file}  ${execFileSync('magick', ['identify', '-format', '%wx%h', out])}`);
    }
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
