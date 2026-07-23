/**
 * Wordmark round 3 — more like the four Nino carried, holding the straddle.
 *
 * Round 2 revealed a clean preference: Schibsted Grotesk, Avenir Next, Sora
 * and Roc Grotesk Wide in; everything rounded, soft, novelty or art-school
 * out. The through-line is straight-sided, disciplined, contemporary — but it
 * straddles two ends, a character end (Schibsted, Roc) and a neutral end
 * (Avenir, Sora). Nino chose to hold both in one sheet rather than pick an
 * end yet, so this round carries:
 *
 *   - the four winners, blind, to test whether the preference survives when
 *     re-shuffled among new options;
 *   - the kit siblings he flagged — Roc at normal width beside the wide cut he
 *     picked, and Apotek, a disciplined kit grotesk never shown;
 *   - new candidates in both directions, chosen on the trait and not on being
 *     easy to fetch: character-forward grotesks (Space Grotesk, Archivo) and
 *     neutral-engineered sans (Geist, Hanken, Onest).
 *
 * Same two rules as round 2: native kerning only, controls do not compete.
 * Same machinery, so every round-2 fix carries over — latin-subset fetch,
 * ink-height normalisation measured by pixel count, fallback guards on the
 * measurement page, opsz pinned, and the reshuffle that keeps it blind.
 *
 *   node scripts/wordmark-round3.mjs            (fixed order)
 *   FLICKDAY_SHUFFLE=1 node scripts/wordmark-round3.mjs   (blind)
 *     → flickday-assets/wordmarks/round3.png
 *     → flickday-assets/wordmarks/round3-KEY.json   (do not read while judging)
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

// A new kit of purely variable display faces, all reached through the linked
// stylesheet. Labelled, not blind — Nino asked to compare knowingly. Each is
// pinned to its heaviest instance, verified against the kit's axis range
// (Bananas tops at 800, Latino Gothic on a 1-100 axis, Peridot to 950).
const CANDIDATES = [
  { family: 'allotrope-variable', label: 'Allotrope 900', weight: 900, kit: true },
  { family: 'bananas-variable', label: 'Bananas 800 (axis max)', weight: 800, kit: true },
  { family: 'config-variable', label: 'Config 900', weight: 900, kit: true },
  { family: 'ivyepic-variable', label: 'IvyEpic 900', weight: 900, kit: true },
  { family: 'latino-gothic-variable', label: 'Latino Gothic 100 (axis max)', weight: 100, kit: true },
  { family: 'nextexit-variable', label: 'Next Exit 900', weight: 900, kit: true },
  { family: 'peridot-pe-variable', label: 'Peridot PE 950 (axis max)', weight: 950, kit: true },
  { family: 'varietta-variable', label: 'Varietta 900', weight: 900, kit: true },
];

const TYPEKIT = 'https://use.typekit.net/fju5pyz.css';

// Labelled, below the blind rows. Not competing.
const CONTROLS = [
  { family: 'Anton', weight: 400, note: 'live site display face' },
  { family: 'Barlow Condensed', weight: 700, note: 'already in the site system' },
  { family: 'Archivo Black', weight: 400, note: 'sober durability control' },
];

// Fixed permutation so two runs are comparable. Changing this reshuffles.
// Eight faces; labelled, so no shuffle — natural order.
// order that neither reviewer has seen.
const FIXED_ORDER = [0, 1, 2, 3, 4, 5, 6, 7];

// With FLICKDAY_SHUFFLE=1 the order is drawn at random and never printed.
// Both reviewers had learned the fixed mapping by reviewing the code that
// produced it, so the sheet was no longer blind to either of them. The only
// way back is a permutation neither has seen — which means the script must
// not narrate it, and nobody may open the key until a shortlist is written.
const ORDER = (() => {
  if (!process.env.FLICKDAY_SHUFFLE) return FIXED_ORDER;
  const a = CANDIDATES.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function fetchFace(family, weight, axis) {
  const spec = axis ?? `wght@${weight}`;
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${spec}&display=block`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Google Fonts ${res.status} for ${family} ${weight}`);
  const css = await res.text();
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map(
    ([, subset, body]) => ({ subset, body }),
  );
  const latin = blocks.find((b) => b.subset === 'latin') ?? blocks.at(-1);
  if (!latin) throw new Error(`No @font-face for ${family} ${weight}`);
  const src = /url\((https:[^)]+\.woff2)\)/.exec(latin.body);
  const buf = Buffer.from(await (await fetch(src[1])).arrayBuffer());
  return buf.toString('base64');
}

/** Alias each face to its display code so the sheet cannot leak a name. */
async function prepare(entries, prefix) {
  const out = [];
  for (const [i, e] of entries.entries()) {
    const code = `${prefix}-${String(i + 1).padStart(2, '0')}`;
    if (e.kit) {
      // Served by the linked Typekit stylesheet. Not re-hosted: embedding the
      // binaries in a committed file would be redistribution, and the licence
      // covers use through the kit.
      out.push({ ...e, code, css: '', cssFamily: e.family });
    } else if (e.local) {
      const srcs = e.local.map((n) => `local('${n}')`).join(',');
      out.push({ ...e, code, cssFamily: code, css: `@font-face{font-family:'${code}';src:${srcs};font-weight:${e.weight}}` });
    } else {
      const b64 = await fetchFace(e.family, e.weight, e.googleAxis);
      out.push({
        ...e,
        code,
        cssFamily: code,
        css:
          `@font-face{font-family:'${code}';font-weight:${e.weight};font-display:block;` +
          `src:url(data:font/woff2;base64,${b64}) format('woff2')}`,
      });
    }
  }
  return out;
}

/**
 * Measured ink height per face, by rasterising and counting pixels.
 *
 * Every cheaper route fails on these candidates. Canvas TextMetrics ignores
 * font-variation-settings, so the three kit faces would measure at their
 * default instance; the kit's own woff2 URLs answer 400 to a direct fetch, so
 * they cannot be re-declared with a variation descriptor; and SVG getBBox
 * returns the em box rather than the ink, and did not pick up the variations
 * either. Screenshot and count.
 *
 * Returns ink height in CSS px at font-size 200, which scales linearly, so one
 * measurement per face sizes every row.
 */
async function measureInk(browser, fontFaces, faces) {
  return measureAt(browser, fontFaces, faces, () => 200);
}

async function measureAt(browser, fontFaces, faces, sizeFor) {
  const page = await browser.newPage({ viewport: { width: 2600, height: 400 }, deviceScaleFactor: 1 });
  const probes = faces
    .map(
      (f) =>
        `<div class="p" data-code="${f.code}" style="font-size:${sizeFor(f).toFixed(3)}px;` +
        `font-family:'${f.cssFamily}';font-weight:${f.weight};` +
        `font-optical-sizing:none${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</div>`,
    )
    .join('');

  await page.setContent(
    `<link rel="stylesheet" href="${TYPEKIT}"><style>
     ${fontFaces}
     *{margin:0;padding:0}
     body{background:#000;width:2600px}
     .p{color:#fff;line-height:2.4;white-space:nowrap;height:520px;display:flex;align-items:center}
     </style>${probes}`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready);

  // The measurement page needs the same @font-face block as the sheet.
  // Without it the anonymous aliases resolve to fallback, every non-kit row
  // measures the same fallback ink, and — because the verification pass calls
  // this same function — the check confirms itself. Six blind rows and a
  // control all returned exactly 181px, which is not something distinct
  // typefaces do. Prove each probe differs from serif before counting pixels.
  const fellBack = await page.evaluate(
    ([word, probes]) => {
      const el = document.createElement('span');
      el.textContent = word;
      document.body.appendChild(el);
      const measure = (css) => {
        el.style.cssText = `position:absolute;visibility:hidden;font-size:200px;${css}`;
        return el.getBoundingClientRect().width;
      };
      const control = measure('font-family:serif');
      const bad = probes
        .filter((p) => Math.abs(measure(`font-family:'${p.family}',serif;font-weight:${p.weight}`) - control) < 0.5)
        .map((p) => p.code);
      el.remove();
      return bad;
    },
    [WORD, faces.map((f) => ({ code: f.code, family: f.cssFamily, weight: f.weight }))],
  );
  if (fellBack.length) {
    throw new Error(`Measurement page fell back to serif for: ${fellBack.join(', ')}`);
  }

  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('.p')].map((el) => {
      const r = el.getBoundingClientRect();
      return { code: el.dataset.code, top: Math.round(r.top), bottom: Math.round(r.bottom) };
    }),
  );

  await page.setViewportSize({ width: 2600, height: await page.evaluate(() => document.body.scrollHeight) });
  const shot = (await page.screenshot({ fullPage: true })).toString('base64');
  await page.close();

  // Scan the raster back inside a page, since decoding a PNG here would mean
  // a new dependency for something the browser already does.
  const scanner = await browser.newPage();
  await scanner.setContent('<canvas id=c></canvas>');
  const ink = await scanner.evaluate(
    async ([b64, boxes]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.getElementById('c');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const out = {};
      for (const b of boxes) {
        let first = null, last = null;
        for (let y = Math.max(0, b.top); y < Math.min(cv.height, b.bottom); y++) {
          let lit = false;
          for (let x = 0; x < cv.width; x++) {
            if (d[(y * cv.width + x) * 4] > 40) { lit = true; break; }
          }
          if (lit) { if (first === null) first = y; last = y; }
        }
        out[b.code] = first === null ? null : last - first + 1;
      }
      return out;
    },
    [shot, boxes],
  );
  await scanner.close();

  const blank = Object.entries(ink).filter(([, v]) => !v).map(([k]) => k);
  if (blank.length) throw new Error(`No ink found for: ${blank.join(', ')}`);
  return ink;
}

/** Ink height of each face as actually rendered at `target`. */
/**
 * The exact font-size each face needs to hit each target ink height.
 *
 * Scaling linearly from one 200px measurement is close but not exact: the
 * antialias fringe is a near-constant pixel, so at 30px it can push a face to
 * 32 while the same face is perfect at 40. Start from the linear estimate,
 * measure at that size, and correct once or twice until the rendered ink is
 * within a pixel of target. Rasterised ink is integer, so ±1 is the floor;
 * this drives every face to it rather than trusting the extrapolation.
 */
async function calibrateSizes(browser, fontFaces, faces, targets) {
  const sizes = Object.fromEntries(faces.map((f) => [f.code, {}]));
  for (const [name, target] of Object.entries(targets)) {
    const est = Object.fromEntries(faces.map((f) => [f.code, (200 * target) / f.ink200]));
    for (let pass = 0; pass < 4; pass++) {
      const measured = await measureAt(browser, fontFaces, faces, (f) => est[f.code]);
      let anyOff = false;
      for (const f of faces) {
        const m = measured[f.code];
        if (Math.abs(m - target) > 1) {
          est[f.code] *= target / m;
          anyOff = true;
        }
      }
      if (!anyOff) break;
    }
    for (const f of faces) sizes[f.code][name] = est[f.code];
  }
  return sizes;
}

async function main() {
  const blind = ORDER.map((i) => CANDIDATES[i]);
  // Alphabetical, so the roster is visible and the assignment is not.
  console.log(
    '  roster: ' + CANDIDATES.map((c) => c.label).join(' · '),
  );
  const prepared = await prepare(blind, 'N');
  const controls = await prepare(CONTROLS, 'CTRL');

  const fontFaces = [...prepared, ...controls].map((f) => f.css).join('\n');

  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const ink = await measureInk(browser, fontFaces, [...prepared, ...controls]);
  for (const f of [...prepared, ...controls]) f.ink200 = ink[f.code];
  console.log(
    '  ink@200px: ' +
      [...prepared, ...controls].map((f) => `${f.code}=${f.ink200}`).join(' '),
  );

  // Per-size calibration, because linear extrapolation left one face 2px over
  // at the mobile size. The sheet uses these, not the 200px estimate.
  const sizes = await calibrateSizes(browser, fontFaces, [...prepared, ...controls], TARGETS);
  for (const f of [...prepared, ...controls]) f.sizes = sizes[f.code];

  const html = sheet(prepared, controls, fontFaces);
  const tmp = join(OUT, '_newkit.html');
  writeFileSync(tmp, html);

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Two independent checks, because each has caught a different failure.
  // Width-vs-serif catches a face that never loaded; all-distinct catches a
  // set that silently collapsed onto one shared fallback.
  const report = await page.evaluate(
    ([word, codes]) => {
      const measure = (fam, variation) => {
        const el = document.createElement('span');
        el.textContent = word;
        el.style.cssText =
          `position:absolute;visibility:hidden;font:${fam}` +
          (variation ? `;font-variation-settings:${variation}` : '');
        document.body.appendChild(el);
        const w = el.getBoundingClientRect().width;
        el.remove();
        return w;
      };
      const control = measure('200px serif', '');
      return codes.map(({ code, family, weight, variation }) => ({
        code,
        width: measure(`${weight} 200px '${family}',serif`, variation),
        control,
      }));
    },
    [
      WORD,
      [...prepared, ...controls].map((f) => ({
        code: f.code,
        family: f.cssFamily,
        weight: f.weight,
        variation: f.variation ?? '',
      })),
    ],
  );

  const fellBack = report.filter((r) => Math.abs(r.width - r.control) < 0.5).map((r) => r.code);
  if (fellBack.length) throw new Error(`Faces fell back to serif: ${fellBack.join(', ')}`);
  const widths = new Set(report.map((r) => r.width.toFixed(2)));
  if (widths.size !== report.length) {
    throw new Error('Two faces measure identically — at least one resolved to a shared fallback');
  }

  // The sheet claims equal ink height and applied axis values. Check both on
  // the rendered page rather than trusting the string that was written: a
  // double quote inside style="" once terminated the attribute early, which
  // dropped font-size and left four rows at the inherited 16px while the
  // banner still said "normalised".
  const applied = await page.evaluate(() =>
    [...document.querySelectorAll('.hdr span')].map((el) => ({
      size: parseFloat(getComputedStyle(el).fontSize),
      axes: getComputedStyle(el).fontVariationSettings,
    })),
  );
  const unsized = applied.filter((a) => !a.size || a.size === 16);
  if (unsized.length) throw new Error(`${unsized.length} rows never received a computed font-size`);

  const wantAxes = [...prepared, ...controls].filter((f) => f.variation).length;
  const gotAxes = applied.filter((a) => a.axes && a.axes !== 'normal').length;
  if (gotAxes < wantAxes) {
    throw new Error(`${wantAxes - gotAxes} rows lost their font-variation-settings`);
  }

  // Re-measure the header row as rendered. Scaling from one measurement
  // assumes ink is linear in font-size, and it was not: with the default
  // font-optical-sizing:auto, Chromium re-derived opsz from font-size and the
  // Degular row came out 46px against a 40px target.
  for (const [name, target] of Object.entries(TARGETS)) {
    // Measure at the calibrated sizes the sheet actually uses, not the linear
    // estimate. 1px is the rasterisation floor; at the 15px watermark that is
    // already 7%, so it is reported per row rather than summarised.
    const got = await measureAt(browser, fontFaces, [...prepared, ...controls], (f) => f.sizes[name]);
    const off = Object.entries(got).filter(([, v]) => Math.abs(v - target) > 1);
    if (off.length) {
      throw new Error(
        `${name} not normalised to ${target}px: ${off.map(([k, v]) => `${k}=${v}`).join(', ')}`,
      );
    }
    console.log(
      `  verified ${name}@${target}px: ${Object.entries(got).map(([k, v]) => `${k}=${v}`).join(' ')}`,
    );
  }

  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1400, height: h });
  await page.screenshot({ path: join(OUT, 'newkit.png') });
  await browser.close();
  console.log(`✓ newkit.png  1400x${h}`);

  writeFileSync(
    join(OUT, 'newkit-manifest.json'),
    JSON.stringify(
      {
        note: 'Labelled comparison of kit fju5pyz — eight variable display faces at their heaviest instance. Not blind.',
        kerning: 'native — no algorithmic correction applied',
        kit: 'https://use.typekit.net/fju5pyz.css',
        faces: prepared.map((f) => ({
          label: f.label,
          family: f.family,
          weight: f.weight,
          inkAt200px: f.ink200,
        })),
      },
      null,
      2,
    ),
  );
  console.log('✓ newkit-manifest.json');
}

// Ink heights, not font sizes. The live site constrains the logo image to a
// height, so equal font-size hands extra presence to whichever face has the
// larger x-height — which is exactly the bias this sheet exists to avoid.
const TARGETS = { hdr: 40, mob: 30, wm: 15, app: 32 };

function sheet(blind, controls, fontFaces) {
  const typeCss = (f, name) =>
    `font-size:${f.sizes[name].toFixed(3)}px;` +
    `font-family:'${f.cssFamily}';font-weight:${f.weight};font-optical-sizing:none` +
    (f.variation ? `;font-variation-settings:${f.variation}` : '');

  // font-kerning:normal and no letter-spacing anywhere — this round is about
  // what the faces do untouched.
  const row = (f, label) => `
  <div class="row">
    <div class="code">${label}</div>
    <div class="cell hdr"><span style="${typeCss(f, 'hdr')}">${WORD}</span></div>
    <div class="cell mob"><span style="${typeCss(f, 'mob')}">${WORD}</span></div>
    <div class="cell shot"><span class="wm" style="${typeCss(f, 'wm')}">${WORD}</span></div>
    <div class="cell app"><span style="${typeCss(f, 'app')}">${WORD}</span></div>
  </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${TYPEKIT}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{background:#0f0f12;color:#fff;font-family:ui-monospace,monospace;width:1400px;padding:44px 48px}
h1{color:${YELLOW};font-size:22px;margin-bottom:4px}
.sub{font-size:13px;opacity:.62;margin-bottom:8px;line-height:1.55}
.warn{font-size:12px;color:#ffb454;background:#2a1f12;border:1px solid #4a3419;border-radius:7px;
  padding:12px 14px;margin:16px 0 22px;line-height:1.55}
.brow{display:flex;gap:16px;margin-top:6px;font-size:11px;opacity:.85}
.bname{width:250px}
.bwhy{opacity:.7}
.head{display:flex;gap:22px;padding:0 0 10px 132px;font-size:10px;opacity:.45;text-transform:uppercase;letter-spacing:.09em}
.head div{flex:none}
.row{display:flex;align-items:center;gap:22px;border-bottom:1px solid #202027;padding:17px 0}
.code{width:110px;flex:none;font-size:12px;opacity:.6;line-height:1.4}
.n{font-size:9px;opacity:.55}
.cell{flex:none;display:flex;align-items:center;font-kerning:normal;letter-spacing:normal}
.hdr{width:300px}
.hdr span{color:${YELLOW};line-height:1}
.mob{width:215px}
.mob span{color:${YELLOW};line-height:1}
.shot{width:272px;height:84px;border-radius:6px;overflow:hidden;position:relative;
  background:linear-gradient(115deg,#3d4a58,#6b7a63 40%,#242a31 75%,#4a4038);
  align-items:flex-end;justify-content:flex-end;padding:9px 11px}
.wm{color:#fff;opacity:.75;line-height:1}
.app{width:250px;height:74px;border-radius:6px;background:${GARMENT_LIGHT};
  align-items:center;justify-content:center}
.app span{color:${INK};line-height:1}
.strip{margin-top:30px;border-top:1px dashed #33333c;padding-top:22px}
.strip h2{font-size:14px;color:#8a8a93;font-weight:400;margin-bottom:6px}
.snote{font-size:12px;opacity:.5;margin-bottom:14px;line-height:1.5}
.strip .row{opacity:.72}
</style></head><body>
<h1>flickday — new variable kit (labelled, native kerning)</h1>
<div class="sub">
  A new kit of eight purely variable display faces, each at its heaviest instance and labelled — no blind test,
  compare knowingly. These are display families with real personality, a different register from the disciplined
  grotesk finalists.<br>
  <strong>Native kerning, no optical correction.</strong> Spacing is untouched; judge the letterforms, not the fit.
</div>
<div class="warn">
  <strong>Sizes are normalised by measured ink height, not font-size.</strong> The live site constrains the logo to a
  height, so every row is scaled until the word measures the same pixels tall &mdash; 40px desktop header, 30px
  mobile, 15px watermark, 32px apparel &mdash; so weight and width are compared fairly, not x-height.
</div>
<div class="head">
  <div style="width:300px">header · 40px ink</div>
  <div style="width:215px">mobile · 30px ink</div>
  <div style="width:272px">watermark · 15px ink</div>
  <div style="width:250px">apparel · 32px ink</div>
</div>
${blind.map((f) => row(f, f.label)).join('')}
<section class="strip">
  <h2>reference strip — labelled, not competing</h2>
  <div class="snote">Existing site type, shown for context. These are not candidates.</div>
  ${controls.map((f) => row(f, `${f.family} ${f.weight}`)).join('')}
</section>
</body></html>`;
}

await main();
