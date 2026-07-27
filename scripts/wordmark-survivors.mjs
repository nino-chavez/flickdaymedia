/**
 * Wordmark survivors — the full eight-candidate matrix.
 *
 * One master wordmark, used across every application, judged by reading DOWN a
 * column (one face at every size) so the test is whether its weakest row still
 * holds — not whoever wins a single row. Fonts are columns, intended uses are
 * rows; the sheet is sized to fill a MacBook viewport height and scrolls
 * left-to-right. Roster and measurement live in ./wordmark-lib.mjs.
 *
 *   node scripts/wordmark-survivors.mjs
 *     → flickday-assets/wordmarks/survivors.png
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  chromium,
  FACES,
  TARGETS,
  KIT_LINKS,
  YELLOW,
  INK,
  GARMENT_LIGHT,
  spans,
  prepareFaces,
  fontFacesCss,
  normalize,
  survivors,
} from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');

async function main() {
  await prepareFaces(FACES);
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  await normalize(browser, FACES, TARGETS);

  // Survivors of the l-foot rule lead; the cut faces trail, dimmed but kept so
  // the reasoning stays visible.
  const ordered = [...survivors(), ...FACES.filter((f) => f.lFoot !== 'straight')];
  const page = await browser.newPage({ viewport: { width: 3200, height: 900 }, deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_survivors.html'), sheet(fontFacesCss(FACES), ordered));
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

function sheet(fontFaces, faces) {
  const word = (f, target, track = 0) =>
    `<div class="w" style="font-size:${f.sizes[target].toFixed(3)}px${
      track ? `;letter-spacing:${track}em` : ''
    }">${spans(f.cssFamily, f.weight, f.variation, f.hand)}</div>`;

  // The no-curled-l-foot rule sorts the sheet: survivors (straight foot) full
  // strength and first, cut faces (curled foot) dimmed and trailing. Nothing is
  // deleted — the cut columns stay so the criterion is legible.
  const pass = (f) => f.lFoot === 'straight';

  const cols = (cellFor) =>
    faces.map((f) => `<div class="fc ${pass(f) ? 'pass' : 'fail'}">${cellFor(f)}</div>`).join('');

  const colHead = faces
    .map(
      (f) => `<div class="fc head ${pass(f) ? 'pass' : 'fail'}">
      <div class="rank">${pass(f) ? 'SURVIVES' : 'CUT · curled l'}</div>
      <div class="fname">${f.label}</div>
    </div>`,
    )
    .join('');
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
/* l-foot verdict: survivors full strength, cut faces dimmed. */
.fc.fail{opacity:.4}
.fc.head.pass .rank{color:${YELLOW};opacity:.95}
.fc.head.fail .rank{color:#e2725b;opacity:.9}
.fc.pass + .fc.fail,.fc.head.pass + .fc.head.fail{border-left:1px solid #3a2a2a}
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
<h1>flickday — one master wordmark, l-foot survivors first (scroll →)</h1>
<div class="sub">
  Choosing ONE wordmark used across every application — standard and micro optical cuts of a single face, not a
  different font per use. First filter: the <b>l-foot</b> rule — a curled l foot makes "fli" read as a fragmented
  "u", so those faces are cut (dimmed, kept for reference). The four <b>survivors</b> lead, full strength. Read
  <b>down</b> a column: it is one face at every size, so the test is whether its <b>weakest</b> row still holds, not
  whoever wins a single row. Production spacing (kd by hand, watermark tracked); every specimen its true CSS size,
  DPR-1 measured and verified after render.
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
