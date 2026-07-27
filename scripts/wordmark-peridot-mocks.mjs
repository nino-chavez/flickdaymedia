/**
 * Peridot in real application — the locked wordmark, mocked onto the live site
 * and the existing asset types so the choice is judged against reality, not a
 * specimen sheet.
 *
 * Two outputs:
 *   mocks-peridot-site.png   the actual index.html with the header logo swapped
 *                            for a Peridot "flickday" (desktop + mobile widths)
 *   mocks-peridot-assets.png a board of the existing asset types — photo
 *                            watermark, DTF apparel (dark + light garment),
 *                            social handle bug, and the 1200×675 OG share card
 *
 * Brand is harvested from the live site (BRAND-PRIORS: the site wins): black +
 * Flickday yellow #facc15, Anton display, Inter body, JetBrains Mono labels.
 * The wordmark is Peridot PE 950 with its hand kerning from wordmark-lib.
 *
 *   node scripts/wordmark-peridot-mocks.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium, KIT_LINKS, peridotMark as mark } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');
const INDEX = join(ROOT, 'index.html');
const PHOTO = join(ROOT, 'images', 'gallery', 'portfolio-06.jpg');
const PLAY = join(ROOT, 'flickday-assets', 'brand', 'icon-play.svg');

const YELLOW = '#facc15';
const INK = '#111318';
const GARMENT_LIGHT = '#e8e4dc';
const GARMENT_DARK = '#1a1a1e';

async function siteMock(browser) {
  // Load the real page; inject the Peridot kit; replace the header logo <img>
  // with a live Peridot wordmark; force the header visible; screenshot the top.
  async function shot(width, label) {
    const page = await browser.newPage({ viewport: { width, height: 760 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(INDEX).href, { waitUntil: 'networkidle' });
    await page.evaluate(
      ([kitLinks, markHTML]) => {
        document.head.insertAdjacentHTML('beforeend', kitLinks);
        const logo = document.querySelector('.site-header__logo');
        if (logo) {
          const span = document.createElement('span');
          span.innerHTML = markHTML;
          span.style.cssText = 'display:inline-flex;align-items:center;line-height:1;height:40px';
          logo.replaceWith(span);
        }
        const header = document.querySelector('.site-header');
        if (header) header.classList.add('visible');
      },
      [KIT_LINKS, mark(YELLOW, '38px')],
    );
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 350));
    const clip = width < 500 ? { x: 0, y: 0, width, height: 620 } : { x: 0, y: 0, width, height: 560 };
    const buf = await page.screenshot({ clip });
    await page.close();
    return { buf, label, width };
  }

  const desktop = await shot(1440, 'site header · desktop 1440');
  const mobile = await shot(390, 'site header · mobile 390');

  // Compose the two screenshots onto a labelled dark board.
  const b64 = (s) => s.toString('base64');
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0b;font-family:'JetBrains Mono',ui-monospace,monospace;padding:40px;width:max-content}
h1{color:${YELLOW};font-size:20px;margin-bottom:4px}
.sub{color:#888;font-size:12px;margin-bottom:26px}
.cap{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px 2px}
.frame{border:1px solid #26262e;border-radius:8px;overflow:hidden;margin-bottom:28px;background:#000}
.frame img{display:block}
.row{display:flex;gap:26px;align-items:flex-start}
</style></head><body>
<h1>flickday — Peridot on the live site</h1>
<div class="sub">Real index.html, header logo swapped for Peridot PE 950 in Flickday yellow. Nothing else changed.</div>
<div class="row">
  <div><div class="cap">${desktop.label}</div><div class="frame"><img src="data:image/png;base64,${b64(
    desktop.buf,
  )}" style="width:${desktop.width * 0.62}px"></div></div>
  <div><div class="cap">${mobile.label}</div><div class="frame"><img src="data:image/png;base64,${b64(
    mobile.buf,
  )}" style="width:${mobile.width * 0.86}px"></div></div>
</div>
</body></html>`;
  writeFileSync(join(OUT, '_mocks-site.html'), html);
  await page.goto(pathToFileURL(join(OUT, '_mocks-site.html')).href, { waitUntil: 'networkidle' });
  const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'mocks-peridot-site.png') });
  await page.close();
  console.log(`✓ mocks-peridot-site.png  ${w}x${h}`);
}

async function assetsMock(browser) {
  const photoUrl = pathToFileURL(PHOTO).href;
  const playUrl = pathToFileURL(PLAY).href;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0b;font-family:'JetBrains Mono',ui-monospace,monospace;padding:40px;width:1360px}
.mk span{font-optical-sizing:none}
h1{color:${YELLOW};font-size:20px;margin-bottom:4px}
.sub{color:#888;font-size:12px;margin-bottom:28px;max-width:760px;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.panel{background:#111114;border:1px solid #26262e;border-radius:10px;overflow:hidden}
.panel .cap{color:#8a8a92;font-size:11px;text-transform:uppercase;letter-spacing:.1em;padding:14px 16px 0}
.panel .body{padding:16px}
.wide{grid-column:1 / -1}

/* Photo watermark */
.photo{position:relative;height:300px;border-radius:6px;overflow:hidden;
  background:url('${photoUrl}') center/cover}
.photo .bug{position:absolute;right:14px;bottom:12px;display:inline-flex;align-items:center;gap:7px}
.photo .bug .mk{filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))}

/* Apparel */
.tees{display:flex;gap:16px}
.tee{flex:1;height:280px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px}
.tee.dark{background:
  repeating-linear-gradient(45deg,#17171b,#17171b 2px,#191920 2px,#191920 4px),${GARMENT_DARK}}
.tee.light{background:
  repeating-linear-gradient(45deg,#e3dfd6,#e3dfd6 2px,#ece8df 2px,#ece8df 4px),${GARMENT_LIGHT}}
.tee .glabel{font-size:10px;text-transform:uppercase;letter-spacing:.12em}
.tee.dark .glabel{color:#777}
.tee.light .glabel{color:#9a9488}

/* Social handle bug */
.socialwrap{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;gap:10px;background:#000;border:1px solid #26262e;
  border-radius:999px;padding:11px 18px}
.pill img{width:20px;height:20px;display:block}
.pill .handle{color:#fff;font-size:14px;font-weight:500}
.pill.lite{background:${YELLOW};border:none}
.pill.lite .handle{color:#000}
.avatar{width:96px;height:96px;border-radius:22px;background:#000;display:flex;align-items:center;
  justify-content:center;border:1px solid #26262e}
.avatar .mk{transform:translateY(0)}

/* OG card 1200x675 -> scaled */
.og{width:1200px;height:675px;position:relative;transform-origin:top left;transform:scale(.5);
  border-radius:4px;overflow:hidden;background:#000}
.ogwrap{width:${Math.round(1200 * 0.5)}px;height:${Math.round(675 * 0.5)}px;margin:0 auto;overflow:hidden}
.og .bg{position:absolute;inset:0;background:url('${photoUrl}') center/cover}
.og .scrim{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.85) 30%,rgba(0,0,0,.15))}
.og .content{position:absolute;left:70px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:22px}
.og .kicker{font-family:'JetBrains Mono';color:${YELLOW};font-size:22px;letter-spacing:.18em;text-transform:uppercase}
.og .tag{font-family:'Anton';color:#fff;font-size:64px;line-height:.98;text-transform:uppercase;letter-spacing:.01em;max-width:640px}

/* Reel / story overlay 1080x1920 -> scaled. Transform keeps the pre-scale
   layout box, so the wrapper is sized to the SCALED dims (overflow hidden) and
   centred, or the 1080px child would pin top-left and blow out the panel. */
.story{width:1080px;height:1920px;position:relative;transform-origin:top left;transform:scale(.19);
  border-radius:10px;overflow:hidden;background:#000}
.storywrap{width:${Math.round(1080 * 0.19)}px;height:${Math.round(1920 * 0.19)}px;margin:0 auto;overflow:hidden}
.story .bg{position:absolute;inset:0;background:url('${photoUrl}') center/cover}
.story .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.9) 8%,transparent 42%)}
.story .lower{position:absolute;left:64px;right:64px;bottom:120px;display:flex;flex-direction:column;gap:44px}
.story .counter{font-family:'JetBrains Mono';color:${YELLOW};font-size:40px;letter-spacing:.14em;text-transform:uppercase}
.story .sbug{display:inline-flex;align-items:center;gap:24px}
.story .sbug img{width:56px;height:56px}
.story .sbug .h{font-family:'JetBrains Mono';color:#fff;font-size:40px}
</style></head><body>
<h1>flickday — Peridot across the asset system</h1>
<div class="sub">The locked wordmark (Peridot PE 950, hand-kerned) in the real applications from BRAND-PRIORS: photo
watermark, DTF apparel on dark and light garments (flat solids, no glows), the social handle bug and avatar, and the
1200×675 share card. Palette and supporting type are the live site's — Anton, Inter, JetBrains Mono, yellow on black.</div>

<div class="grid">
  <div class="panel">
    <div class="cap">photo watermark · corner bug</div>
    <div class="body"><div class="photo"><div class="bug">${mark(
      '#ffffff',
      '20px',
      0.03,
    )}</div></div></div>
  </div>

  <div class="panel">
    <div class="cap">DTF apparel · dark + light garment</div>
    <div class="body"><div class="tees">
      <div class="tee dark">${mark(YELLOW, '40px')}<span class="glabel">yellow ink · dark tee</span></div>
      <div class="tee light">${mark(INK, '40px')}<span class="glabel">ink · light tee</span></div>
    </div></div>
  </div>

  <div class="panel">
    <div class="cap">social handle bug · avatar</div>
    <div class="body"><div class="socialwrap">
      <div class="avatar">${mark(YELLOW, '30px')}</div>
      <div class="pill"><img src="${playUrl}" alt="play"><span class="handle">@flickday.media</span></div>
      <div class="pill lite"><span class="handle">@flickday.media</span></div>
    </div></div>
  </div>

  <div class="panel">
    <div class="cap">wordmark on black · header lockup</div>
    <div class="body" style="height:280px;display:flex;align-items:center;justify-content:center;background:#000;border-radius:6px">
      ${mark(YELLOW, '52px')}
    </div>
  </div>

  <div class="panel">
    <div class="cap">og / share card · 1200×675</div>
    <div class="body"><div class="ogwrap"><div class="og">
      <div class="bg"></div><div class="scrim"></div>
      <div class="content">
        <div class="kicker">Every Day's a Flickday</div>
        <div class="tag">Grassroots sports media — raw, fast, player-first</div>
        <div>${mark(YELLOW, '58px')}</div>
      </div>
    </div></div></div>
  </div>

  <div class="panel">
    <div class="cap">reel / story overlay · 1080×1920</div>
    <div class="body"><div class="storywrap"><div class="story">
      <div class="bg"></div><div class="scrim"></div>
      <div class="lower">
        <div class="counter">Day 214 / 365</div>
        <div>${mark('#ffffff', '96px', 0.02)}</div>
        <div class="sbug"><img src="${playUrl}" alt="play"><span class="h">@flickday.media</span></div>
      </div>
    </div></div></div>
  </div>
</div>
</body></html>`;

  writeFileSync(join(OUT, '_mocks-assets.html'), html);
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(join(OUT, '_mocks-assets.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));
  const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'mocks-peridot-assets.png') });
  await page.close();
  console.log(`✓ mocks-peridot-assets.png  ${w}x${h}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  await siteMock(browser);
  await assetsMock(browser);
  await browser.close();
}

await main();
