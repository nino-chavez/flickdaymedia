/**
 * Finalist round for the forge-brand `wordmark` gate — real size, optically spaced.
 *
 * Three changes from the specimen sheet:
 *
 *   1. Real size. The live site sets .site-header__logo to 30/34/40px tall,
 *      so the header wordmark is a ~40px object, not the 54px the specimen
 *      sheet showed. Every row here is scaled by measured ink height to the
 *      size it will actually be used at.
 *   2. Optically spaced, by measurement. Default font metrics space letters
 *      by advance width, which leaves round-to-round pairs (d-a) visibly
 *      tight and diagonal-to-round pairs (k-d) visibly loose. This computes
 *      the white area in each inter-letter gap and shifts letters until the
 *      gaps are equal, then shows default and spaced side by side so the
 *      adjustment is visible rather than asserted.
 *   3. No incumbent beside the candidates. Ruling of 2026-07-22: no shipped
 *      outline is canonical. Systems A-D appear once, at the bottom, in a
 *      labelled legacy appendix — evidence of drift, not a target.
 *
 *   node scripts/wordmark-finalists.mjs
 *     → flickday-assets/wordmarks/finalists.png
 *     → flickday-assets/wordmarks/finalists-spacing.json
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');
const WORD = 'flickday';
const YELLOW = '#facc15';

// Carried by the ledger entry of 2026-07-22, in Nino's stated order.
const FINALISTS = [
  ['W-S06', 'Sora', 800],
  ['W-S10', 'Rubik', 800],
  ['W-S08', 'Figtree', 900],
];

// Legacy appendix only. Not comparison targets.
const LEGACY = [
  ['A', 'modular set · font-derived', ['brand', 'modular-wordmarks', 'flickday-core-color.svg']],
  ['B', 'traced play mark', ['wordmarks', 'wordmark-play.svg']],
  ['C', 'traced reel mark', ['brand', 'wordmark-reel.svg']],
  ['D', 'traced twotone mark', ['brand', 'wordmark-twotone.svg']],
];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function fetchFace(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=block`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map(
    ([, subset, body]) => ({ subset, body }),
  );
  const latin = blocks.find((b) => b.subset === 'latin') ?? blocks.at(-1);
  const src = /url\((https:[^)]+\.woff2)\)/.exec(latin.body);
  const buf = Buffer.from(await (await fetch(src[1])).arrayBuffer());
  return buf.toString('base64');
}

function legacyUris() {
  return LEGACY.map(([code, label, rel]) => {
    const p = join(ROOT, 'flickday-assets', ...rel);
    if (!existsSync(p)) throw new Error(`Legacy asset missing: ${p}`);
    const svg = readFileSync(p, 'utf-8').replace(/(fill=")(?!none)[^"]*(")/g, `$1${YELLOW}$2`);
    return { code, label, uri: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') };
  });
}

/**
 * Equalise the optical gaps in one word, in the page.
 *
 * Advance widths space letters by their own side bearings, which is why
 * `da` closes up and `kd` opens out in every one of these faces. This
 * measures the actual white area between adjacent letter silhouettes —
 * only over the rows where both letters have ink, so an ascender does not
 * count as a gap — and nudges each pair toward the median until they match.
 *
 * Returns per-pair offsets in em, so they scale to any size.
 */
const OPTICAL_FN = `
async function opticalOffsets(family, weight, word) {
  const SIZE = 400, PAD = 200;
  const cv = document.createElement('canvas');
  cv.width = SIZE * word.length; cv.height = SIZE * 2;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const font = weight + ' ' + SIZE + 'px "' + family + '"';

  // Setting ctx.font does not load a face — it silently resolves to the
  // fallback, and three different families then measure identically. Load
  // it explicitly, then prove it is in use before measuring anything.
  await document.fonts.load(font, word);
  ctx.font = font;
  const mine = ctx.measureText(word).width;
  ctx.font = weight + ' ' + SIZE + 'px serif';
  if (Math.abs(mine - ctx.measureText(word).width) < 0.5) {
    throw new Error('Canvas fell back to serif for ' + family);
  }

  // Ink silhouette of one letter: per-row leftmost and rightmost ink columns.
  function silhouette(ch) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.font = font; ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(ch, PAD, SIZE * 1.4);
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const left = new Array(cv.height).fill(Infinity);
    const right = new Array(cv.height).fill(-Infinity);
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        if (d[(y * cv.width + x) * 4 + 3] > 128) {
          if (x < left[y]) left[y] = x;
          if (x > right[y]) right[y] = x;
        }
      }
    }
    ctx.font = font;
    return { left, right, advance: ctx.measureText(ch).width, origin: PAD };
  }

  const sil = [...word].map(silhouette);

  // Gap area between letter i and i+1 given an extra shift, counted only on
  // rows where both have ink.
  function gapArea(i, shift) {
    const a = sil[i], b = sil[i + 1];
    // b sits at a.origin + a.advance + shift in the assembled word
    const bShift = a.origin + a.advance + shift - b.origin;
    let area = 0, rows = 0;
    for (let y = 0; y < a.right.length; y++) {
      if (a.right[y] < 0 || b.left[y] === Infinity) continue;
      area += (b.left[y] + bShift) - a.right[y];
      rows++;
    }
    return { area, rows };
  }

  // Closest approach between two letters, over rows where both have ink.
  // Equal average area is not enough on its own: k and d enclose a deep
  // concave wedge, so area-matching alone kept tightening that pair until
  // the leg of the k crossed the bowl of the d. Perceived spacing is area,
  // but collision is distance, and distance wins.
  function minGap(i, shift) {
    const a = sil[i], b = sil[i + 1];
    const bShift = a.origin + a.advance + shift - b.origin;
    let m = Infinity;
    for (let y = 0; y < a.right.length; y++) {
      if (a.right[y] < 0 || b.left[y] === Infinity) continue;
      const g = (b.left[y] + bShift) - a.right[y];
      if (g < m) m = g;
    }
    return m === Infinity ? 0 : m;
  }

  const MIN_CLEARANCE = SIZE * 0.028; // em-relative floor on closest approach

  const shifts = new Array(word.length - 1).fill(0);
  let gaps = shifts.map((s, i) => gapArea(i, s));
  for (let pass = 0; pass < 24; pass++) {
    const per = gaps.map((g) => g.area / Math.max(1, g.rows));
    const sorted = [...per].sort((x, y) => x - y);
    const target = sorted[Math.floor(sorted.length / 2)];
    for (let i = 0; i < shifts.length; i++) {
      shifts[i] += (target - per[i]) * 0.6;
      const m = minGap(i, shifts[i]);
      if (m < MIN_CLEARANCE) shifts[i] += MIN_CLEARANCE - m;
    }
    gaps = shifts.map((s, i) => gapArea(i, s));
  }
  return shifts.map((s) => s / SIZE); // em
}
`;

/** One word, letters positioned by advance + optional per-pair offsets. */
const RENDER_FN = `
function wordHtml(code, word, offsets) {
  return [...word].map((ch, i) =>
    '<span style="font-family:\\'' + code + '\\';' +
    (offsets && i > 0 ? 'margin-left:' + offsets[i - 1].toFixed(4) + 'em;' : '') +
    '">' + ch + '</span>'
  ).join('');
}
`;

async function main() {
  const faces = [];
  for (const [id, family, weight] of FINALISTS) {
    faces.push({ id, family, weight, b64: await fetchFace(family, weight) });
    console.log(`  fetched ${family} ${weight}`);
  }

  const fontFaces = faces
    .map(
      (f) =>
        `@font-face{font-family:'${f.id}';font-weight:${f.weight};font-display:block;` +
        `src:url(data:font/woff2;base64,${f.b64}) format('woff2')}`,
    )
    .join('\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });

  // Measure spacing first, on a bare page, then build the sheet with it.
  await page.setContent(`<style>${fontFaces}</style><div>x</div>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ content: OPTICAL_FN });

  const spacing = {};
  for (const f of faces) {
    spacing[f.id] = await page.evaluate(
      ([id, weight, word]) => opticalOffsets(id, weight, word),
      [f.id, f.weight, WORD],
    );
    const em = spacing[f.id].map((v) => v.toFixed(3)).join(' ');
    console.log(`  spaced ${f.family}: ${em}`);
  }

  // Three faces with different letterforms cannot want identical spacing.
  // If they do, something upstream measured a shared fallback.
  const fingerprints = new Set(Object.values(spacing).map((v) => v.map((x) => x.toFixed(4)).join()));
  if (fingerprints.size !== faces.length) {
    throw new Error('Two finalists produced identical optical offsets — a face was not measured');
  }

  const legacy = legacyUris();
  const html = sheet(faces, fontFaces, spacing, legacy);
  const tmp = join(OUT, '_finalists.html');
  writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const fellBack = await page.evaluate((word) => {
    const measure = (fam) => {
      const el = document.createElement('span');
      el.textContent = word;
      el.style.cssText = `position:absolute;visibility:hidden;font-size:200px;font-family:${fam}`;
      document.body.appendChild(el);
      const w = el.getBoundingClientRect().width;
      el.remove();
      return w;
    };
    const control = measure('serif');
    return [...document.fonts]
      .map((f) => f.family)
      .filter((fam) => Math.abs(measure(`'${fam}',serif`) - control) < 0.5);
  }, WORD);
  if (fellBack.length) throw new Error(`Faces fell back to serif: ${fellBack.join(', ')}`);

  await page.waitForFunction(() => document.documentElement.dataset.sized === '1');
  if (!(await page.evaluate(() => window.__sizingOk))) {
    throw new Error('Finalists were sized identically — canvas metrics used a fallback face');
  }

  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1400, height: h });
  await page.screenshot({ path: join(OUT, 'finalists.png') });
  await browser.close();
  console.log(`✓ finalists.png  1400x${h}`);

  writeFileSync(
    join(OUT, 'finalists-spacing.json'),
    JSON.stringify(
      {
        note: 'Per-pair optical offsets in em, measured by equalising inter-letter white area. Pairs are fl li ic ck kd da ay.',
        word: WORD,
        finalists: faces.map((f) => ({
          id: f.id,
          family: f.family,
          weight: f.weight,
          offsetsEm: spacing[f.id].map((v) => +v.toFixed(4)),
        })),
      },
      null,
      2,
    ),
  );
  console.log('✓ finalists-spacing.json');
}

function sheet(faces, fontFaces, spacing, legacy) {
  const off = (id) => JSON.stringify(spacing[id]);

  // Sizes taken from the live site and BRAND-PRIORS, not chosen here.
  const block = (f) => `
  <section class="card">
    <h2>${f.id} · ${f.family} ${f.weight}</h2>
    <div class="pair">
      <div class="col">
        <div class="tag">default metrics</div>
        <div class="hdr" data-w="${f.id}"></div>
        <div class="hdr sm" data-w="${f.id}"></div>
      </div>
      <div class="col">
        <div class="tag">optically spaced</div>
        <div class="hdr" data-w="${f.id}" data-off='${off(f.id)}'></div>
        <div class="hdr sm" data-w="${f.id}" data-off='${off(f.id)}'></div>
      </div>
    </div>
    <div class="uses">
      <div class="use">
        <div class="tag">header · 40px tall (desktop)</div>
        <div class="hd40" data-w="${f.id}" data-off='${off(f.id)}'></div>
      </div>
      <div class="use">
        <div class="tag">header · 30px tall (mobile)</div>
        <div class="hd30" data-w="${f.id}" data-off='${off(f.id)}'></div>
      </div>
      <div class="use shot">
        <div class="tag">watermark · 11% of 1920 frame</div>
        <div class="frame"><span class="wm" data-w="${f.id}" data-off='${off(f.id)}'></span></div>
      </div>
      <div class="use">
        <div class="tag">32px favicon band</div>
        <div class="fav" data-w="${f.id}" data-off='${off(f.id)}'></div>
      </div>
    </div>
  </section>`;

  const legacyRows = legacy
    .map(
      (l) => `
    <div class="lrow">
      <div class="lcode">system ${l.code}</div>
      <div class="llbl">${l.label}</div>
      <img src="${l.uri}" style="height:40px">
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{background:#0f0f12;color:#fff;font-family:ui-monospace,monospace;width:1400px;padding:44px 48px}
h1{color:${YELLOW};font-size:22px;margin-bottom:4px}
.sub{font-size:13px;opacity:.6;margin-bottom:26px;line-height:1.55}
.card{border:1px solid #23232a;border-radius:10px;padding:22px 24px;margin-bottom:18px}
h2{font-size:14px;color:${YELLOW};margin-bottom:16px;font-weight:400}
.tag{font-size:10px;opacity:.45;text-transform:uppercase;letter-spacing:.09em;margin-bottom:9px}
.pair{display:flex;gap:34px;padding-bottom:20px;border-bottom:1px solid #1e1e24;margin-bottom:18px}
.col{flex:1}
.hdr{font-size:58px;line-height:1.25;color:${YELLOW};white-space:nowrap}
.hdr.sm{font-size:22px;margin-top:2px}
.uses{display:flex;gap:26px;align-items:flex-start}
.use{flex:none}
.hd40,.hd30,.fav{color:${YELLOW};white-space:nowrap;line-height:1}
.frame{width:300px;height:169px;border-radius:5px;overflow:hidden;position:relative;
  background:linear-gradient(115deg,#3d4a58,#6b7a63 40%,#242a31 75%,#4a4038);
  display:flex;align-items:flex-end;justify-content:flex-end;padding:8px 9px}
.wm{color:#fff;opacity:.75;white-space:nowrap;line-height:1}
.appendix{margin-top:30px;border-top:1px dashed #33333c;padding-top:22px}
.appendix h2{color:#8a8a93}
.anote{font-size:12px;opacity:.5;line-height:1.55;margin-bottom:18px;max-width:900px}
.lrow{display:flex;align-items:center;gap:22px;padding:12px 0;border-bottom:1px solid #1c1c22;opacity:.55}
.lcode{width:88px;font-size:11px;opacity:.7}
.llbl{width:230px;font-size:11px;opacity:.7}
</style></head><body>
<h1>flickday — wordmark finalists, real size</h1>
<div class="sub">
  Three carried from the wordmark gate. Sizes are the live site's own (.site-header__logo is 30/34/40px)
  and BRAND-PRIORS' watermark spec (9-13% of frame width), not sizes picked to flatter the type.<br>
  Optical offsets were measured, not eyeballed: the white area in each inter-letter gap is counted over
  the rows where both letters have ink, then equalised. Per-pair values are in finalists-spacing.json.
</div>
${faces.map(block).join('')}
<section class="appendix">
  <h2>legacy appendix — not comparison targets</h2>
  <div class="anote">
    Ruling of 2026-07-22: no shipped Flickday wordmark outline is canonical. These four are forensic
    evidence of type drift, kept here so the drift stays visible and out of the comparison above.
    Continuity comes from the lowercase name, yellow-on-black, the voice and the flick concept.
  </div>
  ${legacyRows}
</section>
<script>
const WORD_TEXT = ${JSON.stringify(WORD)};
const WEIGHTS = ${JSON.stringify(Object.fromEntries(faces.map((f) => [f.id, f.weight])))};
${RENDER_FN}
// "40px tall" has to mean the glyphs measure 40px, not that font-size is 40
// and the real mark is whatever falls out — the live site sizes the logo by
// its rendered height, so a sheet claiming real size must match that.
// TextMetrics' actualBoundingBox gives true ink extents; a line box does not.
const _mctx = document.createElement('canvas').getContext('2d');
function inkHeightAt(family, weight, word, sizePx) {
  _mctx.font = weight + ' ' + sizePx + 'px "' + family + '"';
  const m = _mctx.measureText(word);
  return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
}
function fitToInk(el, targetPx) {
  const family = el.dataset.w;
  const weight = WEIGHTS[family];
  const at100 = inkHeightAt(family, weight, WORD_TEXT, 100);
  el.style.fontSize = (100 * targetPx) / at100 + 'px';
}
for (const el of document.querySelectorAll('[data-w]')) {
  const code = el.dataset.w;
  const offsets = el.dataset.off ? JSON.parse(el.dataset.off) : null;
  el.innerHTML = wordHtml(code, WORD_TEXT, offsets);
}
// Canvas metrics before the faces finish loading return the fallback's
// numbers, and every finalist then gets sized identically. Wait, size, and
// then refuse to render a sheet whose sizes came out suspiciously equal.
document.fonts.ready.then(() => {
  document.querySelectorAll('.hd40').forEach(e => fitToInk(e, 40));
  document.querySelectorAll('.hd30').forEach(e => fitToInk(e, 30));
  document.querySelectorAll('.fav').forEach(e => fitToInk(e, 22));
  document.querySelectorAll('.wm').forEach(e => { e.style.fontSize = '15px'; });

  const sizes = new Set([...document.querySelectorAll('.hd40')].map(e => e.style.fontSize));
  window.__sizingOk = sizes.size === document.querySelectorAll('.hd40').length;
  document.documentElement.dataset.sized = '1';
});
</script>
</body></html>`;
}

await main();
