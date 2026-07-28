/**
 * Symbol study — the vector reconstruction of the three approved icon cues.
 *
 * WHAT THIS IS. The marks everyone remembers — play-d, reel-d, shutter-i — are
 * IMAGE-GENERATED RASTERS, not artwork: see
 * `flickday-assets/concepts/2026-07-modular-wordmark/isolated-d-glyph-round-1/README.md`.
 * The round-3 README closes the loop: "Do not trace the image-generated letters
 * or ship the raster proofs as logos. Reconstruct only those approved custom
 * glyphs as clean vector geometry against a single fixed typographic base."
 * This script is that reconstruction. Proportions are MEASURED off the proofs in
 * `final-candidates/`; nothing here is traced.
 *
 * THE THREE PATTERNS, and the fact that they differ is the whole point — the
 * proofs use different polarity per cue, and swapping them is the single easiest
 * way to get this wrong:
 *
 *   play    round HOLE masked out of the wordmark, triangle as POSITIVE ink.
 *   reel    solid bowl, lobes CUT OUT of a same-colour disc laid over the counter.
 *   shutter the `i` dot masked away, a larger disc drawn in the vacated space
 *           with blade edges cut through it.
 *
 * Sizing a symbol to fit the EXISTING counter is the wrong instinct and produces
 * a speck: the counter is ~5% of the glyph's area. It is the thing being
 * replaced, not the budget.
 *
 * NO OUTLINING IS NEEDED for any of them. Where the letterform yields it yields
 * to a CSS mask on live text, so the Adobe Fonts web licence stays clean and the
 * marks regenerate from the same live Peridot the rest of the site uses.
 *
 * Geometry is MEASURED, not assumed. The `d` is rasterised at DPR 1 and its
 * counter found by flood fill from the border; a radial sweep then finds how far
 * a disc can grow before it breaks the glyph's silhouette. The `i` dot is found
 * as the glyph's upper ink band. Every number the sheet prints comes from those
 * measurements at run time.
 *
 *   node scripts/wordmark-symbol-study.mjs
 *     → flickday-assets/wordmarks/symbol-study.png  (+ per-variant shots)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { chromium, KIT_LINKS, PERIDOT, PERIDOT_CUTS, YELLOW, INK } from './wordmark-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'flickday-assets', 'wordmarks');

const BLACK = '#000';
const WHITE = '#fff';
const BONE = '#f5f5f1';
const HERO_PX = 260;
const S = PERIDOT_CUTS.standard;

/** A filename-safe slug for a caption. */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** One `d` span, styled exactly as it is inside the wordmark. */
const dStyle = `font-family:'${PERIDOT.cssFamily}';font-weight:${PERIDOT.weight};font-optical-sizing:none`;

/**
 * Measure Peridot's `d` at HERO_PX: where its counter sits inside the span box,
 * how big it is, and how large a concentric disc can grow before it breaks the
 * glyph's outer silhouette. Runs at deviceScaleFactor 1 so getBoundingClientRect
 * CSS px map 1:1 onto the screenshot canvas.
 */
async function measureD(browser) {
  const page = await browser.newPage({ viewport: { width: 700, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(
    `${KIT_LINKS}<style>*{margin:0;padding:0}body{background:${BLACK}}
     .wrap{line-height:1;padding:60px;display:inline-block}
     #probe{color:${YELLOW};${dStyle};font-size:${HERO_PX}px}</style>
     <span class="wrap"><span id="probe">d</span></span>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready);

  const box = await page.evaluate(() => {
    const r = document.getElementById('probe').getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  });
  const shot = (await page.screenshot()).toString('base64');
  await page.close();

  const scan = await browser.newPage();
  const geom = await scan.evaluate(
    async ([b64, b]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      // Yellow #facc15 has red 250; the black ground has red 0. Half-way is a
      // safe cut that ignores the antialias fringe on both sides.
      const lit = (x, y) => d[(y * cv.width + x) * 4] > 125;

      const x0 = Math.floor(b.left);
      const x1 = Math.ceil(b.left + b.width);
      const y0 = Math.floor(b.top);
      const y1 = Math.ceil(b.top + b.height);

      // Glyph ink box, for reporting.
      let gx0 = 1e9, gx1 = -1, gy0 = 1e9, gy1 = -1;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++)
          if (lit(x, y)) {
            if (x < gx0) gx0 = x;
            if (x > gx1) gx1 = x;
            if (y < gy0) gy0 = y;
            if (y > gy1) gy1 = y;
          }

      // The counter, by flood fill from the canvas border. A per-row "dark run
      // with ink on both sides" test is NOT sufficient: the `d`'s two notches,
      // where the bowl meets the stem above and below the counter, are bounded
      // left and right on their own rows while opening to the outside
      // vertically. Scanning rows counts them as counter and reports a 136-tall
      // slot instead of the real ~57. Only ground the border cannot reach is a
      // true hole.
      const outside = new Uint8Array(cv.width * cv.height);
      const stack = [];
      for (let x = 0; x < cv.width; x++) {
        stack.push([x, 0], [x, cv.height - 1]);
      }
      for (let y = 0; y < cv.height; y++) {
        stack.push([0, y], [cv.width - 1, y]);
      }
      while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) continue;
        const i = y * cv.width + x;
        if (outside[i] || lit(x, y)) continue;
        outside[i] = 1;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      let cx0 = 1e9, cx1 = -1, cy0 = 1e9, cy1 = -1;
      for (let y = gy0; y <= gy1; y++)
        for (let x = gx0; x <= gx1; x++)
          if (!lit(x, y) && !outside[y * cv.width + x]) {
            if (x < cx0) cx0 = x;
            if (x > cx1) cx1 = x;
            if (y < cy0) cy0 = y;
            if (y > cy1) cy1 = y;
          }
      if (cx1 < 0) return { error: 'no counter found' };

      const ccx = (cx0 + cx1) / 2;
      const ccy = (cy0 + cy1) / 2;

      // How far a concentric disc can grow before it pokes out of the glyph.
      // From the counter's centre, walk each direction: cross the counter, cross
      // the ink, and stop where the ink ends — that distance is the ceiling.
      let maxR = 1e9;
      let tightest = 0;
      for (let i = 0; i < 180; i++) {
        const a = (i * Math.PI) / 90;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        let seenInk = false;
        let edge = 0;
        for (let t = 0; t < 600; t += 0.5) {
          const px = Math.round(ccx + dx * t);
          const py = Math.round(ccy + dy * t);
          if (px < 0 || py < 0 || px >= cv.width || py >= cv.height) break;
          const on = lit(px, py);
          if (on) seenInk = true;
          else if (seenInk) break;
          edge = t;
        }
        if (edge < maxR) {
          maxR = edge;
          tightest = Math.round((i * 2 * 180) / 180) % 360;
        }
      }

      return {
        glyph: { w: gx1 - gx0 + 1, h: gy1 - gy0 + 1 },
        counter: { w: cx1 - cx0 + 1, h: cy1 - cy0 + 1 },
        // Counter centre as an offset from the SPAN box origin, so it can be
        // re-applied to the `d` inside the word (same face, same size, same box).
        cx: ccx - b.left,
        cy: ccy - b.top,
        // Half the counter's DIAGONAL, not half its longer side: the disc has to
        // swallow the counter's corners, and a disc sized to the longer side
        // misses the tips, leaving black slivers above and below the symbol.
        needR: Math.hypot(cx1 - cx0 + 1, cy1 - cy0 + 1) / 2,
        maxR,
        tightest,
      };
    },
    [shot, box],
  );
  await scan.close();
  if (geom.error) throw new Error(`measureD: ${geom.error}`);
  return geom;
}

/**
 * The largest play triangle that can replace the `d`'s counter: back edge
 * vertical, apex right, containing the counter, with `wall` px of ink left all
 * the way around it.
 *
 * This is the construction the shipped traced marks actually use — the counter
 * is simply a triangle. No disc is involved. Bounding the symbol to a circle
 * inscribed in the bowl, as earlier passes here did, throws away most of the
 * room: Peridot's bowl is tall and narrow, so the biggest inscribed circle is
 * far smaller than the biggest inscribed triangle. Fitting the triangle to the
 * bowl directly roughly doubles the symbol.
 *
 * The valid sizes are a BAND, not a prefix — too small and the boundary runs
 * through the counter (which is not ink), too large and it breaks the
 * silhouette — so this scans rather than binary-searching for "the largest that
 * fits".
 */
async function fitPlayTriangle(browser, wall, ratio) {
  const page = await browser.newPage({ viewport: { width: 700, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(
    `${KIT_LINKS}<style>*{margin:0;padding:0}body{background:${BLACK}}
     .wrap{line-height:1;padding:60px;display:inline-block}
     #probe{color:${YELLOW};${dStyle};font-size:${HERO_PX}px}</style>
     <span class="wrap"><span id="probe">d</span></span>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready);
  const box = await page.evaluate(() => {
    const r = document.getElementById('probe').getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  const shot = (await page.screenshot()).toString('base64');
  await page.close();

  const scan = await browser.newPage();
  const fit = await scan.evaluate(
    async ([b64, b, WALL, RATIO]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const lit = (x, y) =>
        x >= 0 && y >= 0 && x < cv.width && y < cv.height && d[(y * cv.width + x) * 4] > 125;

      let gx0 = 1e9, gx1 = -1, gy0 = 1e9, gy1 = -1;
      for (let y = 0; y < cv.height; y++)
        for (let x = 0; x < cv.width; x++)
          if (lit(x, y)) {
            if (x < gx0) gx0 = x;
            if (x > gx1) gx1 = x;
            if (y < gy0) gy0 = y;
            if (y > gy1) gy1 = y;
          }

      const outside = new Uint8Array(cv.width * cv.height);
      const st = [];
      for (let x = 0; x < cv.width; x++) st.push([x, 0], [x, cv.height - 1]);
      for (let y = 0; y < cv.height; y++) st.push([0, y], [cv.width - 1, y]);
      while (st.length) {
        const [x, y] = st.pop();
        if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) continue;
        const i = y * cv.width + x;
        if (outside[i] || lit(x, y)) continue;
        outside[i] = 1;
        st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      let sx = 0, sy = 0, n = 0, cx0 = 1e9, cx1 = -1, cy0 = 1e9, cy1 = -1;
      for (let y = gy0; y <= gy1; y++)
        for (let x = gx0; x <= gx1; x++)
          if (!lit(x, y) && !outside[y * cv.width + x]) {
            sx += x; sy += y; n++;
            if (x < cx0) cx0 = x;
            if (x > cx1) cx1 = x;
            if (y < cy0) cy0 = y;
            if (y > cy1) cy1 = y;
          }
      const ccx = sx / n, ccy = sy / n;

      const safe = (x, y) => {
        for (let dy = -WALL; dy <= WALL; dy++)
          for (let dx = -WALL; dx <= WALL; dx++) {
            if (dx * dx + dy * dy > WALL * WALL) continue;
            if (!lit(Math.round(x + dx), Math.round(y + dy))) return false;
          }
        return true;
      };
      const holds = (cx, cy, h) => {
        const w = RATIO * 2 * h, x0 = cx - w / 2, x1 = cx + w / 2;
        if (!(x0 <= cx0 && x1 >= cx1 && cy - h <= cy0 && cy + h >= cy1)) return false;
        const pts = [[x0, cy - h], [x0, cy + h], [x1, cy]];
        for (let i = 0; i < 3; i++) {
          const a = pts[i], bb = pts[(i + 1) % 3];
          for (let t = 0; t <= 1; t += 0.01)
            if (!safe(a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t)) return false;
        }
        return true;
      };

      let bh = 0, bc = null;
      for (let dx = -20; dx <= 20; dx += 2)
        for (let dy = -20; dy <= 20; dy += 2)
          for (let h = 20; h <= 140; h += 1)
            if (h > bh && holds(ccx + dx, ccy + dy, h)) { bh = h; bc = [ccx + dx, ccy + dy]; }

      if (!bc) return { error: `no triangle fits with a ${WALL}px wall` };
      return { h: bh, w: RATIO * 2 * bh, cx: bc[0] - b.left, cy: bc[1] - b.top };
    },
    [shot, box, wall, ratio],
  );
  await scan.close();
  if (fit.error) throw new Error(`fitPlayTriangle: ${fit.error}`);
  return fit;
}

/**
 * Peridot's `i` dot at HERO_PX: its centre and radius, as an offset from the
 * span box, so the shutter can replace it the way the counter work replaces the
 * `d`'s hole. The dot is the glyph's upper ink band — `i` is the one letter
 * where a plain row scan is unambiguous, since the dot and the stem are
 * separated by a full gap of empty rows.
 */
async function measureI(browser) {
  const page = await browser.newPage({ viewport: { width: 700, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(
    `${KIT_LINKS}<style>*{margin:0;padding:0}body{background:${BLACK}}
     .wrap{line-height:1;padding:60px;display:inline-block}
     #probe{color:${YELLOW};${dStyle};font-size:${HERO_PX}px}</style>
     <span class="wrap"><span id="probe">i</span></span>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready);
  const box = await page.evaluate(() => {
    const r = document.getElementById('probe').getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  const shot = (await page.screenshot()).toString('base64');
  await page.close();

  const scan = await browser.newPage();
  const dot = await scan.evaluate(
    async ([b64, b]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const lit = (x, y) => d[(y * cv.width + x) * 4] > 125;

      const rowHasInk = (y) => {
        for (let x = 0; x < cv.width; x++) if (lit(x, y)) return true;
        return false;
      };
      let top = -1;
      for (let y = 0; y < cv.height && top < 0; y++) if (rowHasInk(y)) top = y;
      if (top < 0) return { error: 'no ink' };
      let bottom = top;
      while (bottom + 1 < cv.height && rowHasInk(bottom + 1)) bottom++;
      if (bottom + 1 >= cv.height || rowHasInk(bottom + 2)) return { error: 'dot not separated from stem' };

      let x0 = 1e9, x1 = -1;
      for (let y = top; y <= bottom; y++)
        for (let x = 0; x < cv.width; x++)
          if (lit(x, y)) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
          }
      return {
        w: x1 - x0 + 1,
        h: bottom - top + 1,
        r: Math.max(x1 - x0 + 1, bottom - top + 1) / 2,
        cx: (x0 + x1) / 2 - b.left,
        cy: (top + bottom) / 2 - b.top,
      };
    },
    [shot, box],
  );
  await scan.close();
  if (dot.error) throw new Error(`measureI: ${dot.error}`);
  return dot;
}

/**
 * The play triangle as POSITIVE ink, for the round-hole pattern: the wordmark is
 * masked to a circular hole and this sits inside it. Corners are rounded the way
 * the approved proof's are — by scaling the triangle in about its centroid and
 * stroking it back out with a round linejoin, so the rounding is uniform on all
 * three corners instead of eyeballed per vertex.
 */
function playInk(r, color, spec) {
  const c = r;
  const rr = spec.round * r;
  const pts = [
    [c - spec.back * r, c - spec.half * r],
    [c - spec.back * r, c + spec.half * r],
    [c + spec.apex * r, c],
  ];
  const gx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
  const gy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
  // Inradius = area / semiperimeter; shrinking by rr/inradius makes the stroke
  // put the outline back exactly where the un-rounded triangle's edges were.
  const side = (a, b) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
  const per = side(0, 1) + side(1, 2) + side(2, 0);
  const area = Math.abs(
    (pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[2][0] - pts[0][0]) * (pts[1][1] - pts[0][1]),
  ) / 2;
  const s = 1 - rr / (area / (per / 2));
  const d = pts.map(([x, y]) => `${gx + (x - gx) * s} ${gy + (y - gy) * s}`).join(' L ');
  return `<path d="M ${d} Z" fill="${color}" stroke="${color}" stroke-width="${rr * 2}" stroke-linejoin="round"/>`;
}

function iconSvg(kind, r, color, spec = REELS[0]) {
  const D = r * 2;
  const c = r;
  const reel = spec;
  if (kind === 'playink') {
    return `<svg class="ico" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" xmlns="http://www.w3.org/2000/svg">${playInk(
      r,
      color,
      spec,
    )}</svg>`;
  }
  // The aperture: N straight blade edges, each running from a point on the rim
  // to a point on an inner circle rotated `phi` ahead of it. That offset is what
  // makes the blades spiral into an iris instead of meeting at the centre like a
  // pie chart — round-1 drew them as tapered wedges instead and got a starburst.
  const blades = () =>
    Array.from({ length: spec.n }, (_, i) => {
      const a0 = (-90 + (i * 360) / spec.n) * (Math.PI / 180);
      const a1 = a0 + spec.phi * (Math.PI / 180);
      return `<line x1="${c + Math.cos(a0) * r}" y1="${c + Math.sin(a0) * r}" x2="${
        c + Math.cos(a1) * spec.rIn * r
      }" y2="${c + Math.sin(a1) * spec.rIn * r}" stroke="black" stroke-width="${
        spec.w * r
      }" stroke-linecap="round"/>`;
    }).join('');

  const cut =
    kind === 'shutter'
      ? blades()
      : [
          `<circle cx="${c}" cy="${c}" r="${reel.hub * r}" fill="black"/>`,
          ...Array.from({ length: reel.n }, (_, i) => {
            const a = (-90 + (i * 360) / reel.n) * (Math.PI / 180);
            return `<circle cx="${c + Math.cos(a) * reel.orbit * r}" cy="${c + Math.sin(a) * reel.orbit * r}" r="${
              reel.lobe * r
            }" fill="black"/>`;
          }),
        ].join('');

  const uid = `${kind}-${spec.id}-${Math.round(r * 100)}`;
  return `<svg class="ico" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" xmlns="http://www.w3.org/2000/svg">
    <mask id="cut-${uid}">
      <rect width="${D}" height="${D}" fill="black"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="white"/>
      ${cut}
    </mask>
    <circle cx="${c}" cy="${c}" r="${r}" fill="${color}" mask="url(#cut-${uid})"/>
  </svg>`;
}

/**
 * "flickday" with the `d` marked so the icon can be placed over it. `accent`
 * paints the whole word in one colour when false, or bones the other seven
 * letters and leaves the `d` in the mark colour when true.
 */
function word(color, size, accent, slot = 'd') {
  const letters = [...'flickday']
    .map((ch, i) => {
      const gap = i > 0 && S.hand[i - 1] ? `margin-left:${S.hand[i - 1]}em;` : '';
      const host = ch === slot;
      const c = accent && !host ? `color:${color === INK ? '#b9b6ad' : BONE};` : '';
      return `<span${host ? ' class="slot"' : ''} style="${dStyle};${gap}${c}">${ch}</span>`;
    })
    .join('');
  return `<span class="wm" style="font-size:${size}px;color:${color}">${letters}</span>`;
}

// The smallest size this lockup is allowed to ship at, and the thinnest ink
// wall that survives there. The ceiling is derived from these, not eyeballed:
// "disc just touches the outer silhouette" leaves a wall that is fine at 260px
// and gone by the header size, which is exactly the nick that shows up in the
// bowl at the top of the ladder. The 15px watermark uses the plain wordmark —
// no icon — so the header size is the binding constraint.
// 120px, not the 40px header: the icon is a knockout inside a counter, so it
// dies long before the letterforms do. Measured on the ramp below — at 40px it
// is not visible at all and at 64px it is a speck, while the plain wordmark is
// still crisp at 15px. The icon lockup is therefore a LARGE-FORMAT device and
// the plain wordmark stays the default everywhere small.
// The play triangle's fit. 8px is the measured ceiling at 260px — at 9px no
// triangle containing the counter fits inside Peridot's `d` at all.
const PLAY_WALL_PX = 8;
const PLAY_RATIO = 0.87; // width : height, equilateral-ish

const MIN_SHIP_PX = 120;
const MIN_WALL_PX = 1.2;
const RAMP = [40, 64, 88, 120, 160, 220];

// Where the disc lands between its two hard bounds — the floor that swallows
// the counter, the ceiling that preserves the wall. Both ends are legal; which
// reads best is a judgement call, so the sheet renders the range.
const LADDER = [0.4, 0.7, 1];
// The ceiling itself. Measured on the ramp, a bigger disc is legible at smaller
// sizes and reads more confidently at every size above; the ceiling is already
// defended by the ink-wall rule, so there is no reason to sit under it. The
// earlier worry that the top of the ladder nicked the bowl was against the old,
// underived ceiling.
const RUNG = LADDER.length - 1;

// The approved proof's play triangle, measured off
// final-candidates/play-d-polished-v1 — roughly 1.0r wide and tall inside its
// hole, corners rounded. It is POSITIVE ink: the hole is the button's ground.
//
// Triangle-as-negative-space was tried at length and is wrong, not merely
// smaller. It inverts the proof's polarity, which structurally caps the symbol
// at whatever ink the letter can spare; grown to the largest triangle that
// inscribes in its disc, the corners meet the circle and it reads as a blob.
// Removed rather than kept as an option, so it cannot be reached again.
const PLAY_INK = { id: 'ink', back: 0.42, apex: 0.58, half: 0.52, round: 0.12 };

// Reel proportions as fractions of the disc radius, measured off
// final-candidates/reel-d-polished-v1. The reel is the one cue that keeps the
// NEGATIVE polarity — solid bowl, lobes cut through a same-colour disc.
//
// Three other lobe sets were swept and all read worse: round-1's
// (0.121/0.259/0.517) is too fine and gives a rosette, and coarser five- and
// four-lobe sets muddy. None are kept — the constraint is the bowl's width, not
// the lobe numbers, so sweeping them further is not the lever.
const REELS = [{ id: 'proof', hub: 0.17, lobe: 0.33, orbit: 0.55, n: 5, label: "approved proof's proportions" }];

// Aperture blade sets. `phi` is the twist between a blade's rim end and its
// inner end — the whole reason an iris reads as an iris rather than a pie.
const SHUTTERS = [
  { id: 'six', n: 6, phi: 55, rIn: 0.3, w: 0.1, label: 'six blades' },
  { id: 'sixdeep', n: 6, phi: 72, rIn: 0.2, w: 0.13, label: 'six blades, deeper twist' },
  { id: 'five', n: 5, phi: 62, rIn: 0.28, w: 0.12, label: 'five blades' },
];

// Where each icon's centre sits inside its host letter's span box, in HERO_PX
// units. Filled by main() from the measured glyphs; declared here so mark() has
// a default host without threading geometry through every call site.
const HOST_D = { slot: 'd', cx: 0, cy: 0 };
const HOST_I = { slot: 'i', cx: 0, cy: 0 };

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const g = await measureD(browser);
  const dot = await measureI(browser);
  Object.assign(HOST_D, { cx: g.cx, cy: g.cy });
  Object.assign(HOST_I, { cx: dot.cx, cy: dot.cy });
  console.log(`  i @${HERO_PX}px — dot ${dot.w}x${dot.h}, r ${dot.r.toFixed(1)}`);
  console.log(`  d @${HERO_PX}px — glyph ${g.glyph.w}x${g.glyph.h}, counter ${g.counter.w}x${g.counter.h}`);

  // Pull the ceiling in so a real wall of ink survives at the smallest size the
  // lockup ships at, scaled up to the hero size the geometry is measured in.
  const wall = (MIN_WALL_PX / MIN_SHIP_PX) * HERO_PX;
  const ceiling = g.maxR - wall;
  console.log(
    `  disc floor r≥${g.needR.toFixed(1)} (covers the counter); ceiling r≤${ceiling.toFixed(1)} ` +
      `(silhouette ${g.maxR.toFixed(1)} less a ${wall.toFixed(1)}px wall — ${MIN_WALL_PX}px at ${MIN_SHIP_PX}px)`,
  );
  if (g.needR > ceiling) {
    throw new Error(
      `No legal disc: covering the counter needs r ${g.needR.toFixed(1)}, but keeping a ${MIN_WALL_PX}px wall at ` +
        `${MIN_SHIP_PX}px caps r at ${ceiling.toFixed(1)}. Either the lockup's minimum size has to rise, or ` +
        `Peridot's d cannot hold this technique.`,
    );
  }
  const radii = LADDER.map((f) => g.needR + (ceiling - g.needR) * f);
  console.log(`  disc ladder r = ${radii.map((r) => r.toFixed(1)).join(', ')}  (default rung ${RUNG})`);
  const rHero = radii[RUNG];
  // The three numbers the production spec needs, in em so they survive any size.
  console.log(
    `  SPEC — disc r ${(rHero / HERO_PX).toFixed(4)}em, centre ${(g.cx / HERO_PX).toFixed(4)}em right and ` +
      `${(g.cy / HERO_PX).toFixed(4)}em down from the d's box origin; minimum size ${MIN_SHIP_PX}px`,
  );

  const page = await browser.newPage({ deviceScaleFactor: 2 });
  writeFileSync(join(OUT, '_symbol-study.html'), sheet(g, dot, rHero));
  await page.goto(pathToFileURL(join(OUT, '_symbol-study.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Place each icon over its own `d`, scaling the measured geometry by that
  // mark's font-size so the same numbers drive the hero and the small sizes.
  await page.evaluate(
    (hero) => {
      for (const wrap of document.querySelectorAll('.markwrap')) {
        const wm = wrap.querySelector('.wm');
        const ico = wrap.querySelector('.ico');
        if (!ico) continue;
        const k = parseFloat(getComputedStyle(wm).fontSize) / hero;
        const dR = wrap.querySelector('.slot').getBoundingClientRect();
        const wR = wrap.getBoundingClientRect();
        const r = parseFloat(ico.getAttribute('width')) / 2;
        const cx = dR.left - wR.left + parseFloat(wrap.dataset.ox) * k;
        const cy = dR.top - wR.top + parseFloat(wrap.dataset.oy) * k;
        ico.style.left = `${cx - r}px`;
        ico.style.top = `${cy - r}px`;

        // Substitute variants: the letterform gives up the region the icon
        // occupies, plus a ground-coloured gap, so the disc is no longer bounded
        // by the glyph. Measured in the wrapper's coordinates, which is also the
        // mask's origin, so the hole and the icon are concentric by construction.
        if (!wrap.dataset.hole) continue;
        const hole = parseFloat(wrap.dataset.hole);
        const m = `radial-gradient(circle at ${cx}px ${cy - (wm.getBoundingClientRect().top - wR.top)}px, transparent 0 ${hole}px, #000 ${
          hole + 0.5
        }px)`;
        wm.style.webkitMaskImage = m;
        wm.style.maskImage = m;
      }
    },
    HERO_PX,
  );

  const { w, h } = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: join(OUT, 'symbol-study.png') });

  // One tight shot per rung as well. The contact sheet is for reading the set
  // together; these are for judging a single mark without a crop guess.
  // Named from the section's own stable id, not its caption: the caption carries
  // measurements that move between runs, which produced a new filename every
  // time and left the folder full of near-duplicates nobody could tell apart.
  const heroes = await page.locator('.sec .hero').all();
  for (const hero of heroes) {
    const id = await hero.evaluate((el) => el.dataset.id);
    await hero.screenshot({ path: join(OUT, `${slug(id)}.png`) });
  }
  // The small-size tiles get their own shots too — the rung is decided here, and
  // judging them off a crop of the full sheet is how the first pass went wrong.
  const tiles = await page.locator('[data-small]').all();
  for (const tile of tiles) {
    const id = await tile.evaluate((el) => el.dataset.small);
    await tile.screenshot({ path: join(OUT, `evidence-sizes-${slug(id)}.png`) });
  }
  const ways = await page.locator('[data-way]').all();
  for (const way of ways) {
    const id = await way.evaluate((el) => el.dataset.way);
    await way.screenshot({ path: join(OUT, `evidence-colorway-${slug(id)}.png`) });
  }

  await browser.close();
  console.log(`✓ symbol-study.png  ${w}x${h}  (+${heroes.length} rung, ${tiles.length} small-size, ${ways.length} colorway shots)`);
}

/**
 * A mark plus its icon, in one positioning wrapper. The icon is a SIBLING of the
 * text, never a child: the substitute variant masks `.wm`, and a CSS mask
 * applies to the element's whole subtree, so an icon inside it would be erased
 * by the very hole it is meant to fill.
 *
 * `gap` switches patterns. Without it the disc is drawn OVER intact text and
 * must stay inside the glyph — the counter-replacement pattern. With it the
 * letterform yields: a hole `gap` wider than the icon is masked out of the
 * wordmark, and the disc is free to grow past anything the letter allows. That
 * is the prior shutter-i pattern, and it is the only way the symbol gets bigger
 * than the bowl.
 */
function mark(kind, size, color, accent, r, spec, gap = null, host = HOST_D) {
  const rIcon = (r * size) / HERO_PX;
  // `gap === null` leaves the text intact. A number masks a hole; 0 makes the
  // hole exactly the icon box, which is the round-hole pattern where the icon is
  // positive ink and the hole itself is the symbol's ground.
  const hole = gap === null ? '' : ` data-hole="${rIcon * (1 + gap)}"`;
  return `<span class="markwrap" data-ox="${host.cx}" data-oy="${host.cy}"${hole}>${word(
    color,
    size,
    accent,
    host.slot,
  )}${iconSvg(kind, rIcon, color, spec)}</span>`;
}

function sheet(g, dot, rHero) {
  const XH = 138;

  // DECISION A — how big the play hole gets. Bigger button, progressively less
  // `d`: at the top rung the bowl is gone and the word reads "flick(*)ay".
  const playSizes = [0.62, 0.76, 0.9].map(
    (f, i) => `<div class="sec">
      <div class="cap">DECIDE · play ${'abc'[i]} <span class="note">hole r ${((XH * f) / 2).toFixed(
      0,
    )} · ${f}× x-height${i === 0 ? ' · recommended' : ''}</span></div>
      <div class="hero" data-id="decide-play-${'abc'[i]}">${mark(
        'playink',
        HERO_PX,
        YELLOW,
        false,
        (XH * f) / 2,
        PLAY_INK,
        0,
      )}</div>
    </div>`,
  ).join('');

  // DECISION B — how far past the `i` dot the aperture grows. Above 1.2x it
  // starts cutting into the `l`'s stem.
  const shutterSizes = [1.2, 1.5, 1.8].map(
    (f, i) => `<div class="sec">
      <div class="cap">DECIDE · shutter ${'abc'[i]} <span class="note">r ${(dot.r * f).toFixed(
      0,
    )} · ${f}× the ${dot.r.toFixed(0)} dot${i === 0 ? ' · recommended' : ''}</span></div>
      <div class="hero" data-id="decide-shutter-${'abc'[i]}">${mark(
        'shutter',
        HERO_PX,
        YELLOW,
        false,
        dot.r * f,
        SHUTTERS[0],
        0.16,
        HOST_I,
      )}</div>
    </div>`,
  ).join('');

  // DECISION C — ships or doesn't. This is the best of six lobe sets tried;
  // Peridot's bowl is narrower than the proof's `d`, so the lobes still merge.
  const reel = `<div class="sec">
      <div class="cap">DECIDE · reel — ship or drop <span class="note">proof proportions, disc r ${rHero.toFixed(
        0,
      )} · recommended: drop</span></div>
      <div class="hero" data-id="decide-reel">${mark('reel', HERO_PX, YELLOW, false, rHero, REELS[0])}</div>
    </div>`;

  // Supporting evidence, not a decision: the blade sets behind the recommended
  // six-blade aperture.
  const blades = SHUTTERS.map(
    (sh) => `<div class="sec">
      <div class="cap">evidence · shutter blades — ${sh.label} <span class="note">${sh.n} blades · ${sh.phi}° twist</span></div>
      <div class="hero" data-id="evidence-blades-${sh.id}">${mark(
        'shutter',
        HERO_PX,
        YELLOW,
        false,
        dot.r * 1.2,
        sh,
        0.16,
        HOST_I,
      )}</div>
    </div>`,
  ).join('');

  // Where each cue dies. The control is the plain wordmark, which is what ships
  // below the icon lockup's minimum.
  const small = [
    `<div class="tile on-black" data-small="play"><span class="t">play · ${RAMP.join('px · ')}px</span>
      <div class="row">${RAMP.map((s) => mark('playink', s, YELLOW, false, (XH * 0.62) / 2, PLAY_INK, 0)).join('')}</div></div>`,
    `<div class="tile on-black" data-small="shutter"><span class="t">shutter · ${RAMP.join('px · ')}px</span>
      <div class="row">${RAMP.map((s) => mark('shutter', s, YELLOW, false, dot.r * 1.2, SHUTTERS[0], 0.16, HOST_I)).join('')}</div></div>`,
    `<div class="tile on-black" data-small="control"><span class="t">control · plain wordmark, no icon · ${RAMP[0]}px · 15px watermark</span>
      <div class="row">${[RAMP[0], 15].map((s) => word(YELLOW, s, false)).join('')}</div></div>`,
  ].join('');

  // Rendered at the lockup's own minimum: below MIN_SHIP_PX the symbol is
  // invisible, so a colorway proof down there would be a proof of plain text.
  const WAYS = [
    ['on-black', YELLOW, 'yellow on black · primary'],
    ['on-yellow', BLACK, 'black on yellow · reversed'],
    ['on-black', WHITE, 'white on black · one-colour / dark garment'],
    ['on-light', INK, 'ink on light · light garment'],
  ];
  const colorways = [
    ['play', (c) => mark('playink', MIN_SHIP_PX, c, false, (XH * 0.62) / 2, PLAY_INK, 0)],
    ['shutter', (c) => mark('shutter', MIN_SHIP_PX, c, false, dot.r * 1.2, SHUTTERS[0], 0.16, HOST_I)],
  ]
    .map(
      ([k, render]) => `<div class="sec">
      <div class="cap">${k} · colorways <span class="note">at the ${MIN_SHIP_PX}px minimum — the icon follows the mark</span></div>
      <div class="body"><div class="grid2">${WAYS.map(
        ([cls, c, lbl]) =>
          `<div class="tile ${cls}" data-way="${k}-${slug(lbl)}"><span class="t">${lbl}</span>${render(c)}</div>`,
      ).join('')}</div></div>
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
${KIT_LINKS}
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=block" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0b;font-family:'JetBrains Mono',ui-monospace,monospace;padding:44px;width:1280px}
h1{color:${YELLOW};font-size:20px;margin-bottom:4px}
.intro{color:#8a8a92;font-size:12px;margin-bottom:26px;max-width:960px;line-height:1.6}
.intro b{color:#d6d6da;font-weight:500}
.sec{border:1px solid #26262e;border-radius:12px;margin-bottom:18px;overflow:hidden;background:#111114}
.cap{color:${YELLOW};font-size:12px;text-transform:uppercase;letter-spacing:.11em;padding:13px 20px;border-bottom:1px solid #22222a}
.cap .note{color:#8a8a92;text-transform:none;letter-spacing:0;font-size:11px}
.hero{background:${BLACK};padding:34px 40px;display:flex;align-items:center}
.body{padding:22px 20px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}
.tile{border-radius:8px;padding:24px 22px;display:flex;flex-direction:column;gap:14px;align-items:flex-start;justify-content:center;min-height:120px}
.tile.on-black{background:${BLACK}}
.tile.on-yellow{background:${YELLOW}}
.tile.on-light{background:#e8e4dc}
.t{font-size:10px;text-transform:uppercase;letter-spacing:.12em}
.on-black .t{color:#6b6b73}.on-yellow .t{color:#7a6604}.on-light .t{color:#9a9488}
.row{display:flex;align-items:flex-end;gap:26px;flex-wrap:wrap}

/* The mark and its icon share one positioning context. The icon is a SIBLING of
   the text, drawn over it — nothing is masked out of the letterform. */
.markwrap{position:relative;display:inline-block}
.wm{line-height:1;white-space:nowrap;display:inline-block}
.ico{position:absolute;pointer-events:none}
</style></head><body>
<h1>flickday — icon cues · vector reconstruction of the approved proofs</h1>
<div class="intro">Three cues, three constructions, taken from the rasters in
<b>concepts/2026-07-modular-wordmark/final-candidates/</b>: the <b>play</b> is a round hole with the triangle as positive
ink, the <b>shutter</b> masks the <b>i</b> dot away and draws a larger aperture in its place, the <b>reel</b> keeps the
counter-replacement polarity. Nothing is traced and nothing needs the font outlined — every yield is a CSS mask on live
Peridot. Geometry is measured at run time: counter <b>${g.counter.w}×${g.counter.h}</b> in a
<b>${g.glyph.w}×${g.glyph.h}</b> glyph, <b>i</b> dot <b>${dot.w}×${dot.h}</b>, at ${HERO_PX}px.
The <b>DECIDE</b> sections below are the open choices; everything after them is supporting evidence.</div>
${playSizes}
${shutterSizes}
${reel}
${blades}
<div class="sec">
  <div class="cap">evidence · where each cue dies — this is what sets the ${MIN_SHIP_PX}px minimum</div>
  <div class="body">${small}</div>
</div>
${colorways}
</body></html>`;
}

await main();

/**
 * The Peridot play mark as a shipping asset.
 *
 * The triangle is a TRUE KNOCKOUT — a CSS mask on the live text, so the ground
 * shows through it and the mark drops onto photography, not just onto a flat
 * colour. Drawing a ground-coloured triangle on top would look identical here
 * and fail the moment it lands on an image.
 *
 * PNG only, deliberately. Peridot ships under the Adobe Fonts WEB licence: live
 * text is covered, redistributed outlines are not. An SVG of this mark would
 * have to embed the glyph outlines, so the vector form stays out of the repo and
 * the mark regenerates from this script instead.
 */
async function exportPlayMarks(browser, fit) {
  const WIDTH = 4000;
  const size = WIDTH / 4.1; // "flickday" runs ~4.1x its font-size wide
  const k = size / HERO_PX;
  const ways = [
    ['yellow', YELLOW],
    ['black', BLACK],
    ['white', WHITE],
    ['ink', INK],
  ];
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1 });
  const written = [];
  for (const [name, color] of ways) {
    await page.setContent(
      `${KIT_LINKS}<style>*{margin:0;padding:0}html,body{background:transparent}
       .markwrap{position:relative;display:inline-block}
       .wm{line-height:1;white-space:nowrap;display:inline-block;font-size:${size}px;color:${color}}</style>
       <span class="markwrap"><span class="wm">${word(color, size, false)}</span></span>`,
      { waitUntil: 'networkidle' },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      ([f, scale]) => {
        const wm = document.querySelector('.wm');
        const slot = wm.querySelector('.slot');
        const wR = wm.getBoundingClientRect();
        const sR = slot.getBoundingClientRect();
        const cx = sR.left - wR.left + f.cx * scale;
        const cy = sR.top - wR.top + f.cy * scale;
        const h = f.h * scale;
        const w = f.w * scale;
        const tri = `M ${cx - w / 2} ${cy - h} L ${cx - w / 2} ${cy + h} L ${cx + w / 2} ${cy} Z`;
        // One evenodd path — full-bleed rect with the triangle as a subpath — so
        // the triangle is a genuine HOLE in the mask. `mask-image` masks by
        // ALPHA, not luminance: a black triangle painted over a white rect is
        // fully opaque and masks nothing, which silently renders the plain
        // wordmark and looks like the geometry failed.
        const svg =
          `<svg xmlns="http://www.w3.org/2000/svg" width="${wR.width}" height="${wR.height}">` +
          `<path fill="#fff" fill-rule="evenodd" d="M0 0 H${wR.width} V${wR.height} H0 Z ${tri}"/></svg>`;
        const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
        wm.style.webkitMaskImage = url;
        wm.style.maskImage = url;
      },
      [fit, k],
    );
    const el = page.locator('.markwrap');
    const file = join(OUT, `peridot-play-${name}.png`);
    await el.screenshot({ path: file, omitBackground: true });
    written.push(file);
  }
  await page.close();
  return written;
}

const browserForExport = await chromium.launch();
const exportFit = await fitPlayTriangle(browserForExport, PLAY_WALL_PX, PLAY_RATIO);
const files = await exportPlayMarks(browserForExport, exportFit);
await browserForExport.close();
console.log(
  `✓ peridot play marks — triangle ${exportFit.w.toFixed(0)}x${(exportFit.h * 2).toFixed(0)} at ${HERO_PX}px, ` +
    `${PLAY_WALL_PX}px wall\n  ` + files.map((f) => f.split('/').pop()).join('  '),
);

