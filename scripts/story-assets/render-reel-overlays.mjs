/**
 * Flickday Media — reel overlay kit (CapCut / Reels), v2 language.
 *
 *   node scripts/story-assets/render-reel-overlays.mjs
 *
 * Output: flickday-assets/reel-overlays/   (all 1080×1920 vertical — no landscape)
 *   intro-reel              opaque  — hard-cut title card (full-frame, Normal blend)
 *   intro-overlay-reel      alpha   — title over the action (bottom scrim, Normal)
 *   intro-letterbox-reel    alpha   — cinematic top/bottom bars (Normal)
 *   intro-ghost-reel        opaque  — double-exposure title on pure #000 (SCREEN blend)
 *   lowerthird-nameplate-*  alpha   — blank name plate (type the name in CapCut)
 *   lowerthird-gallery-*    alpha   — evergreen "see the full set" CTA
 *   bug-reel                alpha   — persistent corner mark (flickday + MEDIA)
 *   hud-frame-reel          alpha   — persistent edge frame, middle clear
 *   outro-reel              opaque  — hard-cut end card (shared outroCard)
 *   outro-overlay-reel      alpha   — closing brand block over a frozen shot (Normal)
 *   outro-swipe-reel        opaque  — punchy yellow end card for a wipe reveal
 *
 * Composite-over-footage overlays carry their own dark scrims → use Normal blend,
 * NOT Soft light (which washes type). The ghost is the only Screen-blend asset.
 * See README.md for the per-asset blend/opacity/motion guide.
 *
 * ── v2 language (replaces the old camera-viewfinder/EVF kit) ──
 * No crop marks, no EXIF readout, no AF reticle, no aperture glyph. Instead:
 *   · the solid F glyph + FLICKDAY MEDIA wordmark as the persistent bug
 *   · a left ACCENT BAR (yellow→orange) framing captions, not crop brackets
 *   · a STREAK-GRID strip as the daily-cadence signature
 *   · a DAY COUNTER (Day n / 365) in place of the f-stop EXIF line
 *   · the kinetic K wordmark + masthead nameplate on the end card
 * Yellow #facc15 → orange #f97316 on near-black. No green, no mascot (Let's Pepper).
 *
 * Event-agnostic: edit the E block once per shoot and re-render.
 * Offline-safe: fonts embedded via _fonts.mjs.
 */
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { rmSync, existsSync } from 'node:fs'
import { page, ground, streak, wordmark, playIcon, outroCard, renderJobs, YELLOW, AMBER, ORANGE, INK } from './_brand-v2.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'reel-overlays')

/* ── Edit per shoot. Generic placeholders ship by default. ── */
const E = {
  kicker: 'Grassroots Sports Media',
  title: 'GAME<br><b>DAY</b>', // <b> = yellow accent line
  meta: 'Season 2026', // event/date line — keep it true; a bare city reads as filler
  day: 'Day 176 / 365', // daily-cadence token (replaces the EXIF readout) — 2026-06-25
  handle: '@flickday.media',
  site: 'flickdaymedia.com',
}

// persistent corner bug — the flickday wordmark + MEDIA
const bugMark = (reel) => `
  <div style="position:absolute;top:${reel ? 60 : 64}px;left:${reel ? 60 : 70}px;display:flex;flex-direction:column;
    align-items:flex-start;gap:9px;filter:drop-shadow(0 2px 9px rgba(0,0,0,0.85))">
    ${wordmark(reel ? 230 : 210, { color: '#ffffff' })}
    <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${reel ? 19 : 17}px;
      letter-spacing:0.46em;text-transform:uppercase;color:rgba(245,245,240,0.72)">Media</span>
  </div>`

// bottom strip — handle + day counter (replaces the EXIF / frame-counter bar)
const dayStrip = (reel) => `
  <div style="position:absolute;bottom:${reel ? 60 : 64}px;left:${reel ? 60 : 70}px;right:${reel ? 60 : 70}px;
    display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-weight:600;
    font-size:${reel ? 23 : 21}px;letter-spacing:0.2em;text-transform:uppercase;text-shadow:0 2px 10px rgba(0,0,0,0.85)">
    <span style="color:${YELLOW}">${E.handle}</span>
    <span style="color:rgba(245,245,240,0.55)">${E.day}</span>
  </div>`

/* ── INTRO (opaque) — left editorial headline + streak signature ── */
function intro(w, h) {
  const reel = h > w
  const m = reel ? 60 : 70
  const titleFs = reel ? 230 : 188
  const css = `
    .ed{position:absolute;left:${m}px;bottom:${reel ? 290 : 160}px;display:flex;flex-direction:column;align-items:flex-start;max-width:${reel ? 940 : 1200}px}
    .kick{display:inline-flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:${reel ? 23 : 22}px;letter-spacing:0.3em;text-transform:uppercase;color:${YELLOW};
      padding:11px 20px;border:1px solid rgba(250,204,21,0.4);border-radius:4px;margin-bottom:${reel ? 34 : 28}px}
    .kick .pt{width:9px;height:9px;background:${YELLOW};box-shadow:0 0 10px ${YELLOW}}
    h1{font-family:'Bebas Neue',sans-serif;font-size:${titleFs}px;line-height:0.86;letter-spacing:0.01em;color:${INK};
      text-shadow:0 12px 50px rgba(0,0,0,0.7)}
    h1 b{font-weight:400;color:${YELLOW};text-shadow:0 0 56px rgba(250,204,21,0.5)}
    .meta{font-family:'JetBrains Mono',monospace;font-size:${reel ? 26 : 24}px;letter-spacing:0.14em;text-transform:uppercase;
      color:rgba(245,245,240,0.8);margin-top:${reel ? 30 : 24}px}
    .accent{margin-top:${reel ? 44 : 32}px}`
  const body = `${ground()}${bugMark(reel)}
    <div class="ed">
      <span class="kick"><span class="pt"></span>${E.kicker}</span>
      <h1>${E.title}</h1>
      <div class="meta">${E.meta}</div>
      <div class="accent">${streak(3, reel ? 16 : 22, { cell: reel ? 20 : 18, gap: 6, taper: false })}</div>
    </div>
    ${dayStrip(reel)}`
  return page(body, { w, h, alpha: false, extraCss: css })
}

/* ── LOWER-THIRD (alpha) — left accent bar + scrim panel ──
   blank:true → empty name well (type the subject in CapCut); else baked copy. */
function lowerThird(w, h, { tag, lead, sub, blank = false, accent = false }) {
  const reel = h > w
  const left = reel ? 60 : 96
  const bottom = reel ? 330 : 110
  const css = `
    .lt{position:absolute;left:${left}px;${reel ? 'right:60px' : 'max-width:1280px'};bottom:${bottom}px;display:flex}
    .bar{width:6px;flex:none;border-radius:3px;background:linear-gradient(180deg,${YELLOW},${ORANGE});box-shadow:0 0 16px rgba(250,204,21,0.5)}
    .panel{flex:1;margin-left:22px;padding:${reel ? '28px 40px 28px 28px' : '24px 60px 24px 30px'};
      background:linear-gradient(105deg, rgba(6,6,6,0.82), rgba(6,6,6,0.5));box-shadow:0 24px 70px rgba(0,0,0,0.5)}
    .ey{display:inline-flex;align-items:center;gap:11px;font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:${reel ? 20 : 19}px;letter-spacing:0.22em;text-transform:uppercase;color:${YELLOW};margin-bottom:12px}
    .tag{display:inline-flex;align-items:center;gap:11px;font-family:'JetBrains Mono',monospace;font-size:${reel ? 21 : 19}px;
      letter-spacing:0.24em;text-transform:uppercase;color:${ORANGE};margin-bottom:9px}
    .tag .dot{width:10px;height:10px;border-radius:50%;background:${ORANGE};box-shadow:0 0 12px ${ORANGE}}
    .lead{font-family:'Bebas Neue',sans-serif;font-size:${reel ? 92 : 84}px;line-height:0.84;letter-spacing:0.01em;color:${accent ? YELLOW : INK}}
    .well{height:${reel ? 96 : 84}px;display:flex;align-items:flex-end;padding-bottom:14px}
    .well .base{width:${reel ? 280 : 240}px;height:4px;background:rgba(250,204,21,0.3);box-shadow:0 0 8px rgba(250,204,21,0.35)}
    .sub{font-family:'JetBrains Mono',monospace;font-size:${reel ? 22 : 21}px;letter-spacing:0.08em;color:rgba(245,245,240,0.62);margin-top:13px}
    .sub b{color:${YELLOW}}`
  const inner = blank ? `<div class="well"><span class="base"></span></div>` : `<div class="lead">${lead}</div>`
  const body = `<div class="lt"><div class="bar"></div><div class="panel">
      <div class="ey">Shot by Flickday Media</div>
      ${tag ? `<div class="tag"><span class="dot"></span>${tag}</div>` : ''}
      ${inner}
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    </div></div>`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── CORNER BUG (alpha) — the kinetic wordmark cluster, top-left ── */
function bug(w, h) {
  const reel = h > w
  return page(bugMark(reel), { w, h, alpha: true })
}

/* ── PERSISTENT FRAME (alpha) — bug + day strip + top/bottom scrims, middle clear ── */
function frame(w, h) {
  const reel = h > w
  const css = `.scrimT{position:absolute;top:0;left:0;right:0;height:${reel ? 250 : 200}px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)}
    .scrimB{position:absolute;bottom:0;left:0;right:0;height:${reel ? 250 : 200}px;background:linear-gradient(0deg,rgba(0,0,0,0.55),transparent)}`
  const body = `<div class="scrimT"></div><div class="scrimB"></div>${bugMark(reel)}${dayStrip(reel)}`
  return page(body, { w, h, alpha: true, extraCss: css })
}

// dark ink for the light/yellow colorway (the exported INK is the *light* ink)
const DARKINK = '#16110f'
// ring outline (faux stroke) via stacked 0-blur drop-shadows — outlines an SVG's
// rendered silhouette in `color`. Used to keep white marks legible over bright
// footage under Screen blend (a real stroke can't reach the SVG's inner paths here).
const ringOutline = (color, r = 3.5, n = 16) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return `drop-shadow(${(Math.cos(a) * r).toFixed(2)}px ${(Math.sin(a) * r).toFixed(2)}px 0 ${color})`
  }).join(' ')

// small inline flickday + MEDIA lockup (top bars, closing blocks)
const inlineLockup = ({ wm, wmColor = '#ffffff', mediaColor = YELLOW, mediaFs, gap = 16, align = 'center' }) => `
  <span style="display:inline-flex;align-items:${align};gap:${gap}px">
    ${wordmark(wm, { color: wmColor })}
    <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${mediaFs}px;letter-spacing:0.42em;
      text-transform:uppercase;color:${mediaColor}">Media</span>
  </span>`

/* ════════════ COMPOSITE-OVER-FOOTAGE OVERLAYS (alpha, Normal blend) ════════════
   These run on TOP of live footage the whole clip — they carry their own dark
   scrims so type stays legible. Composite with Normal blend at 100% (NOT Soft
   light — that washes the type). The action stays visible where there's no scrim. */

/* ── INTRO · over-action (alpha) — clear top, headline on a bottom scrim ── */
function introOverlay(w, h) {
  const reel = h > w
  const m = 72
  const css = `
    .scrim{position:absolute;left:0;right:0;bottom:0;height:60%;
      background:linear-gradient(0deg,rgba(5,5,5,0.95) 4%,rgba(5,5,5,0.78) 30%,rgba(5,5,5,0.34) 66%,transparent 100%)}
    .ed{position:absolute;left:${m}px;right:${m}px;bottom:230px;display:flex;flex-direction:column;align-items:flex-start}
    .kick{display:inline-flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:23px;letter-spacing:0.3em;text-transform:uppercase;color:${YELLOW};
      padding:11px 20px;border:1px solid rgba(250,204,21,0.4);border-radius:4px;margin-bottom:30px}
    .kick .pt{width:9px;height:9px;background:${YELLOW};box-shadow:0 0 10px ${YELLOW}}
    h1{font-family:'Bebas Neue',sans-serif;font-size:200px;line-height:0.86;letter-spacing:0.01em;color:${INK};
      text-shadow:0 12px 50px rgba(0,0,0,0.7)}
    h1 b{font-weight:400;color:${YELLOW};text-shadow:0 0 56px rgba(250,204,21,0.5)}
    .meta{font-family:'JetBrains Mono',monospace;font-size:26px;letter-spacing:0.14em;text-transform:uppercase;
      color:rgba(245,245,240,0.85);margin-top:26px}
    .accent{margin-top:34px}`
  const body = `<div class="scrim"></div>${bugMark(reel)}
    <div class="ed">
      <span class="kick"><span class="pt"></span>${E.kicker}</span>
      <h1>${E.title}</h1>
      <div class="meta">${E.meta}</div>
      <div class="accent">${streak(3, 16, { cell: 20, gap: 6, taper: false })}</div>
    </div>
    ${dayStrip(reel)}`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── INTRO · cinematic letterbox (alpha) — top/bottom bars, action clear in center ── */
function introLetterbox(w, h) {
  const topH = 220, botH = 400, pad = 64
  const css = `
    .barT{position:absolute;top:0;left:0;right:0;height:${topH}px;background:linear-gradient(180deg,#060606,rgba(6,6,6,0.9));
      display:flex;align-items:center;justify-content:space-between;padding:0 ${pad}px}
    .barB{position:absolute;bottom:0;left:0;right:0;height:${botH}px;background:linear-gradient(0deg,#060606,rgba(6,6,6,0.9));
      display:flex;flex-direction:column;justify-content:center;gap:20px;padding:0 ${pad}px}
    .ruleT{position:absolute;top:${topH}px;left:0;right:0;height:3px;background:linear-gradient(90deg,${YELLOW},${ORANGE})}
    .ruleB{position:absolute;bottom:${botH}px;left:0;right:0;height:3px;background:linear-gradient(90deg,${ORANGE},${YELLOW})}
    .kick{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:18px;letter-spacing:0.28em;
      text-transform:uppercase;color:rgba(250,204,21,0.85);max-width:300px;text-align:right;line-height:1.5}
    h1{font-family:'Bebas Neue',sans-serif;font-size:140px;line-height:0.9;letter-spacing:0.02em;color:${INK}}
    h1 b{font-weight:400;color:${YELLOW}}
    .meta{font-family:'JetBrains Mono',monospace;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(245,245,240,0.7)}
    .lbStrip{display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;
      font-weight:600;font-size:22px;letter-spacing:0.2em;text-transform:uppercase}`
  const body = `
    <div class="barT">
      ${inlineLockup({ wm: 300, mediaColor: YELLOW, mediaFs: 26 })}
      <span class="kick">${E.kicker}</span>
    </div>
    <div class="ruleT"></div>
    <div class="barB">
      <h1>${E.title.replace('<br>', ' ')}</h1>
      <div class="meta">${E.meta}</div>
      <div class="lbStrip"><span style="color:${YELLOW}">${E.handle}</span><span style="color:rgba(245,245,240,0.5)">${E.day}</span></div>
    </div>
    <div class="ruleB"></div>`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── INTRO · double-exposure ghost (PURE BLACK, Screen blend) ──
   Composite with SCREEN blend: black drops out, only the bright marks ghost over
   footage. Pick footage with clean negative space so the type reads. */
function introGhost(w, h) {
  const css = `
    .blk{position:absolute;inset:0;background:#000}
    .g{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 70px}
    .wm{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:56px}
    .wm svg{filter:${ringOutline(YELLOW, 3.5)}}
    .wm .md{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:26px;letter-spacing:0.55em;text-transform:uppercase;color:${YELLOW}}
    h1{font-family:'Bebas Neue',sans-serif;font-size:300px;line-height:0.84;letter-spacing:0.01em;color:#fff;text-align:center;
      -webkit-text-stroke:4px ${YELLOW};paint-order:stroke fill}
    h1 b{font-weight:400;color:${YELLOW}}
    .rule{width:170px;height:4px;background:linear-gradient(90deg,${YELLOW},${ORANGE});margin:48px 0 30px}
    .meta{font-family:'JetBrains Mono',monospace;font-size:27px;letter-spacing:0.34em;text-transform:uppercase;color:#fff}`
  const body = `<div class="blk"></div>
    <div class="g">
      <div class="wm">${wordmark(420, { color: '#fff' })}<span class="md">Media</span></div>
      <h1>${E.title}</h1>
      <div class="rule"></div>
      <div class="meta">${E.meta}</div>
    </div>`
  return page(body, { w, h, alpha: false, extraCss: css })
}

/* ── OUTRO · freeze-frame overlay (alpha) — closing brand block on a bottom scrim ── */
function outroOverlay(w, h) {
  const css = `
    .scrim{position:absolute;left:0;right:0;bottom:0;height:56%;
      background:linear-gradient(0deg,rgba(5,5,5,0.95) 6%,rgba(5,5,5,0.72) 34%,rgba(5,5,5,0.28) 70%,transparent 100%)}
    .oc{position:absolute;left:72px;right:72px;bottom:236px;display:flex;flex-direction:column;align-items:flex-start}
    .wm{display:flex;align-items:flex-end;gap:18px;margin-bottom:26px}
    .wm .md{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:30px;letter-spacing:0.42em;
      text-transform:uppercase;color:${YELLOW};padding-bottom:8px}
    .rule{width:520px;height:3px;background:linear-gradient(90deg,${YELLOW},${ORANGE});margin-bottom:24px}
    .tag{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:24px;letter-spacing:0.3em;
      text-transform:uppercase;color:rgba(245,245,240,0.66);margin-bottom:32px}
    .cta{display:flex;align-items:center;gap:30px;flex-wrap:wrap}
    .cta .h{font-family:'JetBrains Mono',monospace;font-weight:800;font-size:42px;letter-spacing:0.02em;color:#fff}
    .cta .h b{color:${YELLOW}}
    .cta .see{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:25px;letter-spacing:0.26em;text-transform:uppercase;color:${YELLOW}}
    .accent{margin-top:36px}`
  const handleMarkup = E.handle.replace('@', '<b>@</b>')
  const body = `<div class="scrim"></div>
    <div class="oc">
      <div class="wm">${wordmark(330, { color: '#fff' })}<span class="md">Media</span></div>
      <div class="rule"></div>
      <div class="tag">Every day&rsquo;s a Flickday</div>
      <div class="cta"><span class="h">${handleMarkup}</span><span class="see">See the full set &rarr;</span></div>
      <div class="accent">${streak(3, 16, { cell: 20, gap: 6, taper: false })}</div>
    </div>`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── OUTRO · swipe card (opaque, YELLOW) — punchy full-bleed end frame for a wipe reveal ── */
function outroSwipe(w, h) {
  const css = `
    body{background:${YELLOW}}
    .yc{position:absolute;inset:0;background:linear-gradient(150deg,${AMBER} 0%,${YELLOW} 44%,${ORANGE} 128%)}
    .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 80px;text-align:center}
    .play{width:152px;height:152px;border-radius:34px;background:#0b0907;display:flex;align-items:center;justify-content:center;
      margin-bottom:62px;box-shadow:0 22px 54px rgba(0,0,0,0.28)}
    .wm{display:flex;flex-direction:column;align-items:center;gap:16px}
    .wm .md{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:30px;letter-spacing:0.55em;text-transform:uppercase;color:${DARKINK}}
    .rule{width:210px;height:5px;background:${DARKINK};border-radius:3px;margin:48px 0 38px;opacity:0.88}
    .h{font-family:'JetBrains Mono',monospace;font-weight:800;font-size:48px;letter-spacing:0.02em;color:${DARKINK}}
    .see{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:26px;letter-spacing:0.28em;
      text-transform:uppercase;color:rgba(11,9,7,0.72);margin-top:26px}`
  const body = `<div class="yc"></div>
    <div class="c">
      <div class="play">${playIcon(96, { color: YELLOW })}</div>
      <div class="wm">${wordmark(440, { color: DARKINK })}<span class="md">Media</span></div>
      <div class="rule"></div>
      <div class="h">${E.handle}</div>
      <div class="see">See the full set &rarr;</div>
    </div>`
  return page(body, { w, h, alpha: false, extraCss: css })
}

/* ── render queue — Instagram reels + stories only, 1080×1920 vertical ── */
const jobs = [
  // ── INTRO ──
  { name: 'intro-reel', w: 1080, h: 1920, alpha: false, html: intro(1080, 1920) },               // hard-cut title card (full-frame, Normal)
  { name: 'intro-overlay-reel', w: 1080, h: 1920, alpha: true, html: introOverlay(1080, 1920) },  // over-action (scrim, Normal)
  { name: 'intro-letterbox-reel', w: 1080, h: 1920, alpha: true, html: introLetterbox(1080, 1920) }, // cinematic bars (Normal)
  { name: 'intro-ghost-reel', w: 1080, h: 1920, alpha: false, html: introGhost(1080, 1920) },     // double-exposure (Screen)
  // ── OVERLAYS (whole-clip) ──
  { name: 'lowerthird-nameplate-reel', w: 1080, h: 1920, alpha: true,
    html: lowerThird(1080, 1920, { tag: 'Feature', blank: true, sub: '<b>flickdaymedia.com</b>' }) },
  { name: 'lowerthird-gallery-reel', w: 1080, h: 1920, alpha: true,
    html: lowerThird(1080, 1920, { tag: 'See the full set', lead: 'FLICKDAYMEDIA.COM', accent: true, sub: '<b>@flickday.media</b>' }) },
  { name: 'bug-reel', w: 1080, h: 1920, alpha: true, html: bug(1080, 1920) },
  { name: 'hud-frame-reel', w: 1080, h: 1920, alpha: true, html: frame(1080, 1920) },
  // ── OUTRO ──
  { name: 'outro-reel', w: 1080, h: 1920, alpha: false, html: page(outroCard(1080, 1920, { handle: E.handle }), { w: 1080, h: 1920 }) }, // hard-cut end card
  { name: 'outro-overlay-reel', w: 1080, h: 1920, alpha: true, html: outroOverlay(1080, 1920) },  // freeze-frame overlay (scrim, Normal)
  { name: 'outro-swipe-reel', w: 1080, h: 1920, alpha: false, html: outroSwipe(1080, 1920) },     // yellow swipe card (full-frame, Normal)
]

console.log(`Rendering ${jobs.length} reel overlays (v2)...\n`)
await renderJobs(jobs, outDir)

// the old viewfinder HUD is renamed → frame; drop the stale file
const oldHud = join(outDir, 'hud-viewfinder-reel.png')
if (existsSync(oldHud)) {
  rmSync(oldHud)
  console.log('removed stale hud-viewfinder-reel.png')
}
console.log('\nDone. Reel overlay kit in flickday-assets/reel-overlays/')
