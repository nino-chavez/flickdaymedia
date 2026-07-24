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
// Eight faces. Ordered by the current design read — Config, Schibsted, Peridot
// to advance, Roc as reserve, then the four kept for contrast. `hand` (kd/ck)
// is the large-size fix, `wmTrack` the small-size one at 15px. Roc's kd was
// pulled back from -0.045 (read too tight) to -0.025; Peridot from -0.035 to
// -0.03. These are still provisional — the real tuning is the kd/ck/track
// matrix once the field is down to the final few.
const FACES = [
  { id: 'config', label: 'Config 900', cssFamily: 'config-variable', weight: 900, kit: true, hand: [0, 0, 0, 0.01, -0.035, 0, 0], wmTrack: 0.03 },
  {
    id: 'schibsted',
    label: 'Schibsted Grotesk 900',
    google: 'Schibsted+Grotesk:wght@900',
    cssFamily: null,
    weight: 900,
    hand: [0.01, 0, 0, 0.012, -0.05, 0, 0],
    wmTrack: 0.02,
  },
  { id: 'peridot', label: 'Peridot PE 950', cssFamily: 'peridot-pe-variable', weight: 950, kit: true, hand: [0, 0, 0, 0.01, -0.03, 0, 0], wmTrack: 0.03 },
  {
    id: 'roc',
    label: 'Roc Grotesk (normal)',
    cssFamily: 'roc-grotesk-variable',
    weight: 800,
    kit: true,
    variation: "'wdth' 104",
    hand: [0, 0, 0, 0.012, -0.025, 0, -0.01],
    wmTrack: 0.035,
  },
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

// Ink height per face at a chosen font-size, measured by rasterising and
// counting lit pixel rows. Runs on a DEDICATED deviceScaleFactor:1 page: the
// box coordinates come from getBoundingClientRect (CSS px), so the screenshot
// canvas must be 1:1 with CSS px or the scan window lands on the wrong rows —
// which on the old dsf:2 page silently mixed each face with its neighbour and
// halved the real sizes. Each face gets a tall, well-separated band so no
// face's ink can bleed into another's scan window.
async function measureAt(browser, faces, sizeFor) {
  const page = await browser.newPage({ viewport: { width: 2000, height: 400 }, deviceScaleFactor: 1 });
  const probes = faces
    .map(
      (f) =>
        `<div class="m" data-id="${f.id}" style="font-size:${sizeFor(f).toFixed(3)}px;font-family:'${f.cssFamily}';` +
        `font-weight:${f.weight};font-optical-sizing:none${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</div>`,
    )
    .join('');
  await page.setContent(
    `${KIT_LINKS}<style>${faces.map((f) => f.css ?? '').join('\n')}
     *{margin:0;padding:0}body{background:#000}.m{color:#fff;line-height:3;white-space:nowrap;height:640px;display:flex;align-items:center}</style>${probes}`,
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
  const shot = (await page.screenshot({ fullPage: true })).toString('base64');
  await page.close();

  const ink = await (await browser.newPage()).evaluate(
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
  return ink;
}

const measureInk = (browser, faces) => measureAt(browser, faces, () => 200);

// Exact font-size each face needs to hit each target ink height. Linear
// scaling from one 200px measurement drifts 1-2px at small sizes because the
// antialias fringe is a near-constant pixel, not a constant fraction. Start
// from the linear estimate, measure, correct until within a pixel.
async function calibrateSizes(browser, faces, targets) {
  const sizes = Object.fromEntries(faces.map((f) => [f.id, {}]));
  for (const [name, target] of Object.entries(targets)) {
    const est = Object.fromEntries(faces.map((f) => [f.id, (200 * target) / f.ink200]));
    for (let pass = 0; pass < 4; pass++) {
      const measured = await measureAt(browser, faces, (f) => est[f.id]);
      let anyOff = false;
      for (const f of faces) {
        const m = measured[f.id];
        if (Math.abs(m - target) > 1) {
          est[f.id] *= target / m;
          anyOff = true;
        }
      }
      if (!anyOff) break;
    }
    for (const f of faces) sizes[f.id][name] = est[f.id];
  }
  return sizes;
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

  const ink = await measureInk(browser, FACES);
  for (const f of FACES) f.ink200 = ink[f.id];
  console.log('  ink@200: ' + FACES.map((f) => `${f.id}=${ink[f.id]}`).join(' '));

  const sizes = await calibrateSizes(browser, FACES, TARGETS);
  for (const f of FACES) f.sizes = sizes[f.id];

  // Verify each target on the calibrated sizes the sheet actually uses.
  for (const [name, target] of Object.entries(TARGETS)) {
    const got = await measureAt(browser, FACES, (f) => f.sizes[name]);
    const off = Object.entries(got).filter(([, v]) => Math.abs(v - target) > 1);
    if (off.length) {
      throw new Error(`${name} not normalised to ${target}px: ${off.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    }
    console.log(`  verified ${name}@${target}px: ${Object.entries(got).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }

  const fontFaces = FACES.map((f) => f.css ?? '').join('\n');
  const page = await browser.newPage({ viewport: { width: 3200, height: 900 }, deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_survivors.html'), sheet(fontFaces));
  await page.goto(pathToFileURL(join(OUT, '_survivors.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Landscape sheet: size the viewport to the full content so the screenshot
  // captures the whole left-to-right strip, and the height stays a MacBook
  // viewport's worth so it fills the screen and scrolls sideways.
  const { w, h } = await page.evaluate(() => ({
    w: document.body.scrollWidth,
    h: document.body.scrollHeight,
  }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'survivors.png') });
  await browser.close();
  console.log(`✓ survivors.png  ${w}x${h}`);
}

// The intended-use sizes, from the live site. Used for both the sheet and the
// post-render verification.
const TARGETS = { header: 40, mob: 30, wm: 15, app: 32 };

function sheet(fontFaces) {
  // Landscape: fonts are columns, intended uses are rows, sized to fill a
  // MacBook viewport height and scroll left-to-right. Reading across any use
  // row compares all eight faces in that context; the whole set of uses for
  // one face is a single column. Production spacing throughout.
  const word = (f, target, track = 0) =>
    `<div class="w" style="font-size:${f.sizes[target].toFixed(3)}px${
      track ? `;letter-spacing:${track}em` : ''
    }">${spans(f.cssFamily, f.weight, f.variation, f.hand)}</div>`;

  // One master wordmark, not a font per use. Role, not a row-winner ranking:
  // the lower tiers are dimmed so the eye prioritises the master candidates,
  // but nothing is cut — all eight stay on the sheet.
  const TIER = { config: 'master', schibsted: 'challenger', peridot: 'alternative', roc: 'reserve' };
  const tierOf = (f) => TIER[f.id] ?? 'contrast';

  const cols = (cellFor) =>
    FACES.map((f) => `<div class="fc t-${tierOf(f)}">${cellFor(f)}</div>`).join('');

  const colHead = FACES.map(
    (f, i) => `<div class="fc head t-${tierOf(f)}">
      <div class="rank">${i + 1} · ${tierOf(f).toUpperCase()}</div>
      <div class="fname">${f.label}</div>
    </div>`,
  ).join('');
  const headerRow = cols((f) => `<div class="dark">${word(f, 'header')}</div>`);
  const mobRow = cols((f) => `<div class="dark">${word(f, 'mob')}</div>`);
  const wmRow = cols((f) => `<div class="frame">${word(f, 'wm', f.wmTrack)}</div>`);
  const appRow = cols((f) => `<div class="chip">${word(f, 'app')}</div>`);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}<style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{background:#0f0f12;color:#fff;font-family:ui-monospace,monospace;width:max-content;padding:30px 34px}
h1{color:${YELLOW};font-size:19px;margin-bottom:3px}
.sub{font-size:12px;opacity:.6;margin-bottom:16px;line-height:1.5;max-width:1180px}
.grid{display:flex;flex-direction:column}
.hrow{display:flex;align-items:stretch;border-bottom:1px solid #1c1c22}
.hrow.chead{border-bottom:1px solid #34343d}
.rl{width:132px;flex:none;display:flex;flex-direction:column;justify-content:center;
  font-size:10px;text-transform:uppercase;letter-spacing:.08em;opacity:.5;line-height:1.5;
  border-right:1px solid #26262e;padding-right:14px}
.fc{width:340px;flex:none;display:flex;align-items:center;padding:0 20px;border-left:1px solid #1c1c22}
.fc.head{flex-direction:column;align-items:flex-start;justify-content:center;line-height:1.3;padding:10px 20px;gap:3px}
.fc.head .rank{font-size:9px;text-transform:uppercase;letter-spacing:.1em;opacity:.6}
.fc.head .fname{font-size:12px;color:${YELLOW}}
/* Role tiers: master candidates full strength, the rest progressively dimmed. */
.fc.t-reserve{opacity:.72}
.fc.t-contrast{opacity:.46}
.fc.head.t-master .rank{color:${YELLOW};opacity:.95}
.chead{height:58px}
.r-header{height:150px}
.r-mob{height:104px}
.r-wm{height:242px}
.r-app{height:150px}
.dark .w,.w{color:${YELLOW};line-height:1;white-space:nowrap}
.frame{width:300px;height:186px;border-radius:6px;overflow:hidden;position:relative;
  background:linear-gradient(115deg,#3d4a58,#6b7a63 40%,#242a31 75%,#4a4038);
  display:flex;align-items:flex-end;justify-content:flex-end;padding:9px 11px}
.frame .w{color:#fff;opacity:.78}
.chip{display:inline-flex;align-items:center;justify-content:center;background:${GARMENT_LIGHT};
  border-radius:7px;padding:14px 22px;min-width:296px;height:104px}
.chip .w{color:${INK}}
</style></head><body>
<h1>flickday — one master wordmark, eight candidates (scroll →)</h1>
<div class="sub">
  Choosing ONE wordmark used across every application — standard and micro optical cuts of a single face, not a
  different font per use. Read <b>down</b> a column: it is one face at every size, so the real test is whether its
  <b>weakest</b> row still holds, not whoever wins a single row. Master candidates are full strength; reserve and
  contrast faces are dimmed but kept. Production spacing (kd by hand, watermark tracked); every specimen its true
  CSS size, DPR-1 measured and verified after render.
</div>
<div class="grid">
  <div class="hrow chead"><div class="rl"></div>${colHead}</div>
  <div class="hrow r-header"><div class="rl">Header<br>40px</div>${headerRow}</div>
  <div class="hrow r-mob"><div class="rl">Mobile<br>30px</div>${mobRow}</div>
  <div class="hrow r-wm"><div class="rl">Watermark<br>15px</div>${wmRow}</div>
  <div class="hrow r-app"><div class="rl">Apparel<br>32px</div>${appRow}</div>
</div>
</body></html>`;
}

await main();
