/**
 * Flickday Media — reel overlay kit (CapCut / Reels), v2 language.
 *
 *   node scripts/story-assets/render-reel-overlays.mjs
 *
 * Output: flickday-assets/reel-overlays/   (all 1080×1920 vertical — no landscape)
 *   intro-reel              opaque  — title card for the top of a reel
 *   lowerthird-nameplate-*  alpha   — blank name plate (type the name in CapCut)
 *   lowerthird-gallery-*    alpha   — evergreen "see the full set" CTA
 *   bug-reel                alpha   — persistent corner mark (F + FLICKDAY MEDIA)
 *   hud-frame-reel          alpha   — persistent edge frame, middle clear
 *   outro-reel              opaque  — end card (shared outroCard)
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
import { page, ground, streak, outroCard, renderJobs, YELLOW, ORANGE, INK } from './_brand-v2.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'reel-overlays')

/* ── Edit per shoot. Generic placeholders ship by default. ── */
const E = {
  kicker: 'Grassroots Sports Media',
  title: 'GAME<br><b>DAY</b>', // <b> = yellow accent line
  meta: 'Season 2026 · Chicago, IL',
  day: 'Day 247 / 365', // daily-cadence token (replaces the EXIF readout)
  handle: '@flickday.media',
  site: 'flickdaymedia.com',
}

// persistent corner bug — F glyph + FLICKDAY MEDIA
const bugMark = (reel) => `
  <div style="position:absolute;top:${reel ? 60 : 64}px;left:${reel ? 60 : 70}px;display:inline-flex;align-items:center;gap:15px">
    <span style="font-family:'Bebas Neue',sans-serif;font-size:${reel ? 56 : 52}px;line-height:0.68;color:${YELLOW};
      text-shadow:0 2px 8px rgba(0,0,0,0.7),0 0 12px rgba(250,204,21,0.4)">F</span>
    <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${reel ? 26 : 24}px;line-height:0.92;
      letter-spacing:0.1em;text-transform:uppercase;color:${INK};text-shadow:0 2px 10px rgba(0,0,0,0.85)">FLICK<b style="color:${YELLOW}">DAY</b><br>MEDIA</span>
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
    .ey .f{font-family:'Bebas Neue',sans-serif;font-size:${reel ? 30 : 28}px;line-height:0.7;color:${YELLOW}}
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
      <div class="ey"><span class="f">F</span>Shot by Flickday Media</div>
      ${tag ? `<div class="tag"><span class="dot"></span>${tag}</div>` : ''}
      ${inner}
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    </div></div>`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── CORNER BUG (alpha) ── */
function bug(w, h, corner) {
  const reel = h > w
  const m = reel ? 60 : 70
  const top = corner.includes('top')
  const left = corner.includes('left')
  const css = `.wrap{position:absolute;${top ? 'top' : 'bottom'}:${m}px;${left ? 'left' : 'right'}:${m}px;
      display:inline-flex;align-items:center;gap:15px}
    .wrap .f{font-family:'Bebas Neue',sans-serif;font-size:${reel ? 56 : 52}px;line-height:0.68;color:${YELLOW};
      text-shadow:0 2px 8px rgba(0,0,0,0.7),0 0 12px rgba(250,204,21,0.4)}
    .wm{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${reel ? 26 : 24}px;line-height:0.92;
      letter-spacing:0.1em;text-transform:uppercase;color:${INK};text-shadow:0 2px 10px rgba(0,0,0,0.85)}
    .wm b{color:${YELLOW}}`
  const body = `<div class="wrap"><span class="f">F</span><span class="wm">FLICK<b>DAY</b><br>MEDIA</span></div>`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── PERSISTENT FRAME (alpha) — bug + day strip + top/bottom scrims, middle clear ── */
function frame(w, h) {
  const reel = h > w
  const css = `.scrimT{position:absolute;top:0;left:0;right:0;height:${reel ? 250 : 200}px;background:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)}
    .scrimB{position:absolute;bottom:0;left:0;right:0;height:${reel ? 250 : 200}px;background:linear-gradient(0deg,rgba(0,0,0,0.55),transparent)}`
  const body = `<div class="scrimT"></div><div class="scrimB"></div>${bugMark(reel)}${dayStrip(reel)}`
  return page(body, { w, h, alpha: true, extraCss: css })
}

/* ── render queue — Instagram reels + stories only, 1080×1920 vertical ── */
const jobs = [
  { name: 'intro-reel', w: 1080, h: 1920, alpha: false, html: intro(1080, 1920) },
  { name: 'lowerthird-nameplate-reel', w: 1080, h: 1920, alpha: true,
    html: lowerThird(1080, 1920, { tag: 'Feature', blank: true, sub: '<b>flickdaymedia.com</b>' }) },
  { name: 'lowerthird-gallery-reel', w: 1080, h: 1920, alpha: true,
    html: lowerThird(1080, 1920, { tag: 'See the full set', lead: 'FLICKDAYMEDIA.COM', accent: true, sub: '<b>@flickday.media</b>' }) },
  { name: 'bug-reel', w: 1080, h: 1920, alpha: true, html: bug(1080, 1920, 'top-left') },
  { name: 'hud-frame-reel', w: 1080, h: 1920, alpha: true, html: frame(1080, 1920) },
  { name: 'outro-reel', w: 1080, h: 1920, alpha: false, html: page(outroCard(1080, 1920, { handle: E.handle }), { w: 1080, h: 1920 }) },
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
