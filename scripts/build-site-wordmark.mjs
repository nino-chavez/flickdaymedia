/**
 * Site wordmark — the locked Peridot wordmark in every site asset that shows
 * it: the two PNGs the home page uses (yellow in the header over the hero
 * photo, white in the footer), the share card (og:image), and the README's
 * hero banner, the repo's own front page on GitHub.
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
 *       og-share-card.png, and assets/readme/hero.png
 *   node scripts/build-site-wordmark.mjs --readme
 *     → assets/readme/hero.png only
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

// The README hero: a 1200x440 banner drawn at 2x, shown full width on GitHub. It was
// an SVG that set "FLICKDAY" in Impact capitals, a stand-in that only looked right
// where the viewer had Impact installed. A PNG carries the Peridot mark (no outlines
// in an SVG, BRAND-PRIORS.md) and the site's faces for everyone. The layout is the
// old one: the card's lockup (wordmark, MEDIA) with the site's eyebrow and the
// tagline on the left, the repo map on the right. The README's alt text carries
// every word on it, so a change here changes that alt in the same commit.
const README_OUT = join(ROOT, 'assets', 'readme', 'hero.png');
const HERO_W = 1200;
const HERO_H = 440;
const HERO_MARK = 500; // wordmark width, hero px
const REPO_MAP = [
  ['site/', 'the live site, and the brand&rsquo;s ground truth'],
  ['motion/', 'overlay kit, wordmark sting, film-room proof'],
  ['flickday-assets/', 'social kit, play symbol, mascot line-art'],
  ['BRAND-PRIORS.md', 'inputs for designing, not locked executions'],
];

async function renderReadmeHero(page, tmp) {
  const mark = join(tmp, 'hero-mark.png');
  await renderMark(page, tmp, YELLOW, HERO_MARK * 2, mark);
  const html = join(tmp, 'hero.html');
  const map = REPO_MAP.map(([path, what]) => `<div class="row"><b>${path}</b><span>${what}</span></div>`).join('');
  writeFileSync(
    html,
    `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400&family=JetBrains+Mono:wght@500&display=swap">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${HERO_W}px;height:${HERO_H}px;overflow:hidden}
body{background:#000;border-top:8px solid ${YELLOW};border-bottom:8px solid ${YELLOW};display:flex;align-items:center;justify-content:space-between;padding:0 64px}
.mono{font-family:'JetBrains Mono',monospace;font-weight:500;text-transform:uppercase}
.eyebrow{font-size:14px;letter-spacing:0.08em;color:${YELLOW};margin-bottom:22px}
.lockup{display:inline-flex;flex-direction:column;align-items:center}
.wm{display:block;width:${HERO_MARK}px;height:auto}
.med{font-size:19px;letter-spacing:0.5em;padding-left:0.5em;color:${YELLOW};line-height:1;margin-top:6px}
.head{font-family:'Anton',monospace;font-weight:400;font-size:40px;letter-spacing:0.01em;text-transform:uppercase;color:#fff;line-height:1;margin-top:26px}
.sub{font-family:'Inter',monospace;font-size:16px;color:#888;margin-top:12px}
.map{width:376px}
.map h2{font-size:11px;letter-spacing:0.2em;color:#888;font-weight:500;margin-bottom:12px}
.row{background:#111;border:1px solid #333;border-radius:4px;padding:10px 18px 11px;margin-top:12px}
.row b{display:block;font-family:'JetBrains Mono',monospace;font-weight:500;font-size:13px;color:${YELLOW}}
.row span{display:block;font-family:'Inter',monospace;font-size:13px;color:#888;margin-top:3px}</style>
</head><body>
<div><div class="mono eyebrow">${DESCRIPTOR}</div>
<div class="lockup"><img class="wm" src="hero-mark.png" alt=""><div class="mono med">Media</div></div>
<div class="head">${HEADLINE}</div>
<div class="sub">Raw, fast, player-first. We shoot for the ones who live in the rally.</div></div>
<div class="map"><h2 class="mono">What&rsquo;s in here</h2>${map}</div>
</body></html>`,
  );
  await page.setViewportSize({ width: HERO_W, height: HERO_H });
  await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode())]));
  for (const family of ['Anton', 'Inter', 'JetBrains Mono']) await assertLoaded(page, family, basename(README_OUT));
  await page.screenshot({ path: README_OUT, clip: { x: 0, y: 0, width: HERO_W, height: HERO_H } });
  return execFileSync('magick', ['identify', '-format', '%wx%h', README_OUT]).toString();
}

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
    // --readme renders the README hero alone.
    const cardOnly = process.argv.includes('--card') || outAt > 0;
    const readmeOnly = process.argv.includes('--readme');
    if (!cardOnly && !readmeOnly) {
      for (const [file, color] of COLORWAYS) {
        console.log(`✓ ${file}  ${await renderMark(page, tmp, color, WIDTH, join(OUT, file))}`);
      }
    }
    if (!readmeOnly) console.log(`✓ ${basename(CARD_OUT)}  ${await renderCard(page, tmp)}  (mark ${CARD_MARK} px)`);
    if (!cardOnly) console.log(`✓ ${basename(README_OUT)}  ${await renderReadmeHero(page, tmp)}  (mark ${HERO_MARK} px)`);
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
