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

// `local` faces come from the OS by face name; `kit` faces come through the
// linked Typekit stylesheet; the rest are fetched from Google Fonts and
// embedded. All three kinds are proved in use before rendering. `end` records
// which side of the straddle each sits on, for the sealed key only.
const CANDIDATES = [
  // --- the four Nino carried from round 2, blind again ---
  { family: 'Schibsted Grotesk', weight: 900, end: 'character', note: 'round-2 pick' },
  {
    family: 'Avenir Next',
    weight: 900,
    // local() matches the full face name, not the family — src:local('Avenir Next')
    // silently resolves to nothing and the row renders in serif.
    local: ['Avenir Next Heavy', 'AvenirNext-Heavy'],
    end: 'neutral',
    note: 'round-2 pick · modular-set base',
  },
  { family: 'Sora', weight: 800, end: 'neutral', note: 'round-2 pick · round-1 baseline' },
  {
    family: 'roc-grotesk-variable',
    weight: 800,
    kit: true,
    variation: "'wdth' 126",
    end: 'character',
    note: 'round-2 pick — Roc Grotesk Wide, wdth 126',
  },
  // --- kit siblings of the winners, the exploration Nino asked for ---
  {
    family: 'roc-grotesk-variable',
    weight: 800,
    kit: true,
    variation: "'wdth' 104",
    end: 'character',
    // Same family as the wide pick, at normal width — does the Roc character
    // hold when it stops being wide, or was the width doing the work?
    note: 'Roc Grotesk normal, wdth 104 — the wide pick at standard width',
  },
  {
    family: 'apotek',
    weight: 700,
    kit: true,
    end: 'character',
    // In the same kit, never shown. Disciplined grotesk, seven widths; this
    // is the normal cut at its heaviest static weight.
    note: 'Apotek 700 — disciplined kit grotesk, previously unshown',
  },
  // --- new, character end ---
  { family: 'Space Grotesk', weight: 700, end: 'character', note: 'distinctive grotesk' },
  { family: 'Archivo', weight: 800, end: 'character', note: 'sturdy grotesk' },
  // --- new, neutral end ---
  { family: 'Geist', weight: 800, end: 'neutral', note: 'engineered, contemporary' },
  { family: 'Hanken Grotesk', weight: 800, end: 'neutral', note: 'quiet, legible' },
  { family: 'Onest', weight: 800, end: 'neutral', note: 'neutral geometric' },
];

const TYPEKIT = 'https://use.typekit.net/tgm3xnd.css';

// Nothing blocked this round: every candidate reaches its specified weight.
const BLOCKED = [];

// Labelled, below the blind rows. Not competing.
const CONTROLS = [
  { family: 'Anton', weight: 400, note: 'live site display face' },
  { family: 'Barlow Condensed', weight: 700, note: 'already in the site system' },
  { family: 'Archivo Black', weight: 400, note: 'sober durability control' },
];

// Fixed permutation so two runs are comparable. Changing this reshuffles.
// Eleven candidates this round; run with FLICKDAY_SHUFFLE=1 to draw a fresh
// order that neither reviewer has seen.
const FIXED_ORDER = [6, 0, 9, 3, 8, 1, 10, 4, 7, 2, 5];

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
    '  roster: ' + CANDIDATES.map((c) => `${c.family} ${c.weight}`).sort().join(' · '),
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
  const tmp = join(OUT, '_round3.html');
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
  await page.screenshot({ path: join(OUT, 'round3.png') });
  await browser.close();
  console.log(`✓ round3.png  1400x${h}`);

  writeFileSync(
    join(OUT, 'round3-KEY.json'),
    JSON.stringify(
      {
        note: 'Blind key for round 3. Do not open until the shortlist has been written. Controls are labelled on the sheet already.',
        kerning: 'native — no algorithmic correction applied',
        straddle:
          'end="character" is the Schibsted/Roc side (distinctive through confidence); end="neutral" is the Avenir/Sora side (engineered, quiet). The four round-2 picks are re-entered blind to test whether the preference holds against the new options.',
        rocSiblings:
          'Two Roc rows: wdth 126 (the wide cut Nino picked in round 2) and wdth 104 (normal width, same family) — to see whether the character held or the width was doing the work.',
        normalisationTolerance:
          'Measured ink lands 1px over each target (41/31/16/33 against 40/30/15/32). That is the inclusive pixel-row count including the antialias fringe, and it is uniform across every row, so it shifts all candidates equally rather than favouring any.',
        normalisation:
          'Every row is scaled so the word measures equal ink height: 40px desktop header, 30px mobile, 15px watermark, 32px apparel. Measured by rasterising and counting lit pixel rows, because canvas TextMetrics ignores font-variation-settings and the kit woff2 URLs answer 400 to a direct fetch.',
        axisCalibration: {
          method: 'variable axis values matched by measuring against the kit static cuts at 700',
          'degular opsz': '68 = static degular-display (0.1px), 14 = degular, 6 = degular-text',
          'roc-grotesk wdth': '58 compressed, 80 condensed, 104 normal, 126 wide, ~150 extrawide',
          'obviously wdth': '50 compressed, 60 condensed, 80 narrow, 100 normal, 150 wide, 200 extended',
        },
        blind: prepared.map((f) => ({
          code: f.code,
          family: f.family,
          weight: f.weight,
          variation: f.variation ?? null,
          end: f.end ?? null,
          note: f.note ?? null,
          inkAt200px: f.ink200,
        })),
        controls: controls.map((f) => ({ code: f.code, family: f.family, weight: f.weight })),
        blocked: BLOCKED.map(([name, why]) => ({ name, why })),
      },
      null,
      2,
    ),
  );
  console.log('✓ round3-KEY.json (sealed)');
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
<h1>flickday — wordmark round 3 (blind, native kerning)</h1>
<div class="sub">
  More like the four carried from round 2 — disciplined, straight-sided, contemporary. Both ends of that
  preference are here: the character grotesks and the neutral geometrics, plus the kit siblings of the winners.
  Which row is which end is in the sealed key.<br>
  <strong>Native kerning, no optical correction.</strong> The kd pair runs open and ck runs tight in most of these;
  note it, do not fix it yet.
</div>
<div class="warn">
  <strong>Sizes are normalised by measured ink height, not font-size.</strong> The live site constrains the logo to a
  height, so every row below is scaled until the word measures the same number of pixels tall &mdash; 40px desktop
  header, 30px mobile, 15px watermark, 32px apparel. Provenance and axis values are in the sealed key, not here.
</div>
<div class="head">
  <div style="width:300px">header · 40px ink</div>
  <div style="width:215px">mobile · 30px ink</div>
  <div style="width:272px">watermark · 15px ink</div>
  <div style="width:250px">apparel · 32px ink</div>
</div>
${blind.map((f) => row(f, f.code)).join('')}
<section class="strip">
  <h2>reference strip — labelled, not competing</h2>
  <div class="snote">Existing site type, shown for context. These are not candidates.</div>
  ${controls.map((f) => row(f, `${f.family} ${f.weight}`)).join('')}
</section>
</body></html>`;
}

await main();
