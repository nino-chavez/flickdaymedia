/**
 * Site wordmark — the locked Peridot wordmark in every site asset that shows
 * it: the two PNGs the home page uses (yellow in the header over the hero
 * photo, white in the footer) and the share card (og:image).
 *
 * A PNG, not live text and not an SVG (BRAND-PRIORS.md). The page loads no
 * font kit for one word, and Peridot is licensed for live text, not for
 * embedded outlines. Spacing is the standard optical cut from PERIDOT_CUTS:
 * every asset here shows the mark well above the 24 px where the micro cut
 * takes over.
 *
 * No play mark in the d (nino, 2026-10-12). The play mark is its own symbol;
 * the favicons that carry it alone come from build-site-assets.mjs.
 *
 * Needs network (the Adobe Fonts kit, Google Fonts for the card) and
 * ImageMagick (`magick`) for the trim.
 *
 *   node scripts/build-site-wordmark.mjs
 *     → site/flickday-assets/site/wordmark-yellow.png, wordmark-white.png,
 *       og-share-card.png
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { basename, dirname, resolve, join } from 'node:path';
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

// The share card: 1200x630 drawn at 2x, the size the page declares. The mark
// width is in card px; its ink is the whole image, so the stack centres on ink.
// 700 px gives Peridot (about 4.1:1) the presence the traced mark (about 2.7:1)
// had at 620 px; 620 left the card top-light and 760 crowded the tagline.
const CARD_W = 1200;
const CARD_H = 630;
const CARD_BG = '#0a0a0a';
const CARD_MARK = 700;
const CARD_OUT = join(OUT, 'og-share-card.png');

// document.fonts.check() is true for a family that never loaded at all, so ask
// whether a face of the family itself reports loaded. Without this a blocked
// kit writes the text in a fallback face and nothing says so.
async function assertLoaded(page, family, file) {
  const loaded = await page.evaluate(
    (fam) => [...document.fonts].some((f) => f.family.replace(/["']/g, '') === fam && f.status === 'loaded'),
    family,
  );
  if (!loaded) throw new Error(`${family} did not load; refusing to write ${file} in a fallback face`);
}

// The mark in `color`, trimmed to ink and resized to `width` px, at `out`.
async function renderMark(page, tmp, color, width, out) {
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
  await assertLoaded(page, PERIDOT.cssFamily, basename(out));

  const raw = join(tmp, 'mark-raw.png');
  await page.locator('.box').screenshot({ path: raw, omitBackground: true });
  // No date or tIME chunks, so a rebuild of an unchanged mark is byte-identical.
  execFileSync('magick', [raw, '-trim', '+repage', '-resize', `${width}x`, '-define', 'png:exclude-chunks=date,time', out]);
  return execFileSync('magick', ['identify', '-format', '%wx%h', out]).toString();
}

// The share card: wordmark, a "MEDIA" rule line, the tagline. The mark is
// drawn at 2x its card width so the 2x screenshot never upscales it.
async function renderCard(page, tmp) {
  const mark = join(tmp, 'card-mark.png');
  await renderMark(page, tmp, YELLOW, CARD_MARK * 2, mark);
  const rule = Math.round(CARD_MARK * 0.9);
  const html = join(tmp, 'card.html');
  writeFileSync(
    html,
    `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@600&display=swap">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${CARD_W}px;height:${CARD_H}px;overflow:hidden}
body{background:${CARD_BG};background-image:radial-gradient(70% 55% at 30% 30%,rgba(250,204,21,0.12),transparent 60%),radial-gradient(80% 60% at 85% 95%,rgba(249,115,22,0.07),transparent 60%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px}
.wm{display:block;width:${CARD_MARK}px;height:auto;margin-bottom:4px}
.med{display:flex;align-items:center;gap:16px;width:${rule}px}
.med span.line{flex:1;height:1px;background:#374151}
.med span.txt{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:22px;letter-spacing:0.5em;text-transform:uppercase;color:${YELLOW};padding-left:0.5em}
.tag{font-family:'Bebas Neue',sans-serif;font-size:46px;letter-spacing:0.03em;text-transform:uppercase;color:#e5e5e5;line-height:1}</style>
</head><body>
<img class="wm" src="card-mark.png" alt="">
<div class="med"><span class="line"></span><span class="txt">Media</span><span class="line"></span></div>
<div class="tag">Every Day&rsquo;s a Flickday</div>
</body></html>`,
  );
  await page.setViewportSize({ width: CARD_W, height: CARD_H });
  await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode())]));
  for (const family of ['JetBrains Mono', 'Bebas Neue']) await assertLoaded(page, family, basename(CARD_OUT));
  await page.screenshot({ path: CARD_OUT, clip: { x: 0, y: 0, width: CARD_W, height: CARD_H } });
  return execFileSync('magick', ['identify', '-format', '%wx%h', CARD_OUT]).toString();
}

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
      console.log(`✓ ${file}  ${await renderMark(page, tmp, color, WIDTH, join(OUT, file))}`);
    }
    console.log(`✓ ${basename(CARD_OUT)}  ${await renderCard(page, tmp)}  (mark ${CARD_MARK} px)`);
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
