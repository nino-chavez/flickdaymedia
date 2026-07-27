/**
 * Wordmark pairing audit — Peridot beside every other face the site and assets
 * use, in the real adjacencies and at real size relationships, so any jarring
 * side-by-side is caught before the mark is committed.
 *
 * Companion faces (from the live index.html :root): Anton (display/headlines),
 * Inter (body), JetBrains Mono (labels/handles), Barlow Condensed (tags). Each
 * gets its real adjacency to the wordmark; a final panel stacks all of them in
 * one composition — the true "do they coexist" test.
 *
 *   node scripts/wordmark-pairing-audit.mjs
 *     → flickday-assets/wordmarks/pairing-audit.png
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium, KIT_LINKS, peridotMark as mark } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');

const YELLOW = '#facc15';
const BLACK = '#000';
const WHITE = '#fff';

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_pairing-audit.html'), sheet());
  await page.goto(pathToFileURL(join(OUT, '_pairing-audit.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 350));
  const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'pairing-audit.png') });
  await browser.close();
  console.log(`✓ pairing-audit.png  ${w}x${h}`);
}

function sheet() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--yellow:${YELLOW}}
.mk span{font-optical-sizing:none}
body{background:#0a0a0b;font-family:'JetBrains Mono',ui-monospace,monospace;padding:40px;width:1240px}
h1{color:${YELLOW};font-size:20px;margin-bottom:4px}
.intro{color:#888;font-size:12px;margin-bottom:26px;max-width:820px;line-height:1.5}
.pair{border:1px solid #26262e;border-radius:10px;margin-bottom:22px;overflow:hidden;background:#111114}
.pcap{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:13px 18px;border-bottom:1px solid #22222a}
.pcap .lhs{color:${YELLOW};font-size:12px;text-transform:uppercase;letter-spacing:.1em}
.pcap .watch{color:#7f7f88;font-size:11px}
.pbody{padding:22px 18px}
.scene{display:flex;gap:22px;flex-wrap:wrap;align-items:stretch}
.scene > div{border-radius:7px;overflow:hidden}

/* Companion type roles, exactly as the site declares them */
.anton{font-family:'Anton',Impact,sans-serif;text-transform:uppercase;letter-spacing:.01em;color:${WHITE}}
.inter{font-family:'Inter',system-ui,sans-serif;color:#d6d6da}
.mono{font-family:'JetBrains Mono',monospace;color:${WHITE}}
.barlow{font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;letter-spacing:.03em}

/* --- header bar (Peridot logo + Anton CTA) --- */
.hdr{flex:1;min-width:420px;background:${BLACK};display:flex;align-items:center;justify-content:space-between;padding:16px 22px}
.cta{font-family:'Anton';background:${YELLOW};color:${BLACK};padding:9px 16px;border-radius:6px;font-size:15px;letter-spacing:.02em}
/* --- poster stack (Peridot over Anton headline) --- */
.poster{flex:1;min-width:360px;background:${BLACK};padding:26px 24px;display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.poster .head{font-size:72px;line-height:.92}

/* --- Inter body block --- */
.about{flex:1;min-width:520px;background:${BLACK};padding:26px 24px;display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.about p{font-size:16px;line-height:1.62;max-width:620px}

/* --- mono contexts --- */
.overline{flex:1;min-width:360px;background:${BLACK};padding:26px 24px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.overline .ov{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:${YELLOW}}
.bug{min-width:300px;background:${BLACK};padding:26px 24px;display:flex;align-items:center}
.pill{display:inline-flex;align-items:center;gap:12px;background:#0d0d10;border:1px solid #26262e;border-radius:999px;padding:12px 20px}
.pill .h{font-size:15px;color:${WHITE}}

/* --- Barlow tag contexts --- */
.tags{flex:1;min-width:420px;background:${BLACK};padding:26px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.tag{background:${YELLOW};color:${BLACK};font-family:'Barlow Condensed';font-weight:600;font-size:15px;
  text-transform:uppercase;letter-spacing:.05em;padding:7px 14px;border-radius:5px;display:inline-flex;align-items:center;gap:8px}
.dot{width:7px;height:7px;border-radius:50%;background:${BLACK}}

/* --- full system --- */
.system{flex:1;min-width:100%;background:${BLACK};padding:34px 30px;display:flex;flex-direction:column;gap:18px;align-items:flex-start}
.system .kicker{font-family:'JetBrains Mono';font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:${YELLOW}}
.system .head{font-family:'Anton';text-transform:uppercase;color:${WHITE};font-size:58px;line-height:.95;letter-spacing:.01em}
.system p{font-family:'Inter';font-size:15px;line-height:1.6;color:#c9c9cf;max-width:640px}
.system .foot{display:flex;align-items:center;gap:18px;margin-top:6px;flex-wrap:wrap}
</style></head><body>
<h1>flickday — wordmark pairing audit · Peridot beside every site face</h1>
<div class="intro">Peridot PE 950 (the locked wordmark) shown in its real adjacency to each companion face the site declares —
Anton, Inter, JetBrains Mono, Barlow Condensed — at true size relationships and on the site's black. The last panel puts
all of them in one composition. What to watch is noted per row.</div>

<div class="pair">
  <div class="pcap"><span class="lhs">Peridot × Anton — header + poster</span><span class="watch">both heavy/loud — do they fight, or split display vs signature?</span></div>
  <div class="pbody"><div class="scene">
    <div class="hdr">${mark(YELLOW, '30px')}<span class="cta">BOOK US</span></div>
    <div class="poster">${mark(YELLOW, '34px')}<div class="anton head">Every day's<br>a flickday</div></div>
  </div></div>
</div>

<div class="pair">
  <div class="pcap"><span class="lhs">Peridot × Inter — wordmark over body copy</span><span class="watch">950→400 weight jump — clean hierarchy or disconnect?</span></div>
  <div class="pbody"><div class="scene">
    <div class="about">${mark(YELLOW, '44px')}
      <p class="inter">Grassroots sports media — raw, fast, player-first. Flickday Media covers the Chicago volleyball
      community courtside: tournaments, clubs, and the moments the big outlets miss. Every day's a flickday.</p>
    </div>
  </div></div>
</div>

<div class="pair">
  <div class="pcap"><span class="lhs">Peridot × JetBrains Mono — handle bug + overline</span><span class="watch">geometric vs monospaced — reads intentional or mismatched?</span></div>
  <div class="pbody"><div class="scene">
    <div class="overline"><span class="mono ov">Chicago · Grassroots Volleyball</span>${mark(YELLOW, '40px')}</div>
    <div class="bug"><div class="pill">${mark(YELLOW, '22px')}<span class="mono h">@flickday.media</span></div></div>
  </div></div>
</div>

<div class="pair">
  <div class="pcap"><span class="lhs">Peridot × Barlow Condensed — tags beside the mark</span><span class="watch">wide geometric vs narrow condensed — proportion clash?</span></div>
  <div class="pbody"><div class="scene">
    <div class="tags">${mark(YELLOW, '34px')}
      <span class="tag"><span class="dot"></span>Now Booking 2026</span>
      <span class="tag">Tournament Coverage</span>
    </div>
  </div></div>
</div>

<div class="pair">
  <div class="pcap"><span class="lhs">Full system — all faces, one composition</span><span class="watch">the real test: do five faces read as one brand?</span></div>
  <div class="pbody"><div class="scene">
    <div class="system">
      <span class="kicker">Every Day's a Flickday</span>
      <div class="head">Grassroots sports<br>media, courtside</div>
      <p>Raw, fast, player-first coverage of the Chicago volleyball community — the moments the big outlets miss.</p>
      <div class="foot">${mark(YELLOW, '30px')}<span class="tag">Now Booking 2026</span><span class="mono" style="font-size:14px;color:#9a9aa2">@flickday.media</span></div>
    </div>
  </div></div>
</div>
</body></html>`;
}

await main();
