/**
 * Glyph QC — a large look at one letter run, for judging terminals and
 * junctions (does the l-foot curl into the i? does k collide with d?).
 *
 * This is a shape check, not a sizing decision: every face is shown at the same
 * font-size so the letterforms are big and legible, deliberately NOT
 * ink-normalised (that is the survivors sheet's job). Reuses the roster and
 * font-loading from ./wordmark-lib.mjs.
 *
 *   node scripts/wordmark-glyph.mjs                # "flick", all eight
 *   node scripts/wordmark-glyph.mjs fli config peridot roc
 *     → flickday-assets/wordmarks/glyph.png
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  chromium,
  FACES,
  facesByIds,
  KIT_LINKS,
  YELLOW,
  prepareFaces,
  fontFacesCss,
} from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');
const SIZE = 220; // font-size px, shared across faces for shape comparison

async function main() {
  const rawArgs = process.argv.slice(2);
  // First arg is the letter run if it isn't a known face id.
  const knownIds = new Set(FACES.map((f) => f.id));
  const run = rawArgs.length && !knownIds.has(rawArgs[0]) ? rawArgs.shift() : 'flick';
  const faces = rawArgs.length ? facesByIds(rawArgs) : FACES;

  await prepareFaces(faces);
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_glyph.html'), sheet(fontFacesCss(faces), faces, run));
  await page.goto(pathToFileURL(join(OUT, '_glyph.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const { w, h } = await page.evaluate(() => ({
    w: document.body.scrollWidth,
    h: document.body.scrollHeight,
  }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'glyph.png') });
  await browser.close();
  console.log(`✓ glyph.png  ${w}x${h}  ("${run}", ${faces.length} faces)`);
}

function sheet(fontFaces, faces, run) {
  const glyphs = (f) =>
    [...run]
      .map((ch) => {
        const v = f.variation ? `font-variation-settings:${f.variation};` : '';
        return `<span style="font-family:'${f.cssFamily}';font-weight:${f.weight};font-optical-sizing:none;${v}">${ch}</span>`;
      })
      .join('');

  const rows = faces
    .map(
      (f) => `<div class="row">
      <div class="fname">${f.label}</div>
      <div class="run">${glyphs(f)}</div>
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}<style>
*{margin:0;padding:0;box-sizing:border-box}
${fontFaces}
body{background:#0f0f12;color:#fff;font-family:ui-monospace,monospace;width:max-content;padding:34px 40px}
h1{color:${YELLOW};font-size:19px;margin-bottom:18px}
.row{display:flex;align-items:center;gap:34px;padding:16px 0;border-bottom:1px solid #1c1c22}
.fname{width:210px;flex:none;font-size:12px;color:${YELLOW}}
.run{font-size:${SIZE}px;line-height:1.05;color:${YELLOW};white-space:nowrap}
</style></head><body>
<h1>flickday — glyph QC · "${run}" · same font-size, shapes only</h1>
${rows}
</body></html>`;
}

await main();
