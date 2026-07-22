/**
 * Wordmark round 2 — different typographic territories, native kerning.
 *
 * Round 1's pool was ten Google Fonts, mostly close relatives of each other,
 * which made a rounded geometric sans close to inevitable. It also omitted
 * Avenir Next Heavy, which is the documented base of the modular wordmark
 * set (concepts/2026-07-modular-wordmark/round-1/README.md) and should have
 * been the historical control from the start.
 *
 * Two rules for this round:
 *
 *   1. Native kerning only. Round 1's algorithmic optical pass equalised
 *      measured white area and produced a k-d gap in Sora more than twice as
 *      tight as c-k. Equal area is not equal rhythm. No correction until two
 *      or three finalists remain, and then by eye.
 *   2. Controls do not compete. Anton, Barlow Condensed and Archivo Black
 *      appear in a labelled reference strip below the blind rows.
 *
 *   node scripts/wordmark-round2.mjs
 *     → flickday-assets/wordmarks/round2.png
 *     → flickday-assets/wordmarks/round2-KEY.json   (do not read while judging)
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

// `local` faces come from the OS by family name; the rest are fetched from
// Google Fonts and embedded. Both kinds are proved in use before rendering.
const CANDIDATES = [
  { family: 'Sora', weight: 800, note: 'round-1 baseline' },
  {
    family: 'Avenir Next',
    weight: 900,
    // local() matches the full face name, not the family — src:local('Avenir Next')
    // silently resolves to nothing and the row renders in serif. fc-list gives
    // the face as "Avenir Next Heavy"; the PostScript name is listed as a fallback.
    local: ["Avenir Next Heavy", "AvenirNext-Heavy"],
    note: 'historical control — modular-set base',
  },
  { family: 'Schibsted Grotesk', weight: 900 },
  { family: 'Bricolage Grotesque', weight: 800 },
  { family: 'Anybody', weight: 800, note: 'restrained width' },
  { family: 'Syne', weight: 800, note: 'boundary candidate' },
  // Variable cuts, with axis values calibrated against the kit's own static
  // width and optical-size families rather than guessed. Static cuts serve
  // 400/700 only, so the variables are the only route to these weights.
  {
    family: 'degular-variable',
    weight: 800,
    kit: true,
    variation: '"opsz" 68',
    // opsz 68 reproduces static degular-display at 700 to within 0.1px.
    // The weight axis stops at 800: asking for 900 returns 800 unchanged,
    // so Black is still out of reach and this row runs one step light.
    note: 'display opsz · 800, axis max',
  },
  {
    family: 'roc-grotesk-variable',
    weight: 800,
    kit: true,
    variation: '"wdth" 126',
    // Width calibration against the static cuts: compressed 58, condensed 80,
    // normal 104, wide 126, extrawide ~150. 126 is the Wide cut.
    note: 'wide axis · extrabold',
  },
  {
    family: 'obviously-variable',
    weight: 900,
    kit: true,
    variation: '"wdth" 100',
    // Obviously maps exactly: compressed 50, condensed 60, narrow 80,
    // normal 100, wide 150, extended 200. Normal Black is reachable as asked.
    note: 'normal width · black',
  },
];

const TYPEKIT = 'https://use.typekit.net/tgm3xnd.css';

// Requested, and not renderable here. Named on the sheet rather than quietly
// dropped, because a missing candidate looks identical to a candidate that
// lost.
const BLOCKED = [
  ['Degular Display Black (900)', 'degular-variable weight axis stops at 800 — rendering at 800'],
];

// Labelled, below the blind rows. Not competing.
const CONTROLS = [
  { family: 'Anton', weight: 400, note: 'live site display face' },
  { family: 'Barlow Condensed', weight: 700, note: 'already in the site system' },
  { family: 'Archivo Black', weight: 400, note: 'sober durability control' },
];

// Fixed permutation so two runs are comparable. Changing this reshuffles.
const ORDER = [7, 3, 0, 8, 5, 1, 6, 4, 2];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function fetchFace(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=block`;
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
      console.log(`  kit     ${e.family} ${e.weight}`);
    } else if (e.local) {
      const srcs = e.local.map((n) => `local('${n}')`).join(',');
      out.push({ ...e, code, cssFamily: code, css: `@font-face{font-family:'${code}';src:${srcs};font-weight:${e.weight}}` });
      console.log(`  local   ${e.family} ${e.weight}`);
    } else {
      const b64 = await fetchFace(e.family, e.weight);
      out.push({
        ...e,
        code,
        cssFamily: code,
        css:
          `@font-face{font-family:'${code}';font-weight:${e.weight};font-display:block;` +
          `src:url(data:font/woff2;base64,${b64}) format('woff2')}`,
      });
      console.log(`  fetched ${e.family} ${e.weight}`);
    }
  }
  return out;
}

async function main() {
  const blind = ORDER.map((i) => CANDIDATES[i]);
  const prepared = await prepare(blind, 'N');
  const controls = await prepare(CONTROLS, 'CTRL');

  const fontFaces = [...prepared, ...controls].map((f) => f.css).join('\n');
  const html = sheet(prepared, controls, fontFaces);

  mkdirSync(OUT, { recursive: true });
  const tmp = join(OUT, '_round2.html');
  writeFileSync(tmp, html);

  const browser = await chromium.launch();
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

  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1400, height: h });
  await page.screenshot({ path: join(OUT, 'round2.png') });
  await browser.close();
  console.log(`✓ round2.png  1400x${h}`);

  writeFileSync(
    join(OUT, 'round2-KEY.json'),
    JSON.stringify(
      {
        note: 'Blind key for round 2. Do not open until the sheet has been judged. Controls are labelled on the sheet already.',
        kerning: 'native — no algorithmic correction applied',
        weightCaveat:
          'degular-variable weight axis stops at 800, so Degular Black (900) is unreachable and that row runs one step light. Obviously and Roc Grotesk are at their specified weights.',
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
          note: f.note ?? null,
        })),
        controls: controls.map((f) => ({ code: f.code, family: f.family, weight: f.weight })),
        blocked: BLOCKED.map(([name, why]) => ({ name, why })),
      },
      null,
      2,
    ),
  );
  console.log('✓ round2-KEY.json (sealed)');
}

function sheet(blind, controls, fontFaces) {
  // font-kerning:normal and no letter-spacing anywhere — this round is about
  // what the faces do untouched.
  const row = (f, label) => `
  <div class="row">
    <div class="code">${label}${f.note ? `<br><span class="n">${f.note}</span>` : ''}</div>
    <div class="cell hdr"><span style="font-family:'${f.cssFamily}';font-weight:${f.weight}${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</span></div>
    <div class="cell mob"><span style="font-family:'${f.cssFamily}';font-weight:${f.weight}${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</span></div>
    <div class="cell shot"><span class="wm" style="font-family:'${f.cssFamily}';font-weight:${f.weight}${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</span></div>
    <div class="cell app"><span style="font-family:'${f.cssFamily}';font-weight:${f.weight}${f.variation ? `;font-variation-settings:${f.variation}` : ''}">${WORD}</span></div>
  </div>`;

  const blockedRows = BLOCKED.map(
    ([name, why]) => `
    <div class="brow"><div class="bname">${name}</div><div class="bwhy">${why}</div></div>`,
  ).join('');

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
.hdr span{font-size:40px;color:${YELLOW};line-height:1}
.mob{width:215px}
.mob span{font-size:30px;color:${YELLOW};line-height:1}
.shot{width:272px;height:84px;border-radius:6px;overflow:hidden;position:relative;
  background:linear-gradient(115deg,#3d4a58,#6b7a63 40%,#242a31 75%,#4a4038);
  align-items:flex-end;justify-content:flex-end;padding:9px 11px}
.wm{font-size:15px;color:#fff;opacity:.75;line-height:1}
.app{width:250px;height:74px;border-radius:6px;background:${GARMENT_LIGHT};
  align-items:center;justify-content:center}
.app span{font-size:30px;color:${INK};line-height:1}
.strip{margin-top:30px;border-top:1px dashed #33333c;padding-top:22px}
.strip h2{font-size:14px;color:#8a8a93;font-weight:400;margin-bottom:6px}
.snote{font-size:12px;opacity:.5;margin-bottom:14px;line-height:1.5}
.strip .row{opacity:.72}
</style></head><body>
<h1>flickday — wordmark round 2 (blind, native kerning)</h1>
<div class="sub">
  Different typographic territories, not ten more rounded geometric sans. Sizes are the live site's own
  (.site-header__logo is 30/34/40px) plus watermark and one-colour apparel.<br>
  <strong>No optical correction.</strong> Round 1's algorithm equalised measured white area and made Sora's k-d gap
  more than twice as tight as c-k. Equal area is not equal rhythm — correct by eye, after finalists.
</div>
<div class="warn">
  <strong>One row still runs a weight light.</strong> The kit's variable cuts unlock the real weights, and their
  axis values were calibrated against the kit's own static families rather than guessed &mdash; Obviously Normal Black
  and Roc Grotesk Wide ExtraBold are now exactly as specified. Degular is not: its weight axis stops at 800, and
  asking for 900 returns 800 unchanged.
  ${blockedRows}
  <div style="margin-top:10px;opacity:.8">Axis values in use: degular <code>opsz 68</code> (= static Display, matched to 0.1px), roc-grotesk <code>wdth 126</code> (= Wide), obviously <code>wdth 100</code> (= Normal).</div>
</div>
<div class="head">
  <div style="width:300px">header · 40px desktop</div>
  <div style="width:215px">header · 30px mobile</div>
  <div style="width:272px">watermark</div>
  <div style="width:250px">one-colour apparel</div>
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
