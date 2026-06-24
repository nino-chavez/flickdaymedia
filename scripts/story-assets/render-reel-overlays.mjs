/**
 * Flickday Media — reel overlay kit (CapCut / Premiere).
 *
 *   node scripts/story-assets/render-reel-overlays.mjs
 *
 * Output: flickday-assets/reel-overlays/   (reel = 1080x1920, wide = 1920x1080)
 *   intro-*      opaque  — title card for the top of a reel
 *   lowerthird-* alpha   — name / play callout, sits over footage
 *   bug-*        alpha   — persistent corner mark
 *   hud-*        alpha   — persistent full viewfinder frame
 *   outro-*      opaque  — end card → handle + site
 *
 * ── Flickday's OWN visual language: the camera viewfinder. ──
 * Not a recolored hype reel. Flickday is a photography brand, so every overlay
 * reads like a frame seen through the camera's EVF:
 *   · corner CROP MARKS (registration brackets) frame the action
 *   · a faint RULE-OF-THIRDS guide
 *   · a top OSD bar — aperture glyph + FLICKDAY MEDIA · REC ● timecode
 *   · a bottom OSD bar — the live EXIF readout (f/2.8 · 1/2000 · ISO 200 · 200mm)
 *   · an ANAMORPHIC LENS FLARE for energy (the camera's "sizzle" — no radial
 *     speed-lines, no mascot; those belong to Let's Pepper)
 *   · LEFT-ANCHORED editorial type, never centered title cards
 * Yellow #facc15 → orange #f97316 on near-black. The FLICKDAY MEDIA wordmark is a
 * real PNG (custom letterforms — never rebuilt in CSS).
 *
 * Event-agnostic: edit the E block once per shoot and re-render.
 *
 * Dependency note: reuses Playwright from the sibling letspepper repo to keep this
 * static-site repo free of a heavy browser dep. letspepper must be installed.
 */
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'reel-overlays')
mkdirSync(outDir, { recursive: true })

const asset = (f) => pathToFileURL(join(ROOT, 'flickday-assets', 'outro', f)).href
const lockup = asset('lockup-transparent.png')          // FLICKDAY MEDIA wordmark + motion streak
const aperture = asset('aperture-icon-transparent.png') // compact volleyball-aperture mark

/* ── Edit per shoot. Generic placeholders ship by default. ── */
const E = {
  kicker: 'Grassroots Sports Media',
  title: 'GAME<br>DAY',          // intro headline — swap per event, <br> splits lines
  meta: 'Season 2026 · Chicago, IL',
  slogan: "Every Day's a Flickday",
  readout: 'f/2.8 · 1/2000 · ISO 200 · 200mm',
  handle: '@flickday.media',
  site: 'flickdaymedia.com',
}

const YELLOW = '#facc15'
const ORANGE = '#f97316'
const INK = '#f5f5f0'

/* ─────────────────────────  shared CSS  ───────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');`
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const reset = (w, h, transparent) =>
  `*{margin:0;padding:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden;${
    transparent ? 'background:transparent' : 'background:#060606'
  }}body{position:relative;font-family:'Inter',sans-serif;color:${INK};-webkit-font-smoothing:antialiased}`

// Viewfinder chrome — the through-line on every frame.
const chromeCss = `
  /* near-black ground: off-center warm glow (asymmetric, not a centered burst), grain, vignette */
  .warm{position:absolute;inset:0;background:
    radial-gradient(74% 56% at 26% 24%, rgba(250,204,21,0.12), transparent 56%),
    radial-gradient(90% 70% at 88% 96%, rgba(249,115,22,0.08), transparent 60%)}
  .grain{position:absolute;inset:0;background-image:${GRAIN};background-size:340px;opacity:0.08;
    mix-blend-mode:overlay;pointer-events:none}
  .vign{position:absolute;inset:0;box-shadow:inset 0 0 360px 90px rgba(0,0,0,0.82);pointer-events:none}
  /* rule-of-thirds guide */
  .thirds{position:absolute;pointer-events:none;
    background:
      linear-gradient(90deg, transparent calc(33.33% - 1px), rgba(245,245,240,0.05) 33.33%, transparent calc(33.33% + 1px)),
      linear-gradient(90deg, transparent calc(66.66% - 1px), rgba(245,245,240,0.05) 66.66%, transparent calc(66.66% + 1px)),
      linear-gradient(0deg, transparent calc(33.33% - 1px), rgba(245,245,240,0.05) 33.33%, transparent calc(33.33% + 1px)),
      linear-gradient(0deg, transparent calc(66.66% - 1px), rgba(245,245,240,0.05) 66.66%, transparent calc(66.66% + 1px))}
  /* corner crop / registration marks */
  .crop{position:absolute}
  .crop i{position:absolute;background:${YELLOW};box-shadow:0 0 10px rgba(250,204,21,0.4)}
  /* top + bottom OSD bars */
  .osd{position:absolute;display:flex;align-items:center;justify-content:space-between}
  .osd .id{display:inline-flex;align-items:center;gap:13px;font-family:'JetBrains Mono',monospace;font-weight:700;
    letter-spacing:0.16em;text-transform:uppercase;color:${INK};text-shadow:0 2px 10px rgba(0,0,0,0.8);white-space:nowrap}
  .osd .id img{flex:none;filter:drop-shadow(0 0 10px rgba(250,204,21,0.4))}
  .osd .id b{color:${YELLOW}}
  .osd .rec{display:inline-flex;align-items:center;gap:11px;font-family:'JetBrains Mono',monospace;font-weight:700;
    letter-spacing:0.16em;text-transform:uppercase;color:${INK};text-shadow:0 2px 10px rgba(0,0,0,0.8)}
  .osd .rec .dot{border-radius:50%;background:#ef4444;box-shadow:0 0 13px rgba(239,68,68,0.85)}
  .osd .rec .tc{color:${YELLOW}}
  .osd .exif{font-family:'JetBrains Mono',monospace;letter-spacing:0.2em;text-transform:uppercase;color:rgba(250,204,21,0.92);
    text-shadow:0 2px 10px rgba(0,0,0,0.8);white-space:nowrap}
  .osd .loc{font-family:'JetBrains Mono',monospace;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,245,240,0.55);
    text-shadow:0 2px 10px rgba(0,0,0,0.8);white-space:nowrap}
  /* anamorphic lens flare — camera-native energy in place of radial speed-lines */
  .flare{position:absolute;left:-12%;right:-12%;height:3px;pointer-events:none;filter:blur(0.6px);
    background:linear-gradient(90deg, transparent 8%, rgba(250,204,21,0.5) 40%, rgba(255,255,255,0.95) 50%, rgba(250,204,21,0.5) 60%, transparent 92%);
    box-shadow:0 0 46px 9px rgba(250,204,21,0.22)}
  .flare::before{content:'';position:absolute;left:50%;top:50%;width:220px;height:220px;transform:translate(-50%,-50%);
    border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,0.85), rgba(250,204,21,0.42) 28%, transparent 62%)}
  .flare::after{content:'';position:absolute;left:50%;top:50%;width:2px;height:240px;transform:translate(-50%,-50%);
    background:linear-gradient(0deg, transparent, rgba(250,204,21,0.55), transparent)}`

// Crop-mark corners. m = inset, arm = bracket length, t = thickness.
const cropMarks = (m, arm, t = 5) => {
  const c = (v, h) => `<div class="crop" style="${v}:${m}px;${h}:${m}px">
      <i style="${v}:0;${h}:0;width:${arm}px;height:${t}px"></i>
      <i style="${v}:0;${h}:0;width:${t}px;height:${arm}px"></i></div>`
  return c('top', 'left') + c('top', 'right') + c('bottom', 'left') + c('bottom', 'right')
}

// Top OSD: aperture glyph + FLICKDAY MEDIA  ·  REC ● timecode.
// `ins` insets the bar inside the crop-mark arms so the two never collide.
const osdTop = (ins, top, fs, glyph, tc) => `
  <div class="osd" style="top:${top}px;left:${ins}px;right:${ins}px">
    <span class="id" style="font-size:${fs}px"><img src="${aperture}" style="width:${glyph}px;height:${glyph}px">FLICK<b>DAY</b> MEDIA</span>
    <span class="rec" style="font-size:${fs}px"><span class="dot" style="width:${Math.round(fs * 0.62)}px;height:${Math.round(fs * 0.62)}px"></span>REC<span class="tc">${tc}</span></span>
  </div>`

// Bottom OSD: the live EXIF readout (camera-authentic — bottom-left only), with a
// short frame-counter token on the right to balance the bar.
const osdBottom = (ins, bottom, fs) => `
  <div class="osd" style="bottom:${bottom}px;left:${ins}px;right:${ins}px">
    <span class="exif" style="font-size:${fs}px">${E.readout}</span>
    <span class="loc" style="font-size:${fs}px">F·24</span>
  </div>`

const ground = (m) =>
  `<div class="warm"></div><div class="grain"></div>
   <div class="thirds" style="inset:${m}px"></div><div class="vign"></div>`

const doc = (w, h, transparent, head, body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${reset(w, h, transparent)}${chromeCss}${head}</style></head><body>${body}</body></html>`

/* ─────────────────────────  INTRO  ─────────────────────────
   Left-anchored editorial headline in the lower third, anamorphic flare across
   the upper third, viewfinder chrome around it. Distinct zones → no collisions. */
function intro(w, h) {
  const reel = h > w
  const m = reel ? 54 : 64
  const arm = reel ? 90 : 108
  const osdFs = reel ? 23 : 21
  const titleFs = reel ? 240 : 196
  const head = `
    .flare{top:${reel ? '30%' : '26%'}}
    .title{position:absolute;left:${m + 6}px;bottom:${reel ? 250 : 150}px;display:flex;flex-direction:column;align-items:flex-start}
    .tag{display:inline-flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:${reel ? 23 : 22}px;letter-spacing:0.3em;text-transform:uppercase;color:${YELLOW};
      padding:11px 20px;border:1px solid rgba(250,204,21,0.4);border-radius:4px;margin-bottom:${reel ? 34 : 28}px}
    .tag .pt{width:9px;height:9px;background:${YELLOW};box-shadow:0 0 10px ${YELLOW}}
    h1{font-family:'Anton',sans-serif;font-size:${titleFs}px;line-height:0.92;letter-spacing:-0.01em;color:${INK};
      text-shadow:0 12px 50px rgba(0,0,0,0.7)}
    h1 b{font-weight:400;color:${YELLOW};text-shadow:0 0 56px rgba(250,204,21,0.55)}
    .sub{font-family:'JetBrains Mono',monospace;font-size:${reel ? 26 : 24}px;letter-spacing:0.14em;text-transform:uppercase;
      color:rgba(245,245,240,0.8);margin-top:${reel ? 30 : 24}px}
    .sub b{color:${YELLOW}}`
  const ins = m + arm + 16
  const body = `
    ${ground(m)}
    <div class="flare"></div>
    ${cropMarks(m, arm)}
    ${osdTop(ins, m, osdFs, reel ? 34 : 32, '00:00')}
    <div class="title">
      <span class="tag"><span class="pt"></span>${E.kicker}</span>
      <h1><b>${E.title}</b></h1>
      <div class="sub">${E.meta}</div>
    </div>
    ${osdBottom(ins, m, osdFs)}`
  return doc(w, h, false, head, body)
}

/* ─────────────────────────  OUTRO  ─────────────────────────
   Same viewfinder frame; the real FLICKDAY MEDIA lockup PNG anchors a left
   editorial block — eyebrow, lockup, slogan, handle. */
function outro(w, h) {
  const reel = h > w
  const m = reel ? 54 : 64
  const arm = reel ? 90 : 108
  const osdFs = reel ? 23 : 21
  const head = `
    .flare{top:${reel ? '24%' : '22%'}}
    .blk{position:absolute;left:${m + 6}px;${reel ? 'top:50%;transform:translateY(-50%)' : 'top:50%;transform:translateY(-50%)'};
      display:flex;flex-direction:column;align-items:flex-start;max-width:${reel ? 900 : 1180}px}
    .eyebrow{display:inline-flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:${reel ? 23 : 22}px;letter-spacing:0.34em;text-transform:uppercase;color:rgba(245,245,240,0.6);margin-bottom:${reel ? 30 : 26}px}
    .eyebrow .pt{width:9px;height:9px;background:${YELLOW};box-shadow:0 0 10px ${YELLOW}}
    .lockup{width:${reel ? 760 : 660}px;filter:drop-shadow(0 20px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 60px rgba(250,204,21,0.24))}
    .rule{width:${reel ? 120 : 110}px;height:3px;background:linear-gradient(90deg,${YELLOW},${ORANGE});border-radius:2px;
      margin:${reel ? 40 : 32}px 0;box-shadow:0 0 18px rgba(250,204,21,0.5)}
    .slogan{font-family:'Bebas Neue',sans-serif;font-size:${reel ? 92 : 78}px;line-height:0.9;letter-spacing:0.03em;
      color:${YELLOW};text-shadow:0 0 36px rgba(250,204,21,0.4)}
    .handle{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${reel ? 32 : 28}px;letter-spacing:0.04em;
      color:#fff;margin-top:${reel ? 30 : 24}px}
    .handle .site{color:rgba(245,245,240,0.5);font-weight:400;margin-left:18px}`
  const ins = m + arm + 16
  const body = `
    ${ground(m)}
    <div class="flare"></div>
    ${cropMarks(m, arm)}
    ${osdTop(ins, m, osdFs, reel ? 34 : 32, '00:30')}
    <div class="blk">
      <span class="eyebrow"><span class="pt"></span>That's a wrap</span>
      <img class="lockup" src="${lockup}" alt="">
      <div class="rule"></div>
      <div class="slogan">${E.slogan}</div>
      <div class="handle">${E.handle}<span class="site">${E.site}</span></div>
    </div>
    ${osdBottom(ins, m, osdFs)}`
  return doc(w, h, false, head, body)
}

/* ─────────────────────────  LOWER-THIRD (alpha)  ─────────────────────────
   A caption framed by crop brackets — not a rounded pill. Two modes:
     · blank:true  → a name-PLATE template. Tag + an empty well (with a baseline
       guide) where you drop a CapCut text layer. Sport-agnostic — type anything.
     · blank:false → fixed copy baked in (used for the evergreen gallery CTA). */
function lowerThird(w, h, { tag, lead, sub, blank = false, accent = false }) {
  const reel = h > w
  const left = reel ? 60 : 96
  const right = reel ? 60 : null
  const bottom = reel ? 320 : 110
  const arm = 46
  const t = 5
  const wellH = reel ? 96 : 84
  const head = `
    .lt{position:absolute;left:${left}px;${reel ? `right:${right}px` : 'max-width:1280px'};bottom:${bottom}px}
    .scrim{position:relative;padding:${reel ? '32px 40px' : '28px 44px'};
      background:linear-gradient(105deg, rgba(6,6,6,0.82), rgba(6,6,6,0.62));
      box-shadow:0 24px 70px rgba(0,0,0,0.5)}
    /* crop brackets at two opposite corners — the viewfinder caption frame */
    .b{position:absolute}.b i{position:absolute;background:${YELLOW};box-shadow:0 0 8px rgba(250,204,21,0.45)}
    .b.tl{top:-2px;left:-2px}.b.tl i.x{top:0;left:0;width:${arm}px;height:${t}px}.b.tl i.y{top:0;left:0;width:${t}px;height:${arm}px}
    .b.br{bottom:-2px;right:-2px}.b.br i.x{bottom:0;right:0;width:${arm}px;height:${t}px}.b.br i.y{bottom:0;right:0;width:${t}px;height:${arm}px}
    .ey{display:inline-flex;align-items:center;gap:11px;font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:${reel ? 20 : 19}px;letter-spacing:0.22em;text-transform:uppercase;color:${YELLOW};margin-bottom:12px}
    .ey img{width:${reel ? 26 : 24}px;height:${reel ? 26 : 24}px}
    .tag{display:inline-flex;align-items:center;gap:11px;font-family:'JetBrains Mono',monospace;font-size:${reel ? 21 : 19}px;
      letter-spacing:0.24em;text-transform:uppercase;color:${ORANGE};margin-bottom:9px}
    .tag .dot{width:10px;height:10px;border-radius:50%;background:${ORANGE};box-shadow:0 0 12px ${ORANGE}}
    .lead{font-family:'Anton',sans-serif;font-size:${reel ? 84 : 76}px;line-height:0.9;letter-spacing:0.005em;color:${accent ? YELLOW : INK}}
    /* empty text well for CapCut — sized so the plate holds its shape, with a faint baseline */
    .well{height:${wellH}px;display:flex;align-items:flex-end;padding-bottom:14px}
    .well .base{width:${reel ? 280 : 240}px;height:4px;background:rgba(250,204,21,0.3);box-shadow:0 0 8px rgba(250,204,21,0.35)}
    .sub{font-family:'JetBrains Mono',monospace;font-size:${reel ? 22 : 21}px;letter-spacing:0.08em;color:rgba(245,245,240,0.62);margin-top:13px}
    .sub b{color:${YELLOW}}`
  const inner = blank
    ? `<div class="well"><span class="base"></span></div>`
    : `<div class="lead">${lead}</div>`
  const body = `
    <div class="lt">
      <div class="ey"><img src="${aperture}" alt="">Shot by Flickday Media</div>
      <div class="scrim">
        <div class="b tl"><i class="x"></i><i class="y"></i></div>
        <div class="b br"><i class="x"></i><i class="y"></i></div>
        ${tag ? `<div class="tag"><span class="dot"></span>${tag}</div>` : ''}
        ${inner}
        ${sub ? `<div class="sub">${sub}</div>` : ''}
      </div>
    </div>`
  return doc(w, h, true, head, body)
}

/* ─────────────────────────  CORNER BUG (alpha)  ─────────────────────────
   Viewfinder corner cluster: a crop bracket + aperture + FLICKDAY MEDIA. No
   pill background (a translucent fill bakes to grey on a transparent export);
   legibility comes from a tight text-shadow. */
function bug(w, h, corner) {
  const reel = h > w
  const m = reel ? 60 : 70
  const arm = reel ? 56 : 52
  const t = 5
  const top = corner.includes('top')
  const left = corner.includes('left')
  const v = top ? 'top' : 'bottom'
  const hh = left ? 'left' : 'right'
  const head = `
    .wrap{position:absolute;${v}:${m}px;${hh}:${m}px;display:inline-flex;align-items:center;gap:14px}
    .mark{position:relative;width:${arm}px;height:${arm}px;flex:none}
    .mark i{position:absolute;background:${YELLOW};box-shadow:0 0 8px rgba(250,204,21,0.45)}
    .mark i.x{${v}:0;${hh}:0;width:${arm}px;height:${t}px}
    .mark i.y{${v}:0;${hh}:0;width:${t}px;height:${arm}px}
    .ap{width:${reel ? 50 : 46}px;height:${reel ? 50 : 46}px;flex:none;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 10px rgba(250,204,21,0.35))}
    .wm{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${reel ? 26 : 24}px;line-height:0.92;
      letter-spacing:0.1em;text-transform:uppercase;color:${INK};text-shadow:0 2px 10px rgba(0,0,0,0.85)}
    .wm b{color:${YELLOW}}`
  // order so the bracket hugs the outer corner
  const inner = `<img class="ap" src="${aperture}" alt=""><span class="wm">FLICK<b>DAY</b><br>MEDIA</span>`
  const body = `<div class="wrap"><div class="mark"><i class="x"></i><i class="y"></i></div>${inner}</div>`
  return doc(w, h, true, head, body)
}

/* ─────────────────────────  VIEWFINDER HUD (alpha, persistent)  ─────────────────────────
   The full live frame for the whole clip: crop marks, OSD bars, REC, a small
   centre AF reticle. Middle stays clear so it never blocks the action. */
function hud(w, h) {
  const reel = h > w
  const m = reel ? 56 : 64
  const arm = reel ? 96 : 112
  const osdFs = reel ? 23 : 21
  const afW = reel ? 130 : 150
  const afA = reel ? 30 : 34
  const head = `
    .af{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${afW}px;height:${afW}px}
    .af span{position:absolute;width:${afA}px;height:${afA}px;border:3px solid rgba(250,204,21,0.72);box-shadow:0 0 8px rgba(250,204,21,0.3)}
    .af .tl{top:0;left:0;border-right:0;border-bottom:0}.af .tr{top:0;right:0;border-left:0;border-bottom:0}
    .af .bl{bottom:0;left:0;border-right:0;border-top:0}.af .br{bottom:0;right:0;border-left:0;border-top:0}
    .af .ctr{left:50%;top:50%;width:8px;height:8px;border:0;background:rgba(250,204,21,0.85);border-radius:50%;
      transform:translate(-50%,-50%);box-shadow:0 0 10px rgba(250,204,21,0.6)}`
  const ins = m + arm + 16
  const body = `
    ${cropMarks(m, arm)}
    ${osdTop(ins, m, osdFs, reel ? 34 : 32, '00:12')}
    <div class="af"><span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span><span class="ctr"></span></div>
    ${osdBottom(ins, m, osdFs)}`
  return doc(w, h, true, head, body)
}

/* ─────────────────────────  render queue  ───────────────────────── */
// Instagram reels + stories only — all 1080×1920 vertical. No landscape.
const jobs = [
  { name: 'intro-reel', w: 1080, h: 1920, alpha: false, html: intro(1080, 1920) },
  // Blank name-plate — type the subject/name as a CapCut text layer in the well.
  { name: 'lowerthird-nameplate-reel', w: 1080, h: 1920, alpha: true,
    html: lowerThird(1080, 1920, { tag: 'Feature', blank: true, sub: '<b>flickdaymedia.com</b>' }) },
  // Evergreen gallery CTA — fixed copy, no editing needed.
  { name: 'lowerthird-gallery-reel', w: 1080, h: 1920, alpha: true,
    html: lowerThird(1080, 1920, { tag: 'See the full set', lead: 'FLICKDAYMEDIA.COM', accent: true, sub: '<b>@flickday.media</b>' }) },
  { name: 'bug-reel', w: 1080, h: 1920, alpha: true, html: bug(1080, 1920, 'top-left') },
  { name: 'hud-viewfinder-reel', w: 1080, h: 1920, alpha: true, html: hud(1080, 1920) },
  { name: 'outro-reel', w: 1080, h: 1920, alpha: false, html: outro(1080, 1920) },
]

const browser = await chromium.launch()
console.log(`Rendering ${jobs.length} reel overlays...\n`)
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 1 })
  const tmp = join(outDir, `_tmp.html`)
  writeFileSync(tmp, job.html)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(350)
  await page.screenshot({ path: join(outDir, `${job.name}.png`), omitBackground: job.alpha, clip: { x: 0, y: 0, width: job.w, height: job.h } })
  console.log(`✓ ${job.name}.png  (${job.w}x${job.h})${job.alpha ? '  alpha' : ''}`)
  await page.close()
  rmSync(tmp)
}
await browser.close()
console.log('\nDone. Reel overlay kit in flickday-assets/reel-overlays/')
