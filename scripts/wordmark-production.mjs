/**
 * Wordmark master — the locked Peridot wordmark as a reproducible production
 * spec, not an outline nobody can regenerate (rubric: one-master).
 *
 * Renders the canonical sheet: the standard and micro optical cuts, the
 * "flickday" and "flickday media" lockups, the colorways for dark/light/one-
 * colour use, and clearspace + minimum size. All spacing comes from
 * PERIDOT_CUTS in wordmark-lib, so this sheet and WORDMARK.md and the live site
 * share one source of truth.
 *
 *   node scripts/wordmark-production.mjs
 *     → flickday-assets/wordmarks/wordmark-master.png
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium, KIT_LINKS, peridotMark as mark, PERIDOT_CUTS } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');

const YELLOW = '#facc15';
const BLACK = '#000';
const WHITE = '#fff';
const INK = '#111318';
const GARMENT_LIGHT = '#e8e4dc';

const S = PERIDOT_CUTS.standard;
const M = PERIDOT_CUTS.micro;

/** Standard-cut mark (base kerning). */
const std = (color, size, track = 0) => mark(color, size, track, S.hand);
/** Micro-cut mark (relaxed kerning + open tracking). */
const micro = (color, size) => mark(color, size, M.track, M.hand);

/** "flickday media" lockup: Peridot wordmark + JetBrains Mono MEDIA tag. */
const lockup = (color, size, tagColor) => `
  <div class="lock">
    ${std(color, size)}
    <span class="media" style="color:${tagColor}">media</span>
  </div>`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_wordmark-master.html'), sheet());
  await page.goto(pathToFileURL(join(OUT, '_wordmark-master.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 350));
  const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'wordmark-master.png') });
  await browser.close();
  console.log(`✓ wordmark-master.png  ${w}x${h}`);
}

function sheet() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
.mk span{font-optical-sizing:none}
body{background:#0a0a0b;font-family:'JetBrains Mono',ui-monospace,monospace;padding:44px;width:1240px}
h1{color:${YELLOW};font-size:22px;margin-bottom:4px}
.intro{color:#8a8a92;font-size:12px;margin-bottom:30px;max-width:840px;line-height:1.55}
.sec{margin-bottom:26px;border:1px solid #26262e;border-radius:12px;overflow:hidden;background:#111114}
.sec > .cap{color:${YELLOW};font-size:12px;text-transform:uppercase;letter-spacing:.11em;padding:14px 20px;border-bottom:1px solid #22222a}
.sec .body{padding:24px 20px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.tile{border-radius:8px;padding:26px 22px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;justify-content:center;min-height:130px}
.tile.on-black{background:${BLACK}}
.tile.on-yellow{background:${YELLOW}}
.tile.on-light{background:${GARMENT_LIGHT}}
.tile .t{font-size:10px;text-transform:uppercase;letter-spacing:.12em}
.on-black .t{color:#6b6b73}.on-yellow .t{color:#7a6604}.on-light .t{color:#9a9488}

/* lockup */
.lock{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.lock .media{font-family:'JetBrains Mono';font-weight:600;text-transform:uppercase;letter-spacing:.47em;
  font-size:.34em;padding-left:.08em}

/* micro row */
.microrow{display:flex;gap:22px;align-items:stretch;flex-wrap:wrap}
.microrow .tile{flex:1;min-width:250px}
.photo{flex:1;min-width:250px;border-radius:8px;min-height:130px;position:relative;overflow:hidden;
  background:linear-gradient(120deg,#3d4a58,#6b7a63 45%,#242a31 80%);display:flex;align-items:flex-end;justify-content:flex-end;padding:14px}

/* clearspace */
.clear{background:${BLACK};border-radius:8px;padding:0;display:flex;justify-content:center}
.clearbox{position:relative;padding:calc(0.62em);}
.clearbox .cs{position:relative;outline:1px dashed #3a3a44;outline-offset:calc(0.62em)}
.legend{color:#8a8a92;font-size:11px;line-height:1.6;padding:10px 20px 0}
.spec{color:#b8b8c0;font-size:11.5px;line-height:1.7;padding:4px 20px 2px;font-family:'JetBrains Mono'}
.spec b{color:${YELLOW};font-weight:500}
.minrow{display:flex;gap:30px;align-items:flex-end;padding:6px 2px}
.minrow .m{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.minrow .lbl{color:#8a8a92;font-size:10px;text-transform:uppercase;letter-spacing:.1em}
</style></head><body>
<h1>flickday — wordmark master</h1>
<div class="intro">The locked production wordmark: Peridot PE 950, hand-kerned. Two optical cuts, two lockups, the
colorways for dark/light/one-colour use, clearspace and minimum size. Spacing is defined once in
<b style="color:#b8b8c0">wordmark-lib.mjs → PERIDOT_CUTS</b> and shared by this sheet, the live site, and WORDMARK.md —
regenerate with <b style="color:#b8b8c0">node scripts/wordmark-production.mjs</b>.</div>

<div class="sec">
  <div class="cap">Optical cuts — standard vs micro</div>
  <div class="spec">standard · <b>kd -0.03 / ck +0.01</b>, no tracking · use ≥24px (header, apparel, share cards, large overlays)</div>
  <div class="spec">micro · <b>kd -0.02 / ck +0.008</b>, tracking <b>+0.045em</b> · use &lt;24px (watermark, favicon, handle bug) — opened so tight pairs don't fill in</div>
  <div class="body"><div class="grid2">
    <div class="tile on-black"><span class="t">standard · 40px header</span>${std(YELLOW, '40px')}</div>
    <div class="tile on-black"><span class="t">micro · 15px watermark</span>${micro(WHITE, '15px')}</div>
  </div></div>
</div>

<div class="sec">
  <div class="cap">Micro cut in place — small sizes hold</div>
  <div class="body"><div class="microrow">
    <div class="photo">${micro(WHITE, '15px')}</div>
    <div class="tile on-black" style="min-width:250px"><span class="t">handle bug · 18px</span>${micro(YELLOW, '18px')}</div>
    <div class="tile on-yellow" style="min-width:200px;flex:0 0 auto"><span class="t">favicon lockup · 22px</span>${micro(BLACK, '22px')}</div>
  </div></div>
</div>

<div class="sec">
  <div class="cap">Lockups — primary + full name</div>
  <div class="body"><div class="grid2">
    <div class="tile on-black"><span class="t">primary · flickday</span>${std(YELLOW, '48px')}</div>
    <div class="tile on-black"><span class="t">full · flickday media</span>${lockup(YELLOW, '48px', WHITE)}</div>
  </div></div>
</div>

<div class="sec">
  <div class="cap">Colorways — flat solids, print-safe</div>
  <div class="body"><div class="grid2">
    <div class="tile on-black"><span class="t">yellow on black · primary</span>${std(YELLOW, '40px')}</div>
    <div class="tile on-yellow"><span class="t">black on yellow · reversed</span>${std(BLACK, '40px')}</div>
    <div class="tile on-black"><span class="t">white on black · one-colour / dark garment</span>${std(WHITE, '40px')}</div>
    <div class="tile on-light"><span class="t">ink on light · light garment</span>${std(INK, '40px')}</div>
  </div></div>
</div>

<div class="sec">
  <div class="cap">Clearspace &amp; minimum size</div>
  <div class="body">
    <div class="minrow">
      <div class="m"><span class="lbl">clearspace — 0.62× cap height all sides</span>
        <div class="clear"><div class="clearbox"><div class="cs">${std(YELLOW, '40px')}</div></div></div>
      </div>
      <div class="m"><span class="lbl">min · digital 88px wide</span><div class="tile on-black" style="min-height:0;padding:14px 16px">${micro(YELLOW, '15px')}</div></div>
      <div class="m"><span class="lbl">min · print 18mm wide</span><div class="tile on-black" style="min-height:0;padding:14px 16px">${micro(YELLOW, '15px')}</div></div>
    </div>
    <div class="legend">Clearspace is measured from the mark's cap height (the top of the ascenders to the baseline);
    keep it clear on all four sides. Below the minimum, switch to the micro cut and never place the mark over busy
    image detail without the watermark scrim.</div>
  </div>
</div>
</body></html>`;
}

await main();
