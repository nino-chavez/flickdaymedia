/**
 * Blind wordmark specimens for the forge-brand `wordmark` gate.
 *
 * Successor to font-match.mjs, which listed the right candidate faces but
 * compared them one way: huge, on dark, labelled. Three changes:
 *
 *   1. Blind. Rows are coded S-01..S-NN in a fixed scrambled order. The key
 *      is written to a separate file so the sheet can be judged without
 *      knowing which face is which — the name of a font is a bias, not data.
 *   2. Fonts are downloaded and embedded as base64 woff2, never linked. A
 *      linked font that fails to load falls back to system-ui *silently*,
 *      and you end up judging the fallback. The script asserts every face
 *      actually loaded and refuses to write a sheet if one did not.
 *   3. Five contexts, because a wordmark that only works at 130px is not a
 *      wordmark: site header, watermark over footage, avatar crop, small
 *      size, and one-colour apparel.
 *
 *   node scripts/wordmark-specimens.mjs
 *     → flickday-assets/wordmarks/specimens-screen.png
 *     → flickday-assets/wordmarks/specimens-apparel.png
 *     → flickday-assets/wordmarks/specimens-KEY.json   (do not read while judging)
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json');
const { chromium } = require('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');
const WORD = 'flickday';

// Live-site tokens. Not re-picked here — see BRAND-PRIORS: the site is canonical.
const YELLOW = '#facc15';
const INK = '#111318';
const GARMENT_LIGHT = '#e8e4dc';
const GARMENT_DARK = '#1b1b20';

// The candidate list from font-match.mjs, unchanged. Heavy lowercase
// geometric faces, weight picked toward the traced mark.
const FONTS = [
  ['Poppins', 800],
  ['Montserrat', 800],
  ['Baloo 2', 800],
  ['Fredoka', 600],
  ['Nunito', 900],
  ['Rubik', 800],
  ['Plus Jakarta Sans', 800],
  ['Sora', 800],
  ['Figtree', 900],
  ['Manrope', 800],
];

// Fixed permutation, not a random shuffle — the sheet has to regenerate
// identically or two runs cannot be compared. Changing this line reshuffles.
const ORDER = [6, 2, 9, 0, 4, 7, 1, 8, 3, 5];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/**
 * Fetch the *latin* woff2 for one family/weight and return it base64.
 *
 * Google returns one @font-face per subset, each preceded by a `/* subset *\/`
 * comment, and for several of these families devanagari comes first. Taking
 * the first url() yields a face with no Latin coverage: it loads, reports
 * `status: 'loaded'`, satisfies `document.fonts.check()`, and then every
 * glyph falls back. Match the block by its subset comment instead.
 */
async function fetchFace(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=block`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();

  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)].map(
    ([, subset, body]) => ({ subset, body }),
  );
  const latin = blocks.find((b) => b.subset === 'latin') ?? blocks.at(-1);
  if (!latin) throw new Error(`No @font-face blocks in Google Fonts CSS for ${family} ${weight}`);

  const src = /url\((https:[^)]+\.woff2)\)/.exec(latin.body);
  if (!src) throw new Error(`No woff2 in the ${latin.subset} face for ${family} ${weight}`);

  const buf = Buffer.from(await (await fetch(src[1])).arrayBuffer());
  return { b64: buf.toString('base64'), subset: latin.subset };
}

/**
 * The incumbent is not one mark. Glyph-outline fingerprints across the
 * shipped assets show at least three separate letterform systems: the
 * modular set (set from a font, then outlined — core, play-d and shutter-i
 * share identical glyphs), the traced play/plain wordmark, and the traced
 * reel and twotone marks, which are lighter and wider again.
 *
 * So both surviving systems get a reference row. Anchoring the comparison
 * to whichever one happened to be picked would rank the specimens against
 * an arbitrary member of the drift rather than against "the" wordmark —
 * there is no "the" wordmark, which is the reason this gate exists.
 */
const REFS = [
  ['REF-A', 'modular set · font-derived', ['brand', 'modular-wordmarks', 'flickday-core-color.svg']],
  ['REF-B', 'traced play mark', ['wordmarks', 'wordmark-play.svg']],
].map(([code, label, rel]) => {
  const p = join(ROOT, 'flickday-assets', ...rel);
  if (!existsSync(p)) throw new Error(`Reference wordmark missing: ${p}`);

  // Each incumbent carries its own fill — one near-white, one yellow — and
  // colour changes apparent weight enough to bias a weight comparison.
  // Force both to the specimen colour so the only variable is the shape.
  const svg = readFileSync(p, 'utf-8').replace(/(fill=")(?!none)[^"]*(")/g, `$1${YELLOW}$2`);
  return {
    code,
    label,
    uri: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'),
  };
});

async function build() {
  const faces = [];
  for (const [family, weight] of FONTS) {
    const { b64, subset } = await fetchFace(family, weight);
    faces.push({ family, weight, b64 });
    process.stdout.write(`  fetched ${family} ${weight} (${subset})\n`);
  }

  const specimens = ORDER.map((i, n) => ({
    code: `S-${String(n + 1).padStart(2, '0')}`,
    ...faces[i],
  }));

  const fontFaces = specimens
    .map(
      (s) =>
        `@font-face{font-family:'${s.code}';font-weight:${s.weight};font-display:block;` +
        `src:url(data:font/woff2;base64,${s.b64}) format('woff2')}`,
    )
    .join('\n');

  return { specimens, fontFaces };
}

const shell = (title, sub, css, body, fontFaces) => `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{font-family:ui-monospace,monospace;width:1400px}
h1{font-size:22px;margin-bottom:4px}
.sub{font-size:13px;opacity:.6;margin-bottom:22px;line-height:1.5}
.code{font-size:12px;opacity:.55;width:52px;flex:none}
${css}
</style></head><body>${`<h1>${title}</h1><div class="sub">${sub}</div>`}${body}</body></html>`;

/**
 * Screen sheet — the four scales that decide whether a wordmark survives,
 * side by side so specimens are compared against each other at each one.
 */
function screenSheet(specimens, fontFaces) {
  const row = (code) => `
  <div class="row">
    <div class="code">${code}</div>
    <div class="cell big"><span style="font-family:'${code}'">${WORD}</span></div>
    <div class="cell shot">
      <span class="wm" style="font-family:'${code}'">${WORD}</span>
    </div>
    <div class="cell avatar"><span style="font-family:'${code}'">${WORD}</span></div>
    <div class="cell tiny"><span style="font-family:'${code}'">${WORD}</span></div>
  </div>`;

  const refRow = REFS.map(
    (r, i) => `
  <div class="row ref${i === REFS.length - 1 ? ' last' : ''}">
    <div class="code">${r.code}<br><span class="reflbl">${r.label}</span></div>
    <div class="cell big"><img src="${r.uri}" style="height:52px"></div>
    <div class="cell shot"><img src="${r.uri}" class="wm" style="height:15px"></div>
    <div class="cell avatar"><img src="${r.uri}" style="width:74px"></div>
    <div class="cell tiny"><img src="${r.uri}" style="height:11px"></div>
  </div>`,
  ).join('');

  const css = `
body{background:#0f0f12;color:#fff;padding:44px 48px}
h1{color:${YELLOW}}
.head{display:flex;gap:20px;padding:0 0 10px 52px;font-size:11px;opacity:.45;text-transform:uppercase;letter-spacing:.08em}
.head div{flex:none}
.row{display:flex;align-items:center;gap:20px;border-bottom:1px solid #212126;padding:16px 0}
.row.ref{border-bottom:1px solid ${YELLOW}33}
.row.ref.last{border-bottom:2px solid ${YELLOW}66;margin-bottom:6px}
.code{line-height:1.35}
.reflbl{font-size:9px;opacity:.5}
.cell{flex:none;display:flex;align-items:center}
.big{width:420px;font-size:54px;line-height:1;color:${YELLOW};letter-spacing:-.01em}
.shot{width:360px;height:92px;border-radius:6px;position:relative;overflow:hidden;
  background:linear-gradient(115deg,#3d4a58,#6b7a63 40%,#242a31 75%,#4a4038);
  align-items:flex-end;justify-content:flex-end;padding:9px 11px}
.wm{font-size:15px;color:#fff;opacity:.72;line-height:1}
.avatar{width:120px;justify-content:center}
.avatar span{font-size:19px;color:${YELLOW};line-height:1}
.avatar span,.avatar img{border-radius:50%}
.avatar{}
.tiny{width:200px;font-size:11px;color:${YELLOW};line-height:1}`;

  const head = `<div class="head">
    <div style="width:420px">header · 54px</div>
    <div style="width:360px">watermark over footage</div>
    <div style="width:120px">avatar</div>
    <div style="width:200px">small · 11px</div>
  </div>`;

  return shell(
    'flickday — wordmark specimens (blind)',
    'Coded rows. The key is in specimens-KEY.json — judge before opening it. REF-A and REF-B are both incumbents: the shipped assets carry at least three different letterform systems, all outlined, so none can be regenerated. ' +
      'Ask at each scale: do the counters stay open, does the ck pair hold, does the y descender survive.',
    css,
    head + refRow + specimens.map((s) => row(s.code)).join(''),
    fontFaces,
  );
}

/** Apparel — one colour, flat, both garment tones. No glows: DTF underbase. */
function apparelSheet(specimens, fontFaces) {
  const row = (code) => `
  <div class="row">
    <div class="code">${code}</div>
    <div class="cell light"><span style="font-family:'${code}'">${WORD}</span></div>
    <div class="cell dark"><span style="font-family:'${code}'">${WORD}</span></div>
    <div class="cell light sm"><span style="font-family:'${code}'">${WORD}</span></div>
  </div>`;

  const refRow = REFS.map(
    (r, i) => `
  <div class="row ref${i === REFS.length - 1 ? ' last' : ''}">
    <div class="code">${r.code}<br><span class="reflbl">${r.label}</span></div>
    <div class="cell light"><img src="${r.uri}" style="height:44px;filter:brightness(0)"></div>
    <div class="cell dark"><img src="${r.uri}" style="height:44px;filter:brightness(0) invert(1)"></div>
    <div class="cell light sm"><img src="${r.uri}" style="height:14px;filter:brightness(0)"></div>
  </div>`,
  ).join('');

  const css = `
body{background:#fbfaf8;color:#111;padding:44px 48px}
.head{display:flex;gap:20px;padding:0 0 10px 52px;font-size:11px;opacity:.5;text-transform:uppercase;letter-spacing:.08em}
.row{display:flex;align-items:center;gap:20px;border-bottom:1px solid #e5e2dc;padding:14px 0}
.row.ref{border-bottom:1px solid #bbb}
.row.ref.last{border-bottom:2px solid #111;margin-bottom:6px}
.code{line-height:1.35}
.reflbl{font-size:9px;opacity:.55}
.cell{flex:none;display:flex;align-items:center;justify-content:center;height:86px;border-radius:6px}
.light{width:420px;background:${GARMENT_LIGHT};color:${INK}}
.dark{width:420px;background:${GARMENT_DARK};color:#fff}
.light span,.dark span{font-size:44px;line-height:1}
.sm{width:300px}
.sm span{font-size:14px}`;

  const head = `<div class="head">
    <div style="width:420px">dark ink on light garment</div>
    <div style="width:420px">white ink on dark garment</div>
    <div style="width:300px">chest-tag scale</div>
  </div>`;

  return shell(
    'flickday — wordmark specimens, one-colour apparel (blind)',
    'Flat solid colour only — DTF prints glows and soft shadows as a muddy underbase. Ask: does the weight hold in both ink directions, and do the joins fill in at chest-tag scale.',
    css,
    head + refRow + specimens.map((s) => row(s.code)).join(''),
    fontFaces,
  );
}

async function shoot(page, html, out) {
  const tmp = join(OUT, '_tmp.html');
  writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // Measure, do not ask. `document.fonts` reported every face loaded while
  // the whole sheet rendered in the default serif, because the faces were
  // the devanagari subset — loaded, and useless for these glyphs. The only
  // honest check is whether the word is actually shaped differently from
  // the fallback it would otherwise use.
  const fellBack = await page.evaluate((word) => {
    const measure = (family) => {
      const el = document.createElement('span');
      el.textContent = word;
      el.style.cssText = `position:absolute;visibility:hidden;font-size:200px;font-family:${family}`;
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
  if (fellBack.length) {
    throw new Error(
      `These faces render identically to the serif fallback — they are not being used: ${fellBack.join(', ')}`,
    );
  }

  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1400, height: h });
  await page.screenshot({ path: out });
  console.log(`✓ ${out.split('/').pop()}  1400x${h}`);
}

mkdirSync(OUT, { recursive: true });
console.log('fetching faces…');
const { specimens, fontFaces } = await build();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
await shoot(page, screenSheet(specimens, fontFaces), join(OUT, 'specimens-screen.png'));
await shoot(page, apparelSheet(specimens, fontFaces), join(OUT, 'specimens-apparel.png'));
await browser.close();

writeFileSync(
  join(OUT, 'specimens-KEY.json'),
  JSON.stringify(
    {
      note: 'Blind-review key. Do not open until the sheet has been judged.',
      generated: new Date().toISOString(),
      specimens: specimens.map((s) => ({ code: s.code, family: s.family, weight: s.weight })),
    },
    null,
    2,
  ),
);
console.log('✓ specimens-KEY.json (sealed — judge the sheet first)');
