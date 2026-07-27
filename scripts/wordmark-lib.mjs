/**
 * Wordmark comparison engine — the candidate roster plus the ink-normalisation
 * machinery, shared by every specimen view.
 *
 * A wordmark's on-site size is fixed by its rendered INK height, not its
 * font-size, so faces are only comparable when scaled to equal measured ink at
 * each real-world size. Measuring that reliably is the hard part and it lives
 * here once: rasterise "flickday", scan lit pixel rows, correct the font-size
 * until the ink height lands on target. Every view imports this — no view
 * re-implements the measurement.
 *
 * HAND offsets are in em, one per inter-letter gap of "flickday":
 *   [ f|l , l|i , i|c , c|k , k|d , d|a , a|y ]
 * Negative closes a pair, positive opens it. Tuned by eye against the render,
 * never computed (round 1's algorithm drove kd to -0.11em, twice the ck move).
 */
import { createRequire } from 'node:module';

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json');
export const { chromium } = require('playwright');

export const WORD = 'flickday';
export const YELLOW = '#facc15';
export const INK = '#111318';
export const GARMENT_LIGHT = '#e8e4dc';

// Two kits: tgm3xnd carries Roc; fju5pyz the eight variable display faces.
// Family names are distinct across both, so linking both is safe. Google
// (Schibsted) is fetched and embedded per-view.
export const KITS = ['https://use.typekit.net/tgm3xnd.css', 'https://use.typekit.net/fju5pyz.css'];
export const KIT_LINKS = KITS.map((u) => `<link rel="stylesheet" href="${u}">`).join('');

// The intended-use sizes, from the live site.
export const TARGETS = { header: 40, mob: 30, wm: 15, app: 32 };

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// Eight faces. `lFoot` is the operator-judged verdict on the no-curled-l-foot
// rule (ledger id no-curled-l-foot): a curled l foot makes "fli" read as a
// fragmented "u", so only 'straight' faces survive. `hand` (kd/ck) is the
// large-size spacing fix, `wmTrack` the small-size one at 15px. Spacing is
// still provisional — the real tuning is the kd/ck/track matrix once the field
// is down to the final few.
export const FACES = [
  { id: 'config', label: 'Config 900', cssFamily: 'config-variable', weight: 900, kit: true, lFoot: 'curved', hand: [0, 0, 0, 0.01, -0.035, 0, 0], wmTrack: 0.03 },
  {
    id: 'schibsted',
    label: 'Schibsted Grotesk 900',
    google: 'Schibsted+Grotesk:wght@900',
    cssFamily: null,
    weight: 900,
    lFoot: 'curved',
    hand: [0.01, 0, 0, 0.012, -0.05, 0, 0],
    wmTrack: 0.02,
  },
  { id: 'peridot', label: 'Peridot PE 950', cssFamily: 'peridot-pe-variable', weight: 950, kit: true, lFoot: 'straight', hand: [0, 0, 0, 0.01, -0.03, 0, 0], wmTrack: 0.03 },
  {
    id: 'roc',
    label: 'Roc Grotesk (normal)',
    cssFamily: 'roc-grotesk-variable',
    weight: 800,
    kit: true,
    variation: "'wdth' 104",
    lFoot: 'straight',
    hand: [0, 0, 0, 0.012, -0.025, 0, -0.01],
    wmTrack: 0.035,
  },
  { id: 'latino', label: 'Latino Gothic 100 (axis max, wide)', cssFamily: 'latino-gothic-variable', weight: 100, kit: true, lFoot: 'straight', hand: [0, 0, 0, 0.008, -0.03, 0, 0], wmTrack: 0.035 },
  { id: 'nextexit', label: 'Next Exit 900', cssFamily: 'nextexit-variable', weight: 900, kit: true, lFoot: 'curved', hand: [0, 0, 0, 0.01, -0.035, 0, 0], wmTrack: 0.03 },
  { id: 'bananas', label: 'Bananas 800 (axis max)', cssFamily: 'bananas-variable', weight: 800, kit: true, lFoot: 'straight', hand: [0, 0, 0, 0.01, -0.03, 0, 0], wmTrack: 0.03 },
  { id: 'ivyepic', label: 'IvyEpic 900', cssFamily: 'ivyepic-variable', weight: 900, kit: true, lFoot: 'curved', hand: [0, 0, 0, 0.01, -0.03, 0, 0], wmTrack: 0.03 },
];

/** Survivors of the no-curled-l-foot rule, in roster order. */
export const survivors = () => FACES.filter((f) => f.lFoot === 'straight');

/** Pick a subset of the roster by id, preserving the requested order. */
export const facesByIds = (ids) => ids.map((id) => FACES.find((f) => f.id === id)).filter(Boolean);

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

/** Embed any Google-hosted faces as base64 @font-face so they render offline. */
export async function prepareFaces(faces) {
  for (const f of faces) {
    if (f.google) {
      const b64 = await fetchFace(f.google);
      f.cssFamily = f.id;
      f.css = `@font-face{font-family:'${f.id}';font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
    }
    console.log(`  ready ${f.label}`);
  }
}

/** The concatenated @font-face CSS for a face set (empty for kit/Google-live faces). */
export const fontFacesCss = (faces) => faces.map((f) => f.css ?? '').join('\n');

/** One word as per-letter spans, with an em offset applied to each gap. */
export function spans(cssFamily, weight, variation, hand) {
  return [...WORD]
    .map((ch, i) => {
      const gap = i > 0 && hand[i - 1] ? `margin-left:${hand[i - 1]}em;` : '';
      const v = variation ? `font-variation-settings:${variation};` : '';
      return `<span style="font-family:'${cssFamily}';font-weight:${weight};font-optical-sizing:none;${v}${gap}">${ch}</span>`;
    })
    .join('');
}

// The locked wordmark, for reuse across mock/audit/production views.
export const PERIDOT = FACES.find((f) => f.id === 'peridot');

// Optical cuts — the production spacing for the locked wordmark. Standard is the
// base hand kerning; micro relaxes the k|d close and opens tracking so the mark
// stays legible at watermark/favicon sizes where tight pairs muddy.
export const PERIDOT_CUTS = {
  standard: { hand: PERIDOT.hand, track: 0 },
  micro: { hand: [0, 0, 0, 0.008, -0.02, 0, 0], track: 0.045 },
};

/**
 * Peridot "flickday" as a kerned inline mark. `track` opens small-size spacing;
 * `hand` overrides the gap kerning (pass a cut's hand for the micro variant).
 */
export function peridotMark(color, fontSize, track = 0, hand = PERIDOT.hand) {
  return `<span class="mk" style="color:${color};font-size:${fontSize};${
    track ? `letter-spacing:${track}em;` : ''
  }">${spans(PERIDOT.cssFamily, PERIDOT.weight, PERIDOT.variation, hand)}</span>`;
}

// Ink height per face at a chosen font-size, measured by rasterising and
// counting lit pixel rows. Runs on a DEDICATED deviceScaleFactor:1 page: the
// box coordinates come from getBoundingClientRect (CSS px), so the screenshot
// canvas must be 1:1 with CSS px or the scan window lands on the wrong rows —
// which on a dsf:2 page silently mixes each face with its neighbour and halves
// the real sizes. Each face gets a tall, well-separated band so no face's ink
// can bleed into another's scan window.
export async function measureAt(browser, faces, sizeFor) {
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
    ([w, list]) =>
      list.map((f) => {
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

  const scanPage = await browser.newPage();
  const ink = await scanPage.evaluate(
    async ([b64, scanBoxes]) => {
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
      for (const b of scanBoxes) {
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
  await scanPage.close();
  return ink;
}

export const measureInk = (browser, faces) => measureAt(browser, faces, () => 200);

// Exact font-size each face needs to hit each target ink height. Linear scaling
// from one 200px measurement drifts 1-2px at small sizes because the antialias
// fringe is a near-constant pixel, not a constant fraction. Start from the
// linear estimate, measure, correct until within a pixel.
export async function calibrateSizes(browser, faces, targets) {
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

/**
 * Full normalisation for a face set: measure ink@200, calibrate a font-size per
 * target, then re-measure the calibrated sizes and throw if any face is off by
 * more than a pixel. Mutates each face with `ink200` and `sizes`.
 */
export async function normalize(browser, faces, targets) {
  const ink = await measureInk(browser, faces);
  for (const f of faces) f.ink200 = ink[f.id];
  console.log('  ink@200: ' + faces.map((f) => `${f.id}=${ink[f.id]}`).join(' '));

  const sizes = await calibrateSizes(browser, faces, targets);
  for (const f of faces) f.sizes = sizes[f.id];

  for (const [name, target] of Object.entries(targets)) {
    const got = await measureAt(browser, faces, (f) => f.sizes[name]);
    const off = Object.entries(got).filter(([, v]) => Math.abs(v - target) > 1);
    if (off.length) {
      throw new Error(`${name} not normalised to ${target}px: ${off.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    }
    console.log(`  verified ${name}@${target}px: ${Object.entries(got).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }
}
