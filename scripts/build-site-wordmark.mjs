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
 *   node scripts/build-site-wordmark.mjs --card
 *     → og-share-card.png only
 *   node scripts/build-site-wordmark.mjs --out <path>
 *     → the card only, to <path>: try a variant without touching the committed
 *       card. On 2026-10-12 a variant render overwrote it before this flag existed.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { basename, dirname, resolve, join } from 'node:path';
import { assertLoaded, chromium, renderMark, YELLOW } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site', 'flickday-assets', 'site');
// The width the page's wordmark asset has always shipped at.
const WIDTH = 640;
const COLORWAYS = [
  ['wordmark-yellow.png', YELLOW],
  ['wordmark-white.png', '#ffffff'],
];

// The share card: 1200x630 drawn at 2x, the size the page declares. It carries
// the page's own words: the wordmark with "MEDIA" under it, so the card names the
// business in full (Flickday Media, render standard gate 3); the hero's headline
// (the tagline, which nino made the headline on 2026-10-12); and the hero's eyebrow
// line, which says what Flickday is. "MEDIA" is a word, not a rule: nino dropped the
// rule lines and kept the word (2026-10-12).
// Type and colour are the live hero's computed styles (render standard gate 1):
// Anton 400, uppercase, 0.01em, white for the headline; JetBrains Mono 500,
// uppercase, 0.08em, #facc15 for the eyebrow. Read 2026-10-12. "MEDIA" uses the
// eyebrow's face, spaced 0.5em as the old card's rule word was.
const CARD_W = 1200;
const CARD_H = 630;
const CARD_BG = '#0a0a0a';
const outAt = process.argv.indexOf('--out');
if (outAt > 0 && !process.argv[outAt + 1]) throw new Error('--out needs a path');
const CARD_OUT = outAt > 0 ? resolve(process.argv[outAt + 1]) : join(OUT, 'og-share-card.png');
// Mark, MEDIA, headline, descriptor. The headline sits on two lines at 100 px, as the
// hero sets it on a phone, so it weighs as much as the mark (nino chose two
// lines over one at 84 px, 2026-10-12). One line ran wider than the mark, and a
// centred 630 px square, which some apps crop link images to, clipped its ends;
// this stack fits that square.
const CARD_MARK = 600; // wordmark width, card px
const CARD_HEAD = 100; // headline font-size, card px
const CARD_TAG = 20; // eyebrow font-size, card px
const CARD_MEDIA = 22; // "MEDIA" font-size, card px
const HEADLINE = "Every Day's a Flickday."; // the tagline, exact (render standard gate 3)
const DESCRIPTOR = 'Volleyball photos &amp; reels · Chicago';

// The mark is drawn at 2x its card width so the 2x screenshot never upscales it.
async function renderCard(page, tmp) {
  const mark = join(tmp, 'card-mark.png');
  await renderMark(page, tmp, YELLOW, CARD_MARK * 2, mark);
  const rows = {
    wm: `<img class="wm" src="card-mark.png" alt="">`,
    med: `<div class="med">Media</div>`,
    tag: `<div class="eyebrow">${DESCRIPTOR}</div>`,
    head: `<div class="head">${HEADLINE.replace(' Flickday', '<br>Flickday')}</div>`,
  };
  const order = ['wm', 'med', 'head', 'tag'];
  const html = join(tmp, 'card.html');
  writeFileSync(
    html,
    `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@500&display=swap">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${CARD_W}px;height:${CARD_H}px;overflow:hidden}
body{background:${CARD_BG};background-image:radial-gradient(70% 55% at 30% 30%,rgba(250,204,21,0.12),transparent 60%),radial-gradient(80% 60% at 85% 95%,rgba(249,115,22,0.07),transparent 60%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px}
.wm{display:block;width:${CARD_MARK}px;height:auto}
.med{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:${CARD_MEDIA}px;letter-spacing:0.5em;padding-left:0.5em;text-transform:uppercase;color:${YELLOW};line-height:1;margin-top:-10px}
.eyebrow{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:${CARD_TAG}px;letter-spacing:0.08em;text-transform:uppercase;color:${YELLOW};line-height:1.5}
.head{font-family:'Anton',Impact,sans-serif;font-weight:400;font-size:${CARD_HEAD}px;letter-spacing:0.01em;text-transform:uppercase;color:#ffffff;line-height:0.96;white-space:nowrap;text-align:center}</style>
</head><body>
${order.map((k) => rows[k]).join('\n')}
</body></html>`,
  );
  await page.setViewportSize({ width: CARD_W, height: CARD_H });
  await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode())]));
  for (const family of ['Anton', 'JetBrains Mono']) await assertLoaded(page, family, basename(CARD_OUT));
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
    // --card and --out render the share card alone. A rebuild of the header PNGs on a
    // different Chromium shifts their edge pixels, so leave them be unless the
    // mark itself changed.
    if (!process.argv.includes('--card') && outAt < 0) {
      for (const [file, color] of COLORWAYS) {
        console.log(`✓ ${file}  ${await renderMark(page, tmp, color, WIDTH, join(OUT, file))}`);
      }
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
