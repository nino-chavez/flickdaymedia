/**
 * Wordmark finish — the three finalists, native beside a by-hand kerning fix.
 *
 * Nino's three: Roc Grotesk (normal width), Schibsted Grotesk 900, Sora 800.
 * The blind phase is over, so these are labelled — the remaining call is
 * per-face and needs identity.
 *
 * The only correction here is the one held back all along: kd runs open and
 * ck runs a touch tight in the raw metrics of every one of these. Round 1's
 * algorithm over-read that and drove kd to -0.11em, twice the ck move. This
 * closes kd by hand and by eye, modestly, per face — and shows native beside
 * corrected at real size so the fix is judged, not asserted.
 *
 * HAND offsets are in em, one per inter-letter gap of "flickday":
 *   [ f|l , l|i , i|c , c|k , k|d , d|a , a|y ]
 * Negative closes a pair, positive opens it. Tuned by looking at the render,
 * not computed.
 *
 *   node scripts/wordmark-survivors.mjs
 *     → flickday-assets/wordmarks/survivors.png
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');
const WORD = 'flickday';
const YELLOW = '#facc15';
const INK = '#111318';
const GARMENT_LIGHT = '#e8e4dc';
// Two kits now: tgm3xnd carries Roc and Bebas; fju5pyz the eight variable
// display faces. Family names are distinct across both, so linking both is
// safe. Google (Schibsted) is fetched and embedded as before.
const KITS = ['https://use.typekit.net/tgm3xnd.css', 'https://use.typekit.net/fju5pyz.css'];
const KIT_LINKS = KITS.map((u) => `<link rel="stylesheet" href="${u}">`).join('');

// Gap labels, for reference: [f|l, l|i, i|c, c|k, k|d, d|a, a|y]
// All ten survivors in the card treatment: the three finalists (Roc,
// Schibsted, Bebas) plus the seven new-kit faces that outlived Varietta —
// including the three I'd have cut, at Nino's call. `hand` (kd/ck) is the
// large-size fix, `wmTrack` the small-size one at 15px. For the new-kit faces
// the values are provisional starting points, tuned per face on the winner.
const FACES = [
  // --- the three finalists ---
  {
    id: 'roc',
    label: 'Roc Grotesk (normal)',
    cssFamily: 'roc-grotesk-variable',
    weight: 800,
    kit: true,
    variation: "'wdth' 104",
    hand: [0, 0, 0, 0.012, -0.045, 0, -0.01],
    wmTrack: 0.035,
  },
  {
    id: 'schibsted',
    label: 'Schibsted Grotesk 900',
    google: 'Schibsted+Grotesk:wght@900',
    cssFamily: null,
    weight: 900,
    hand: [0.01, 0, 0, 0.012, -0.05, 0, 0],
    wmTrack: 0.02,
  },
  // --- new kit (fju5pyz), heaviest instance, kd/track provisional ---
  { id: 'config', label: 'Config 900', cssFamily: 'config-variable', weight: 900, kit: true, hand: [0, 0, 0, 0.01, -0.035, 0, 0], wmTrack: 0.03 },
  { id: 'peridot', label: 'Peridot PE 950', cssFamily: 'peridot-pe-variable', weight: 950, kit: true, hand: [0, 0, 0, 0.01, -0.035, 0, 0], wmTrack: 0.03 },
  { id: 'latino', label: 'Latino Gothic 100 (axis max, wide)', cssFamily: 'latino-gothic-variable', weight: 100, kit: true, hand: [0, 0, 0, 0.008, -0.03, 0, 0], wmTrack: 0.035 },
  { id: 'nextexit', label: 'Next Exit 900', cssFamily: 'nextexit-variable', weight: 900, kit: true, hand: [0, 0, 0, 0.01, -0.035, 0, 0], wmTrack: 0.03 },
  { id: 'bananas', label: 'Bananas 800 (axis max)', cssFamily: 'bananas-variable', weight: 800, kit: true, hand: [0, 0, 0, 0.01, -0.03, 0, 0], wmTrack: 0.03 },
  { id: 'ivyepic', label: 'IvyEpic 900', cssFamily: 'ivyepic-variable', weight: 900, kit: true, hand: [0, 0, 0, 0.01, -0.03, 0, 0], wmTrack: 0.03 },
];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function fetchFace(google) {
  const url = `https://fonts.googleapis.com/css2?family=${google}&display=block`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map(
    ([, subset, body]) => ({ subset, body }),
  );
  const latin = blocks.find((b) => b.subset === 'latin') ?? blocks.at(-1);
  const src = /url\((https:[^)]+\.woff2)\)/.exec(latin.body);
  return Buffer.from(await (await fetch(src[1])).arrayBuffer()).toString('base64');
}

/** One word as per-letter spans, with an em offset applied to each gap. */
function spans(cssFamily, weight, variation, hand) {
  return [...WORD]
    .map((ch, i) => {
      const gap = i > 0 && hand[i - 1] ? `margin-left:${hand[i - 1]}em;` : '';
      const v = variation ? `font-variation-settings:${variation};` : '';
      return `<span style="font-family:'${cssFamily}';font-weight:${weight};font-optical-sizing:none;${v}${gap}">${ch}</span>`;
    })
    .join('');
}

async function measureInk(page, faces) {
  const probes = faces
    .map(
      (f) =>
        `<div class="m" data-id="${f.id}" style="font-size:200px;font-family:'${f.cssFamily}';` +
        `font-weight:${f.weight};font-optical-sizing:none${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</div>`,
    )
    .join('');
  await page.setContent(
    `${KIT_LINKS}<style>${faces.map((f) => f.css ?? '').join('\n')}
     *{margin:0;padding:0}body{background:#000}.m{color:#fff;line-height:2.4;white-space:nowrap;height:520px}</style>${probes}`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready);
  const control = await page.evaluate((w) => {
    const s = document.createElement('span');
    s.textContent = w;
    s.style.cssText = 'position:absolute;visibility:hidden;font:200px serif';
    document.body.appendChild(s);
    return s.getBoundingClientRect().width;
  }, WORD);
  const widths = await page.evaluate(
    ([w, faces]) =>
      faces.map((f) => {
        const s = document.createElement('span');
        s.textContent = w;
        s.style.cssText = `position:absolute;visibility:hidden;font-size:200px;font-family:'${f.cssFamily}',serif;font-weight:${f.weight}`;
        document.body.appendChild(s);
        return { id: f.id, width: s.getBoundingClientRect().width };
      }),
    [WORD, faces.map((f) => ({ id: f.id, cssFamily: f.cssFamily, weight: f.weight }))],
  );
  const fellBack = widths.filter((x) => Math.abs(x.width - control) < 0.5).map((x) => x.id);
  if (fellBack.length) throw new Error(`Fell back to serif: ${fellBack.join(', ')}`);

  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('.m')].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.id, top: Math.round(r.top), bottom: Math.round(r.bottom) };
    }),
  );
  const shot = (
    await page.screenshot({ fullPage: true, clip: undefined })
  ).toString('base64');
  const ink = await page.evaluate(
    async ([b64, boxes]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const out = {};
      for (const b of boxes) {
        let first = null,
          last = null;
        for (let y = Math.max(0, b.top); y < Math.min(cv.height, b.bottom); y++) {
          let lit = false;
          for (let x = 0; x < cv.width; x++)
            if (d[(y * cv.width + x) * 4] > 40) {
              lit = true;
              break;
            }
          if (lit) {
            if (first === null) first = y;
            last = y;
          }
        }
        out[b.id] = first === null ? null : last - first + 1;
      }
      return out;
    },
    [shot, boxes],
  );
  return ink; // px at 200
}

async function main() {
  for (const f of FACES) {
    if (f.google) {
      const b64 = await fetchFace(f.google);
      f.cssFamily = f.id;
      f.css = `@font-face{font-family:'${f.id}';font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
    }
    console.log(`  ready ${f.label}`);
  }

  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });

  const ink = await measureInk(page, FACES);
  for (const f of FACES) f.size = (h) => (200 * h) / ink[f.id]; // font-size for ink height h
  console.log('  ink@200: ' + FACES.map((f) => `${f.id}=${ink[f.id]}`).join(' '));

  const fontFaces = FACES.map((f) => f.css ?? '').join('\n');
  writeFileSync(join(OUT, '_finish.html'), sheet(fontFaces));
  await page.goto(pathToFileURL(join(OUT, '_finish.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1600, height: h });
  await page.screenshot({ path: join(OUT, 'survivors.png') });
  await browser.close();
  console.log(`✓ survivors.png  1600x${h}`);
}

function sheet(fontFaces) {
  // Large comparison (native vs hand) so the kd move is visible, then the two
  // sizes where it actually has to hold: 40px header and 15px watermark.
  const card = (f) => {
    const big = (hand) =>
      `<div class="big">${spans(f.cssFamily, f.weight, f.variation, hand)}</div>`;
    const at = (px, hand, cls = '', track = 0) =>
      `<div class="${cls}" style="font-size:${f.size(px).toFixed(3)}px${
        track ? `;letter-spacing:${track}em` : ''
      }">${spans(f.cssFamily, f.weight, f.variation, hand)}</div>`;
    const zero = [0, 0, 0, 0, 0, 0, 0];
    return `
    <section class="card">
      <h2>${f.label}<span class="hand">hand: ck ${f.hand[3] >= 0 ? '+' : ''}${f.hand[3]}em · kd ${f.hand[4]}em${
        f.hand[0] ? ` · fl +${f.hand[0]}em` : ''
      }${f.hand[6] ? ` · ay ${f.hand[6]}em` : ''}</span></h2>
      <div class="cmp">
        <div class="col"><div class="tag">native</div>${big(zero)}</div>
        <div class="col"><div class="tag">hand-corrected</div>${big(f.hand)}</div>
      </div>
      <div class="uses">
        <div class="u"><div class="tag">header 40px · native</div>${at(40, zero, 'hd')}</div>
        <div class="u"><div class="tag">header 40px · corrected</div>${at(40, f.hand, 'hd')}</div>
        <div class="u wm"><div class="tag">watermark 15px · native</div><div class="frame">${at(
          15,
          zero,
          'w',
        )}</div></div>
        <div class="u wm"><div class="tag">watermark 15px · tracked +${f.wmTrack}em</div><div class="frame">${at(
          15,
          f.hand,
          'w',
          f.wmTrack,
        )}</div></div>
      </div>
      <div class="app"><div class="tag dark">apparel 32px · corrected</div><div class="chip" style="font-size:${f
        .size(32)
        .toFixed(3)}px">${spans(f.cssFamily, f.weight, f.variation, f.hand)}</div></div>
    </section>`;
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}<style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{background:#0f0f12;color:#fff;font-family:ui-monospace,monospace;width:1600px;padding:44px 52px}
h1{color:${YELLOW};font-size:22px;margin-bottom:6px}
.sub{font-size:13px;opacity:.62;margin-bottom:26px;line-height:1.55;max-width:1000px}
.card{border:1px solid #23232a;border-radius:11px;padding:24px 26px;margin-bottom:20px}
h2{font-size:15px;color:${YELLOW};font-weight:400;margin-bottom:18px;display:flex;align-items:baseline;gap:14px}
.hand{font-size:11px;opacity:.5;color:#fff}
.tag{font-size:10px;opacity:.45;text-transform:uppercase;letter-spacing:.09em;margin-bottom:10px}
.tag.dark{opacity:.55}
.cmp{display:flex;gap:44px;padding-bottom:20px;border-bottom:1px solid #1e1e24;margin-bottom:20px}
.col{flex:1}
.big{font-size:92px;color:${YELLOW};line-height:1.15;white-space:nowrap}
.uses{display:flex;gap:30px;align-items:flex-start;flex-wrap:wrap}
.u{flex:none}
.hd{color:${YELLOW};line-height:1;white-space:nowrap}
.frame{width:300px;height:169px;border-radius:6px;overflow:hidden;position:relative;
  background:linear-gradient(115deg,#3d4a58,#6b7a63 40%,#242a31 75%,#4a4038);
  display:flex;align-items:flex-end;justify-content:flex-end;padding:9px 11px}
.w{color:#fff;opacity:.78;line-height:1;white-space:nowrap}
.app{margin-top:20px}
.chip{display:inline-flex;align-items:center;justify-content:center;background:${GARMENT_LIGHT};
  color:${INK};border-radius:7px;padding:16px 26px;line-height:1;white-space:nowrap}
</style></head><body>
<h1>flickday — all ten survivors in the card treatment</h1>
<div class="sub">
  Every face still standing: the three finalists (Roc, Schibsted, Bebas) and the seven new-kit faces that outlived
  Varietta &mdash; including the three I read as weaker (Bananas, IvyEpic, Next Exit), kept here at your call. Each in
  the full treatment: 92px native vs by-hand kd, then 40px header, 15px watermark (native vs tracked), 32px apparel.
  For the new-kit faces the kd/track values are provisional starting points &mdash; tuned per face on whichever wins.
</div>
${FACES.map(card).join('')}
</body></html>`;
}

await main();
