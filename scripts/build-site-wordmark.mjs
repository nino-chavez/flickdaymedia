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
// the page's own words: the wordmark with its "MEDIA" rule (the name, Flickday
// Media), the tagline set like the hero's eyebrow, and the hero's headline.
// Type and colour are the live hero's computed styles (render standard gate 1):
// Anton 400, uppercase, 0.01em, white for the headline; JetBrains Mono 500,
// uppercase, 0.08em, #facc15 for the eyebrow. Read 2026-10-12.
const CARD_W = 1200;
const CARD_H = 630;
const CARD_BG = '#0a0a0a';
const CARD_OUT = join(OUT, 'og-share-card.png');
// Brand, then claim, then sign-off. With the tagline above the headline (the
// hero's own order), two small yellow mono lines stacked between the mark and
// the claim and read busier. 600 px of mark and a 68 px headline keep the whole
// stack inside a centred 630 px square, for apps that crop link images square;
// at 700 px the square cut off the f and the y.
const CARD_MARK = 600; // wordmark width, card px
const CARD_HEAD = 68; // headline font-size, card px
const CARD_TAG = 20; // eyebrow font-size, card px
const HEADLINE = 'We shoot volleyball.';
const TAGLINE = "Every Day's a Flickday"; // exact (render standard gate 3)

// The mark is drawn at 2x its card width so the 2x screenshot never upscales it.
async function renderCard(page, tmp) {
  const mark = join(tmp, 'card-mark.png');
  await renderMark(page, tmp, YELLOW, CARD_MARK * 2, mark);
  const rows = {
    wm: `<img class="wm" src="card-mark.png" alt="">`,
    med: `<div class="med"><span class="line"></span><span class="txt">Media</span><span class="line"></span></div>`,
    tag: `<div class="eyebrow">${TAGLINE}</div>`,
    head: `<div class="head">${HEADLINE}</div>`,
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
.med{display:flex;align-items:center;gap:16px;width:${Math.round(CARD_MARK * 0.9)}px;margin-top:-6px}
.med span.line{flex:1;height:1px;background:#374151}
.med span.txt{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:22px;letter-spacing:0.5em;text-transform:uppercase;color:${YELLOW};padding-left:0.5em}
.eyebrow{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:${CARD_TAG}px;letter-spacing:0.08em;text-transform:uppercase;color:${YELLOW};line-height:1.5}
.head{font-family:'Anton',Impact,sans-serif;font-weight:400;font-size:${CARD_HEAD}px;letter-spacing:0.01em;text-transform:uppercase;color:#ffffff;line-height:0.96;white-space:nowrap}</style>
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
    // --card renders the share card alone. A rebuild of the header PNGs on a
    // different Chromium shifts their edge pixels, so leave them be unless the
    // mark itself changed.
    if (!process.argv.includes('--card')) {
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
