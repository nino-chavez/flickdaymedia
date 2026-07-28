/**
 * Social kit — the Peridot wordmark as the shippable social assets: corner bugs,
 * handle badges, avatar, transparent overlay frames for reels/stories/feed, and
 * the OG share card.
 *
 * Per-asset by design (BRAND-PRIORS: "no god-module"). Each group renders
 * independently so tweaking the reel overlay doesn't re-stamp the OG card:
 *
 *   node scripts/social-kit.mjs            # everything
 *   node scripts/social-kit.mjs bug        # corner watermarks only
 *   node scripts/social-kit.mjs handle avatar overlay og proof
 *
 * Everything ships as PNG. The wordmark is live Peridot text rendered to a
 * raster — outlines are never extracted, so the Adobe Fonts licence question
 * never arises (same rule as the play marks in ../flickday-assets/wordmarks).
 * Spacing comes from wordmark-lib's PERIDOT_CUTS, the single source of truth
 * shared with the live site and WORDMARK.md.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium, KIT_LINKS, peridotMark, PERIDOT_CUTS, YELLOW, INK } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'social');
const SYMBOL_PLAY = join(ROOT, 'flickday-assets', 'wordmarks', 'symbol-play.svg');
// Pages are built with setContent, which leaves the document on an about:blank
// origin — file:// subresources are blocked there and load as nothing. Anything
// the proof sheet composites has to be inlined as a data URI.
const dataUri = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const PHOTO_FEED = dataUri(join(ROOT, 'images', 'gallery', 'portfolio-06.jpg'), 'image/jpeg');
const PHOTO_REEL = dataUri(
  join(ROOT, 'motion', 'flickday-overlay-kit', 'assets', 'proof-footage.jpg'),
  'image/jpeg',
);

const WHITE = '#ffffff';
const BLACK = '#000000';
const HANDLE = '@flickday.media';

// Safe areas, harvested from this project's own validated 1080×1920 motion
// compositions (motion/flickday-overlay-kit/compositions/*.html) rather than
// recalled platform numbers. The highlight stamp sits at top 300; the lower
// third's box ends at 1650, i.e. 270 off the bottom; left margin is 84. The
// right inset is widened to 180 to clear the like/comment/share rail, which the
// lower third avoids by being only 716 wide.
const SAFE_REEL = { l: 84, r: 180, t: 300, b: 270 };
// Feed posts have no platform chrome over the image — only the caption below —
// so they take an even margin instead.
const SAFE_FEED = { l: 60, r: 60, t: 60, b: 60 };

// The yellow editorial seam is the kit's recurring graphic device (12px wide,
// full height of the block it marks). Carried into the static overlays so the
// still frames and the motion overlays read as one system.
const SEAM_W = 12;

// A phone renders a 1080-wide export at roughly 390 CSS px, so a mark's on-screen
// size is ~0.36× its canvas size. WORDMARK.md's 24px standard/micro crossover is
// an on-screen number, which puts the crossover at ~66px of canvas.
const PHONE_SCALE = 390 / 1080;
const cutFor = (px) => (px * PHONE_SCALE >= 24 ? 'standard' : 'micro');

/** The wordmark at a canvas size, with the optical cut its on-screen size demands. */
function socialMark(color, px) {
  const c = PERIDOT_CUTS[cutFor(px)];
  return peridotMark(color, `${px}px`, c.track, c.hand);
}

// The play chip's geometry, read from the one file that owns it so the two can't
// drift. It is hand-drawn vector, not a glyph — no font outlines involved.
const PLAY_D = /<path[^>]*\sd="([^"]+)"/s.exec(readFileSync(SYMBOL_PLAY, 'utf8'))[1];
const chip = (size, color) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 120 120" aria-hidden="true" style="display:block">` +
  `<path fill="${color}" fill-rule="evenodd" d="${PLAY_D}"/></svg>`;

/** Chip + wordmark on one baseline — the corner watermark lockup. */
const lockup = (color, px) =>
  `<span class="lockup" style="gap:${(px * 0.34).toFixed(1)}px">${chip(Math.round(px * 1.05), color)}${socialMark(
    color,
    px,
  )}</span>`;

/** Chip + @handle — the social badge. */
const badge = (px, fg, chipColor = fg) =>
  `<span class="badge" style="gap:${(px * 0.62).toFixed(1)}px">${chip(Math.round(px * 1.35), chipColor)}` +
  `<span class="handle" style="font-size:${px}px;color:${fg}">${HANDLE}</span></span>`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent}
.mk span{font-optical-sizing:none}
.mk{display:inline-block;line-height:1;white-space:nowrap}
.lockup,.badge{display:inline-flex;align-items:center;line-height:1;white-space:nowrap}
.handle{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:500;line-height:1;letter-spacing:.01em}
.seam{display:block;background:${YELLOW};width:${SEAM_W}px;border-radius:1px}
`;

const HEAD = `<!DOCTYPE html><html><head><meta charset="utf-8">${KIT_LINKS}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet">
<style>${CSS}`;

// Shot elements are spaced further apart than shotElements' PAD so a neighbour's
// ink can never land inside another's scan region.
const SHOT_LAYOUT = '[data-shot]{display:inline-block;margin:130px}';

const page = (extraCss, body, bodyStyle = '') =>
  `${HEAD}${extraCss}</style></head><body style="${bodyStyle}">${body}</body></html>`;

async function open(browser, html, { dsf = 1, width = 1200, height = 900 } = {}) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dsf });
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 250));
  return p;
}

/**
 * Screenshot every [data-shot] element, cropped to its INK rather than its
 * layout box. `.mk` is line-height:1, i.e. exactly one em tall, and Peridot 950's
 * ascenders and descenders run past that — an element screenshot slices the `y`
 * tail and the top of the `d`. So: shoot a padded region, find the non-
 * transparent bounds, shoot again clipped to them. The crop lands tight on the
 * ink, which is also what a bug asset wants (no baked-in margin to guess at).
 */
async function shotElements(browser, html, opts) {
  const p = await open(browser, html, { ...opts, dsf: 1 });
  const scan = await browser.newPage();
  const boxes = await p.evaluate(() =>
    [...document.querySelectorAll('[data-shot]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.shot, x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );

  const PAD = 80; // must exceed any extender overhang
  for (const b of boxes) {
    const region = {
      x: Math.max(0, Math.floor(b.x - PAD)),
      y: Math.max(0, Math.floor(b.y - PAD)),
      width: Math.ceil(b.width + PAD * 2),
      height: Math.ceil(b.height + PAD * 2),
    };
    const shot = (await p.screenshot({ clip: region, omitBackground: true })).toString('base64');
    const ink = await scan.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
      for (let y = 0; y < cv.height; y++)
        for (let x = 0; x < cv.width; x++)
          if (d[(y * cv.width + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      return x1 < 0 ? null : { x0, y0, x1, y1 };
    }, shot);
    if (!ink) throw new Error(`${b.id} rendered no ink`);
    if (ink.x0 === 0 || ink.y0 === 0 || ink.x1 === region.width - 1 || ink.y1 === region.height - 1)
      throw new Error(`${b.id} ink reaches the scan edge — raise PAD`);

    await p.screenshot({
      path: join(OUT, `${b.id}.png`),
      omitBackground: true,
      clip: { x: region.x + ink.x0, y: region.y + ink.y0, width: ink.x1 - ink.x0 + 1, height: ink.y1 - ink.y0 + 1 },
    });
    console.log(`  ✓ ${b.id}.png  ${ink.x1 - ink.x0 + 1}x${ink.y1 - ink.y0 + 1}`);
  }
  await scan.close();
  await p.close();
}

/** Screenshot a whole fixed-size canvas. */
async function shotCanvas(browser, name, html, { width, height, dsf = 1, transparent = true }) {
  const p = await open(browser, html, { width, height, dsf });
  await p.screenshot({ path: join(OUT, `${name}.png`), omitBackground: transparent });
  await p.close();
  console.log(`  ✓ ${name}.png  ${width * dsf}x${height * dsf}`);
}

// ---------------------------------------------------------------- corner bugs

const BUG_PX = 44; // canvas size on a 1080 export ≈ 16px on a phone → micro cut

async function buildBug(browser) {
  console.log(`bug — wordmark ${BUG_PX}px on a 1080 canvas → ${cutFor(BUG_PX)} cut`);
  const tones = [
    ['white', WHITE],
    ['yellow', YELLOW],
    ['ink', INK],
  ];
  const body = tones
    .map(
      ([id, c]) =>
        `<div><span data-shot="bug-wordmark-${id}">${socialMark(c, BUG_PX * 3)}</span></div>` +
        `<div><span data-shot="bug-lockup-${id}">${lockup(c, BUG_PX * 3)}</span></div>`,
    )
    .join('');
  await shotElements(browser, page(SHOT_LAYOUT, body), { width: 1600, height: 2600 });
}

// ------------------------------------------------------------ handle badges

const BADGE_PX = 34;

async function buildHandle(browser) {
  console.log('handle — badges at 3× for downscale headroom');
  const px = BADGE_PX * 3;
  const pill = `padding:${px * 0.52}px ${px * 0.78}px;border-radius:999px`;
  const body = `
<div><span data-shot="handle-pill-dark" style="${pill};background:${BLACK}">${badge(px, WHITE, YELLOW)}</span></div>
<div><span data-shot="handle-pill-yellow" style="${pill};background:${YELLOW}">${badge(px, INK)}</span></div>
<div><span data-shot="handle-flat-white">${badge(px, WHITE)}</span></div>
<div><span data-shot="handle-flat-yellow">${badge(px, YELLOW)}</span></div>`;
  await shotElements(browser, page(SHOT_LAYOUT, body), { width: 1800, height: 1800 });
}

// -------------------------------------------------------------------- avatar

const AVATAR = 1024;
const AVATAR_FILL = 0.74; // fraction of the frame the mark spans

async function buildAvatar(browser) {
  // A 1024 avatar is displayed at ~40px in a feed, so it takes the MICRO cut
  // regardless of its canvas size — cutFor() is calibrated for a 1080 post, and
  // applying it here would pick standard and fill the tight pairs in.
  const c = PERIDOT_CUTS.micro;
  const mk = (color, px) => peridotMark(color, `${px}px`, c.track, c.hand);

  // Fit by measurement, not by a guessed font-size: the mark's width per em is a
  // property of the face plus this cut's tracking, so measure once and scale.
  const probe = await open(browser, page('', `<span id="p">${mk(WHITE, 200)}</span>`), { width: 2400, height: 400 });
  const w200 = await probe.evaluate(() => document.querySelector('#p .mk').getBoundingClientRect().width);
  await probe.close();
  const px = Math.round((200 * (AVATAR * AVATAR_FILL)) / w200);
  console.log(`avatar — ${AVATAR} square, micro cut, mark ${px}px to span ${Math.round(AVATAR_FILL * 100)}%`);

  for (const [name, bg, fg] of [
    ['avatar-yellow-on-black', BLACK, YELLOW],
    ['avatar-black-on-yellow', YELLOW, BLACK],
  ]) {
    const html = page(
      `.av{width:${AVATAR}px;height:${AVATAR}px;background:${bg};display:flex;align-items:center;justify-content:center}`,
      `<div class="av">${mk(fg, px)}</div>`,
    );
    await shotCanvas(browser, name, html, { width: AVATAR, height: AVATAR, transparent: false });
  }
}

// ------------------------------------------------------------ overlay frames

/** A transparent frame: mark placement only, nothing that assumes the footage. */
function overlayHtml({ w, h, safe, corner, scrim, markPx, badgePx }) {
  const seamH = Math.round(badgePx * 2.1);
  const scrimCss = scrim
    ? `.scrim{position:absolute;left:0;right:0;bottom:0;height:${Math.round(
        h * 0.3,
      )}px;background:linear-gradient(to top,rgba(0,0,0,.82),rgba(0,0,0,0))}`
    : '';
  const scrimEl = scrim ? '<div class="scrim"></div>' : '';
  // Reels put the bug top-left and the handle bottom-left: the bottom-right of a
  // 9:16 post is the platform's action rail. Feed posts have no rail, so the bug
  // sits in the trailing corner where a watermark is conventionally read.
  const parts =
    corner === 'reel'
      ? `<div class="at" style="left:${safe.l}px;top:${safe.t}px">${lockup(WHITE, markPx)}</div>
         <div class="at" style="left:${safe.l}px;bottom:${safe.b}px;display:flex;align-items:center;gap:${Math.round(
           badgePx * 0.75,
         )}px"><i class="seam" style="height:${seamH}px"></i>${badge(badgePx, WHITE, YELLOW)}</div>`
      : `<div class="at" style="right:${safe.r}px;bottom:${safe.b}px">${lockup(WHITE, markPx)}</div>`;
  return page(
    `.frame{position:relative;width:${w}px;height:${h}px;overflow:hidden}
     /* Overlays composite over uncontrolled footage — a white mark can land on a
        white jersey. A tight shadow buys legibility without becoming a glow.
        This is video-only: the print and DTF assets stay flat per BRAND-PRIORS. */
     .at{position:absolute;filter:drop-shadow(0 ${Math.round(w / 540)}px ${Math.round(w / 180)}px rgba(0,0,0,.55))}
     ${scrimCss}`,
    `<div class="frame">${scrimEl}${parts}</div>`,
  );
}

const OVERLAYS = [
  { name: 'overlay-reel-1080x1920', w: 1080, h: 1920, safe: SAFE_REEL, corner: 'reel', markPx: 56, badgePx: 36 },
  { name: 'overlay-reel-1080x1920-scrim', w: 1080, h: 1920, safe: SAFE_REEL, corner: 'reel', markPx: 56, badgePx: 36, scrim: true },
  { name: 'overlay-portrait-1080x1350', w: 1080, h: 1350, safe: SAFE_FEED, corner: 'feed', markPx: 46, badgePx: 26 },
  { name: 'overlay-square-1080x1080', w: 1080, h: 1080, safe: SAFE_FEED, corner: 'feed', markPx: 46, badgePx: 26 },
];

async function buildOverlay(browser) {
  console.log(
    `overlay — reel mark ${OVERLAYS[0].markPx}px (${cutFor(OVERLAYS[0].markPx)} cut), ` +
      `feed mark ${OVERLAYS[2].markPx}px (${cutFor(OVERLAYS[2].markPx)} cut)`,
  );
  for (const o of OVERLAYS) {
    await shotCanvas(browser, o.name, overlayHtml(o), { width: o.w, height: o.h });
  }
}

// ------------------------------------------------------------- og share card

async function buildOg(browser) {
  // 1200×630 — the size index.html actually declares, not the 675 the priors
  // claimed. Rendered at 2× to match the existing card's pixel density.
  console.log('og — 1200×630 @2×, rebuilding the pre-Peridot card in the locked face');
  const html = page(
    `.og{width:1200px;height:630px;position:relative;overflow:hidden;background:${BLACK};
       display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px}
     .og .glow{position:absolute;inset:0;background:
       radial-gradient(120% 90% at 50% 40%,rgba(250,204,21,.10),transparent 62%),
       radial-gradient(90% 70% at 50% 120%,rgba(250,204,21,.05),transparent 70%)}
     .og .stack{position:relative;display:flex;flex-direction:column;align-items:center;gap:26px}
     .rule{display:flex;align-items:center;gap:22px;width:520px}
     .rule i{flex:1;height:1px;background:linear-gradient(90deg,transparent,#3a3a44)}
     .rule i:last-child{background:linear-gradient(90deg,#3a3a44,transparent)}
     .rule .m{font-family:'JetBrains Mono';font-weight:500;color:${YELLOW};font-size:19px;
       letter-spacing:.42em;text-transform:uppercase;padding-left:.42em}
     .tag{font-family:'Anton';color:${WHITE};font-size:34px;letter-spacing:.03em;text-transform:uppercase}`,
    `<div class="og"><div class="glow"></div><div class="stack">
       ${socialMark(YELLOW, 132)}
       <div class="rule"><i></i><span class="m">media</span><i></i></div>
       <div class="tag">Every Day&rsquo;s a Flickday</div>
     </div></div>`,
  );
  await shotCanvas(browser, 'og-share-card', html, { width: 1200, height: 630, dsf: 2, transparent: false });
}

// --------------------------------------------------------------- proof sheet

async function buildProof(browser) {
  console.log('proof — overlays composited over real frames');
  const b64 = (name) => readFileSync(join(OUT, `${name}.png`)).toString('base64');
  const over = (photo, name, w, h, scale) => `
    <div class="cell">
      <div class="cap">${name} · ${w}×${h}</div>
      <div class="shot" style="width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px">
        <img class="bg" src="${photo}" style="width:${w}px;height:${h}px;transform:scale(${scale})">
        <img class="ov" src="data:image/png;base64,${b64(name)}" style="width:${w}px;height:${h}px;transform:scale(${scale})">
      </div>
    </div>`;

  const html = page(
    `body{background:#0a0a0b;font-family:'JetBrains Mono',ui-monospace,monospace;padding:40px;width:max-content}
     h1{color:${YELLOW};font-size:20px;margin-bottom:6px}
     .sub{color:#888;font-size:12px;margin-bottom:26px;max-width:900px;line-height:1.6}
     .row{display:flex;gap:24px;align-items:flex-start;margin-bottom:30px}
     .cap{color:#8a8a92;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px}
     .shot{position:relative;overflow:hidden;border-radius:8px;border:1px solid #26262e;background:#000}
     .shot img{position:absolute;left:0;top:0;transform-origin:top left;object-fit:cover}
     .badges{display:flex;gap:22px;align-items:center;flex-wrap:wrap;background:#111114;
       border:1px solid #26262e;border-radius:10px;padding:22px 24px;margin-bottom:30px}
     .badges img{height:44px;display:block}
     .badges .lite{background:${YELLOW};border-radius:999px;padding:6px 10px}
     .badges .drk{background:#000;border-radius:999px;padding:6px 10px}
     .avs{display:flex;gap:20px;align-items:center}
     .avs img{width:104px;height:104px;border-radius:24px;display:block}`,
    `<h1>flickday — social kit proof</h1>
     <div class="sub">Transparent overlay frames composited over real frames, plus the badges and avatars at
     working size. Safe areas are harvested from this project's own 1080×1920 motion compositions; the reel keeps
     the bottom-right clear for the platform action rail.</div>

     <div class="row">
       ${over(PHOTO_REEL, 'overlay-reel-1080x1920', 1080, 1920, 0.2)}
       ${over(PHOTO_REEL, 'overlay-reel-1080x1920-scrim', 1080, 1920, 0.2)}
       ${over(PHOTO_FEED, 'overlay-portrait-1080x1350', 1080, 1350, 0.28)}
       ${over(PHOTO_FEED, 'overlay-square-1080x1080', 1080, 1080, 0.28)}
     </div>

     <div class="cap">handle badges · at working size</div>
     <div class="badges">
       <img src="data:image/png;base64,${b64('handle-pill-dark')}">
       <img src="data:image/png;base64,${b64('handle-pill-yellow')}">
       <span class="drk"><img src="data:image/png;base64,${b64('handle-flat-white')}"></span>
       <span class="drk"><img src="data:image/png;base64,${b64('handle-flat-yellow')}"></span>
     </div>

     <div class="cap">corner bugs · on black</div>
     <div class="badges">
       <img src="data:image/png;base64,${b64('bug-wordmark-white')}">
       <img src="data:image/png;base64,${b64('bug-lockup-white')}">
       <img src="data:image/png;base64,${b64('bug-lockup-yellow')}">
       <span class="lite"><img src="data:image/png;base64,${b64('bug-lockup-ink')}"></span>
     </div>

     <div class="cap">avatar · 1024 square</div>
     <div class="badges"><div class="avs">
       <img src="data:image/png;base64,${b64('avatar-yellow-on-black')}">
       <img src="data:image/png;base64,${b64('avatar-black-on-yellow')}">
     </div></div>`,
    'background:#0a0a0b',
  );

  const p = await open(browser, html, { width: 1600, height: 1200, dsf: 2 });
  const { w, h } = await p.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await p.setViewportSize({ width: w, height: h });
  await p.screenshot({ path: join(OUT, 'proof-social-kit.png') });
  await p.close();
  console.log(`  ✓ proof-social-kit.png  ${w * 2}x${h * 2}`);
}

// ------------------------------------------------------------------- runner

const BUILDERS = {
  bug: buildBug,
  handle: buildHandle,
  avatar: buildAvatar,
  overlay: buildOverlay,
  og: buildOg,
  proof: buildProof,
};

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => !BUILDERS[a]);
  if (unknown.length) {
    console.error(`unknown asset: ${unknown.join(', ')}\navailable: ${Object.keys(BUILDERS).join(' ')}`);
    process.exit(1);
  }
  // `proof` reads the PNGs the other builders write, so a bare run orders them.
  const todo = args.length ? args : Object.keys(BUILDERS);
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const name of todo) await BUILDERS[name](browser);
  } finally {
    await browser.close();
  }
}

await main();
