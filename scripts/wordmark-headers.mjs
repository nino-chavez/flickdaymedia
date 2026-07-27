/**
 * Header face-off — a focused look at a few faces in the header context only.
 *
 * The full survivors matrix compares eight faces across four uses; this is the
 * detail view for a shortlist in the ONE use where the wordmark carries the
 * most weight — the site header. Each face is shown large (for reading the
 * letterforms) and at its true 40px header size (for the real-use check), all
 * ink-normalised so height is equal and only the shapes differ. Left-aligned
 * and stacked so the eye runs straight down the same letters.
 *
 * Default set is the current header shortlist; override with ids:
 *   node scripts/wordmark-headers.mjs
 *   node scripts/wordmark-headers.mjs config peridot roc
 *     → flickday-assets/wordmarks/headers.png
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  chromium,
  facesByIds,
  KIT_LINKS,
  YELLOW,
  spans,
  prepareFaces,
  fontFacesCss,
  normalize,
} from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');

// The requested shortlist, in requested order.
const DEFAULT_IDS = ['nextexit', 'peridot', 'config', 'bananas'];
const HEADER_TARGETS = { big: 96, header: 40 };

async function main() {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_IDS;
  const faces = facesByIds(ids);
  const missing = ids.filter((id) => !faces.some((f) => f.id === id));
  if (missing.length) throw new Error(`Unknown face id(s): ${missing.join(', ')}`);

  await prepareFaces(faces);
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  await normalize(browser, faces, HEADER_TARGETS);

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_headers.html'), sheet(fontFacesCss(faces), faces));
  await page.goto(pathToFileURL(join(OUT, '_headers.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const { w, h } = await page.evaluate(() => ({
    w: document.body.scrollWidth,
    h: document.body.scrollHeight,
  }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'headers.png') });
  await browser.close();
  console.log(`✓ headers.png  ${w}x${h}`);
}

function sheet(fontFaces, faces) {
  const word = (f, target) =>
    `<div class="w" style="font-size:${f.sizes[target].toFixed(3)}px">${spans(
      f.cssFamily,
      f.weight,
      f.variation,
      f.hand,
    )}</div>`;

  const rows = faces
    .map(
      (f) => `<div class="row">
      <div class="meta"><div class="fname">${f.label}</div></div>
      <div class="big">${word(f, 'big')}</div>
      <div class="true"><div class="tlabel">true header · 40px</div>${word(f, 'header')}</div>
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}<style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{background:#0f0f12;color:#fff;font-family:ui-monospace,monospace;width:max-content;padding:34px 40px}
h1{color:${YELLOW};font-size:19px;margin-bottom:3px}
.sub{font-size:12px;opacity:.6;margin-bottom:22px;line-height:1.5;max-width:760px}
.row{display:flex;align-items:center;gap:30px;padding:22px 0;border-bottom:1px solid #1c1c22}
.meta{width:190px;flex:none}
.fname{font-size:12px;color:${YELLOW};line-height:1.4}
.big{width:560px;flex:none;display:flex;align-items:center}
.true{flex:none;display:flex;flex-direction:column;gap:8px;align-items:flex-start;
  border-left:1px solid #26262e;padding-left:30px}
.tlabel{font-size:9px;text-transform:uppercase;letter-spacing:.1em;opacity:.45}
.w{color:${YELLOW};line-height:1;white-space:nowrap}
</style></head><body>
<h1>flickday — header face-off (${faces.map((f) => f.id).join(' · ')})</h1>
<div class="sub">
  One use only: the site header, yellow on the dark shell. Big specimen for reading the letterforms, the true 40px
  header beside it for the real-use check. All ink-normalised — equal height, only the shapes differ. Production
  kerning (kd by hand); every specimen its true CSS size, DPR-1 measured and verified after render.
</div>
${rows}
</body></html>`;
}

await main();
