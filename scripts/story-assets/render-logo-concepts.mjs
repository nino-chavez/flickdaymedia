/**
 * Flickday Media — logo CONCEPT boards (exploration, not final assets).
 *
 *   node scripts/story-assets/render-logo-concepts.mjs
 *
 * Output: flickday-assets/logo-concepts/   (opaque PNGs on near-black + .html source)
 *
 * Three fresh directions — deliberately NOT built on the existing aperture /
 * viewfinder / f-stop kit. Each board is a judgeable artifact: one mark, centred,
 * on the brand's black with a muted mono caption.
 *
 *   01  chronophotography  — motion resolves into a frame (typographic strobe)
 *   03  the 8th day        — an invented weekday / editorial masthead
 *   05  motion-baked type  — the K kicks; motion lives inside the letterform
 *
 * Palette: Flickday yellow #facc15, hover #fde047, event orange #f97316, near-black.
 * Type: Bebas Neue (display), Inter (body), JetBrains Mono (labels).
 *
 * Dependency note: reuses Playwright from the sibling letspepper repo to keep this
 * static-site repo free of a heavy browser dep.
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'logo-concepts')
mkdirSync(outDir, { recursive: true })

const YELLOW = '#facc15'
const ORANGE = '#f97316'

const W = 1600
const H = 1000

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');`

const reset = `*{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  body{
    font-family:'Inter',sans-serif;color:#fff;-webkit-font-smoothing:antialiased;
    background:radial-gradient(125% 120% at 50% 36%, #15140e 0%, #0a0a0a 52%, #000 100%);
    position:relative;overflow:hidden;
  }
  .board{position:absolute;inset:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center}
  .cap{position:absolute;left:64px;bottom:54px;font-family:'JetBrains Mono',monospace;
    font-weight:500;font-size:18px;letter-spacing:0.34em;text-transform:uppercase;
    color:#6b7280}
  .cap b{color:${YELLOW};font-weight:700}
  .corner{position:absolute;right:64px;bottom:54px;font-family:'JetBrains Mono',monospace;
    font-weight:500;font-size:15px;letter-spacing:0.3em;text-transform:uppercase;
    color:#374151}`

// ── 01 · chronophotography ────────────────────────────────────────────────
// The wordmark emerges from its own motion: ghost copies trail left, leaning and
// fading from orange to nothing; the live frame snaps crisp and yellow.
const GHOSTS = [
  { x: -52, sk: -7, op: 0.5, c: '#fbbf24', s: 1.0 },
  { x: -110, sk: -9, op: 0.33, c: '#f59e0b', s: 1.0 },
  { x: -176, sk: -11, op: 0.2, c: '#f97316', s: 1.0 },
  { x: -252, sk: -13, op: 0.12, c: '#f97316', s: 1.0 },
  { x: -338, sk: -15, op: 0.06, c: '#ea580c', s: 1.0 },
]
function chrono() {
  const ghosts = [...GHOSTS]
    .reverse()
    .map(
      (g) =>
        `<span class="g" style="opacity:${g.op};color:${g.c};
          transform:translateX(${g.x}px) skewX(${g.sk}deg) scale(${g.s})">FLICKDAY</span>`
    )
    .join('')
  return `<style>
    .chrono{position:relative;display:inline-block;margin-bottom:46px}
    .chrono .stage{position:relative;display:inline-block}
    .chrono span{font-family:'Bebas Neue',sans-serif;font-size:184px;line-height:0.8;
      letter-spacing:0.02em;white-space:nowrap;display:block}
    .chrono .g{position:absolute;right:0;bottom:0;transform-origin:bottom right}
    .chrono .hero{position:relative;color:${YELLOW};
      text-shadow:0 0 80px rgba(250,204,21,0.45)}
    /* strobe ticks rising to the frame */
    .ticks{display:flex;align-items:flex-end;gap:26px;height:40px;margin-bottom:30px}
    .ticks i{display:block;width:5px;border-radius:2px;background:${ORANGE}}
    .sub{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:21px;
      letter-spacing:0.42em;text-transform:uppercase;color:#a3a3a3}
  </style>
  <div class="board">
    <div class="chrono"><div class="stage">${ghosts}<span class="hero">FLICKDAY</span></div></div>
    <div class="ticks">
      <i style="height:14%;opacity:.25"></i><i style="height:30%;opacity:.4"></i>
      <i style="height:52%;opacity:.6"></i><i style="height:74%;opacity:.8"></i>
      <i style="height:100%;background:${YELLOW};opacity:1"></i>
    </div>
    <div class="sub">Every day&rsquo;s a Flickday</div>
    <div class="cap">01 / Chronophotography &middot; <b>motion resolves to a frame</b></div>
    <div class="corner">Flickday Media</div>
  </div>`
}

// ── 03 · the 8th day ───────────────────────────────────────────────────────
// Editorial masthead. "Flickday" reads like a weekday, so we mint it — an 8th day
// lit on the week strip. Dateline + issue number give it press credibility.
function eighthDay() {
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    .map((d) => `<div class="day">${d}</div>`)
    .join('')
  return `<style>
    .mast{width:1180px;display:flex;flex-direction:column;align-items:center}
    .rule{width:100%;height:1px;background:#374151}
    .topline{width:100%;display:flex;justify-content:space-between;
      font-family:'JetBrains Mono',monospace;font-weight:500;font-size:18px;
      letter-spacing:0.34em;text-transform:uppercase;color:#9ca3af;padding:0 4px 18px}
    .title{font-family:'Bebas Neue',sans-serif;font-size:232px;line-height:0.82;
      letter-spacing:0.015em;color:#fff;margin:30px 0 26px;text-shadow:0 0 90px rgba(250,204,21,0.12)}
    .botline{width:100%;display:flex;justify-content:space-between;align-items:baseline;
      font-family:'JetBrains Mono',monospace;font-weight:500;font-size:18px;
      letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;padding:18px 4px 0}
    .botline b{color:${YELLOW};font-weight:700}
    .week{display:flex;gap:14px;margin-top:64px;align-items:stretch}
    .day,.flick{font-family:'JetBrains Mono',monospace;text-transform:uppercase;
      letter-spacing:0.22em;font-size:20px;padding:18px 22px;border-radius:4px;
      display:flex;align-items:center;justify-content:center}
    .day{border:1px solid #374151;color:#6b7280;font-weight:500}
    .sep{width:1px;background:#374151;margin:6px 8px}
    .flick{background:${YELLOW};color:#0a0a0a;font-weight:700;letter-spacing:0.18em;
      box-shadow:0 0 50px rgba(250,204,21,0.45)}
  </style>
  <div class="board">
    <div class="mast">
      <div class="topline"><span>Vol. I &middot; No. 365</span><span>Chicago</span></div>
      <div class="rule"></div>
      <div class="title">FLICKDAY</div>
      <div class="rule"></div>
      <div class="botline"><span>Media</span><span><b>Every day&rsquo;s a Flickday</b></span></div>
      <div class="week">${week}<div class="sep"></div><div class="flick">Flick</div></div>
    </div>
    <div class="cap">03 / The 8th day &middot; <b>an invented weekday</b></div>
    <div class="corner">Masthead</div>
  </div>`
}

// ── 05 · motion-baked logotype ─────────────────────────────────────────────
// No separate icon. The K is the kinetic letter — it leans and kicks a motion
// streak out of its leg, RISING into the gap before DAY so it never strikes
// through the word. Motion lives inside the type, not bolted on beside it.
function motionType() {
  // tapered streak bars flung up-and-right off the K's leg, contained in the gap
  const bars = [
    { w: 96, o: 0.95, c: YELLOW },
    { w: 76, o: 0.62, c: '#fbbf24' },
    { w: 58, o: 0.42, c: ORANGE },
    { w: 42, o: 0.26, c: ORANGE },
    { w: 28, o: 0.14, c: '#ea580c' },
  ]
    .map((b) => `<i style="width:${b.w}px;opacity:${b.o};background:${b.c}"></i>`)
    .join('')
  return `<style>
    .logo{position:relative;display:inline-flex;align-items:baseline;
      font-family:'Bebas Neue',sans-serif;font-size:240px;line-height:0.8;
      letter-spacing:0.02em;color:#fff}
    .logo .k{display:inline-block;color:${YELLOW};transform:skewX(-12deg);
      transform-origin:bottom left;text-shadow:0 0 70px rgba(250,204,21,0.5);
      position:relative;margin-right:0.42em}
    /* the kick: bars rise through the gap, clear of DAY */
    .streak{position:absolute;left:74%;bottom:30px;display:flex;flex-direction:column;
      gap:11px;transform:rotate(-32deg);transform-origin:left bottom;pointer-events:none}
    .streak i{height:10px;border-radius:6px;display:block}
    .sub{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:21px;
      letter-spacing:0.42em;text-transform:uppercase;color:#a3a3a3;margin-top:54px}
  </style>
  <div class="board">
    <div class="logo">FLIC<span class="k">K<span class="streak">${bars}</span></span>DAY</div>
    <div class="sub">Every day&rsquo;s a Flickday</div>
    <div class="cap">05 / Motion-baked logotype &middot; <b>the K kicks</b></div>
    <div class="corner">Wordmark</div>
  </div>`
}

// ── 01b · chronophotography LOCKUP ─────────────────────────────────────────
// The concept proven as a deployable logo: primary lockup (mark + MEDIA + line)
// plus a reduced instance to show it survives at small sizes.
function chronoLockup(scale = 1, reduced = false) {
  const fs = Math.round(184 * scale)
  // fewer, tighter ghosts when reduced so the mark stays legible small
  const set = reduced ? GHOSTS.slice(0, 3) : GHOSTS
  const ghosts = [...set]
    .reverse()
    .map(
      (g) =>
        `<span class="g" style="opacity:${g.op};color:${g.c};
          transform:translateX(${Math.round(g.x * scale)}px) skewX(${g.sk}deg)">FLICKDAY</span>`
    )
    .join('')
  return `<div class="lk" style="--fs:${fs}px">
      <div class="stage">${ghosts}<span class="hero">FLICKDAY</span></div>
      <div class="line">
        <span class="r"></span><span class="md">Media</span><span class="r"></span>
      </div>
      <div class="tag">Every day&rsquo;s a Flickday</div>
    </div>`
}
function lockupBoard() {
  return `<style>
    .lk{display:flex;flex-direction:column;align-items:center}
    .lk .stage{position:relative;display:inline-block}
    .lk span.g,.lk span.hero{font-family:'Bebas Neue',sans-serif;font-size:var(--fs);
      line-height:0.8;letter-spacing:0.02em;white-space:nowrap;display:block}
    .lk .g{position:absolute;right:0;bottom:0;transform-origin:bottom right}
    .lk .hero{position:relative;color:${YELLOW};text-shadow:0 0 70px rgba(250,204,21,0.4)}
    .lk .line{display:flex;align-items:center;gap:18px;margin-top:22px;width:88%}
    .lk .line .r{flex:1;height:1px;background:#374151}
    .lk .line .md{font-family:'JetBrains Mono',monospace;font-weight:700;
      font-size:calc(var(--fs)*0.12);letter-spacing:0.5em;text-transform:uppercase;
      color:${YELLOW};padding-left:0.5em}
    .lk .tag{font-family:'JetBrains Mono',monospace;font-weight:500;
      font-size:calc(var(--fs)*0.085);letter-spacing:0.34em;text-transform:uppercase;
      color:#a3a3a3;margin-top:14px}
    .reduced{margin-top:78px;opacity:0.92}
    .divlabel{font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.3em;
      text-transform:uppercase;color:#4b5563;margin:54px 0 8px}
  </style>
  <div class="board">
    ${chronoLockup(1)}
    <div class="divlabel">&mdash; reduced &middot; small-size lockup &mdash;</div>
    <div class="reduced">${chronoLockup(0.4, true)}</div>
    <div class="cap">01b / Chronophotography &middot; <b>deployable lockup</b></div>
    <div class="corner">Lockup</div>
  </div>`
}

// ── 03b · the 8th day, YELLOW title ────────────────────────────────────────
function eighthDayYellow() {
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    .map((d) => `<div class="day">${d}</div>`)
    .join('')
  return `<style>
    .mast{width:1180px;display:flex;flex-direction:column;align-items:center}
    .rule{width:100%;height:1px;background:#3f3a1a}
    .topline{width:100%;display:flex;justify-content:space-between;
      font-family:'JetBrains Mono',monospace;font-weight:500;font-size:18px;
      letter-spacing:0.34em;text-transform:uppercase;color:#9ca3af;padding:0 4px 18px}
    .title{font-family:'Bebas Neue',sans-serif;font-size:232px;line-height:0.82;
      letter-spacing:0.015em;color:${YELLOW};margin:30px 0 26px;
      text-shadow:0 0 100px rgba(250,204,21,0.4)}
    .botline{width:100%;display:flex;justify-content:space-between;align-items:baseline;
      font-family:'JetBrains Mono',monospace;font-weight:500;font-size:18px;
      letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;padding:18px 4px 0}
    .botline b{color:${YELLOW};font-weight:700}
    .week{display:flex;gap:14px;margin-top:64px;align-items:stretch}
    .day,.flick{font-family:'JetBrains Mono',monospace;text-transform:uppercase;
      letter-spacing:0.22em;font-size:20px;padding:18px 22px;border-radius:4px;
      display:flex;align-items:center;justify-content:center}
    .day{border:1px solid #374151;color:#6b7280;font-weight:500}
    .sep{width:1px;background:#374151;margin:6px 8px}
    .flick{background:${YELLOW};color:#0a0a0a;font-weight:700;letter-spacing:0.18em;
      box-shadow:0 0 50px rgba(250,204,21,0.45)}
  </style>
  <div class="board">
    <div class="mast">
      <div class="topline"><span>Vol. I &middot; No. 365</span><span>Chicago</span></div>
      <div class="rule"></div>
      <div class="title">FLICKDAY</div>
      <div class="rule"></div>
      <div class="botline"><span>Media</span><span><b>Every day&rsquo;s a Flickday</b></span></div>
      <div class="week">${week}<div class="sep"></div><div class="flick">Flick</div></div>
    </div>
    <div class="cap">03b / The 8th day &middot; <b>yellow masthead</b></div>
    <div class="corner">Masthead</div>
  </div>`
}

// ── 02 · flipbook / page-a-day ─────────────────────────────────────────────
// The brand is a flipbook: each day is one frame, flick the stack and the season
// plays. A front frame (today) over an echoing stack, with pages flicking off.
function flipbook() {
  const echoes = [3, 2, 1]
    .map(
      (i) =>
        `<div class="frame echo" style="
        transform:translate(${i * 16}px,${-i * 15}px) rotate(${i * 2.4}deg);
        opacity:${0.5 - i * 0.13}"></div>`
    )
    .join('')
  const flicks = [
    { x: 44, y: -92, rot: 15, op: 0.5 },
    { x: 86, y: -168, rot: 30, op: 0.22 },
  ]
    .map(
      (f) =>
        `<div class="frame fly" style="
        transform:translate(${f.x}px,${f.y}px) rotate(${f.rot}deg);opacity:${f.op}"></div>`
    )
    .join('')
  return `<style>
    .flip{position:relative;width:520px;height:560px;margin-bottom:44px}
    .frame{position:absolute;left:96px;bottom:64px;width:300px;height:380px;
      border-radius:16px;border:2px solid #2b2b2b;background:#0c0c0d}
    .frame.echo{border-color:#3a3a32}
    .frame.fly{border-color:rgba(250,204,21,0.4);background:rgba(250,204,21,0.03);
      transform-origin:bottom left}
    .front{position:absolute;left:96px;bottom:64px;width:300px;height:380px;
      border-radius:16px;border:2px solid ${YELLOW};background:#0b0b0c;
      box-shadow:0 32px 74px rgba(0,0,0,0.6),0 0 64px rgba(250,204,21,0.18);
      display:flex;flex-direction:column;justify-content:space-between;padding:28px}
    .front .top{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:15px;
      letter-spacing:0.28em;text-transform:uppercase;color:#9ca3af}
    .front .mid{font-family:'Bebas Neue',sans-serif;font-size:108px;line-height:0.78;
      color:${YELLOW};text-align:center}
    .front .mid small{display:block;font-family:'JetBrains Mono',monospace;
      font-size:14px;letter-spacing:0.3em;color:#6b7280;font-weight:500;margin-top:10px}
    .front .bar{height:6px;border-radius:3px;background:#1c1c1c;overflow:hidden}
    .front .bar i{display:block;height:100%;width:68%;
      background:linear-gradient(90deg,${ORANGE},${YELLOW})}
    .sub{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:21px;
      letter-spacing:0.42em;text-transform:uppercase;color:#a3a3a3}
  </style>
  <div class="board">
    <div class="flip">
      ${echoes}${flicks}
      <div class="front">
        <div class="top">Flickday Media</div>
        <div class="mid">247<small>Day 247 / 365</small></div>
        <div class="bar"><i></i></div>
      </div>
    </div>
    <div class="sub">Every day&rsquo;s a Flickday</div>
    <div class="cap">02 / Flipbook &middot; <b>a frame a day, flick to play</b></div>
    <div class="corner">Page-a-day</div>
  </div>`
}

// ── 04 · streak grid / don't break the chain ───────────────────────────────
// The daily promise made visible: one cell per day, filling like a contribution
// graph. The identity is alive — it grows with consistency.
function streakGrid() {
  const COLS = 26
  const ROWS = 7
  let cells = ''
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      let filled = c < 24
      if (c < 8 && (c * 7 + r * 3) % 17 === 0) filled = false // early sparse gaps
      if (c === 24) filled = r < 4 // present edge tapers
      if (c === 25) filled = r < 1 // today
      let style
      if (filled) {
        const t = (c * 13 + r * 29) % 100
        const col = t < 20 ? ORANGE : t < 55 ? '#fbbf24' : YELLOW
        const today = c === 25 && r === 0
        style = `background:${col};${today ? 'box-shadow:0 0 0 3px rgba(250,204,21,0.35),0 0 24px rgba(250,204,21,0.8);' : ''}`
      } else {
        style = 'background:#141519;border:1px solid #24262c'
      }
      cells += `<i style="${style}"></i>`
    }
  }
  return `<style>
    .title{font-family:'Bebas Neue',sans-serif;font-size:158px;line-height:0.8;
      letter-spacing:0.02em;color:${YELLOW};text-shadow:0 0 90px rgba(250,204,21,0.35);
      margin-bottom:44px}
    .grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,22px);
      grid-auto-columns:22px;gap:6px}
    .grid i{display:block;width:22px;height:22px;border-radius:5px}
    .counter{display:flex;align-items:center;gap:14px;margin-top:42px;
      font-family:'JetBrains Mono',monospace;font-weight:500;font-size:20px;
      letter-spacing:0.32em;text-transform:uppercase;color:#a3a3a3}
    .counter b{color:${YELLOW};font-weight:700}
  </style>
  <div class="board">
    <div class="title">FLICKDAY</div>
    <div class="grid">${cells}</div>
    <div class="counter"><b>247 days</b> &middot; unbroken &middot; every day&rsquo;s a flickday</div>
    <div class="cap">04 / Streak grid &middot; <b>don&rsquo;t break the chain</b></div>
    <div class="corner">Daily cadence</div>
  </div>`
}

const BOARDS = [
  { name: 'concept-01-chronophotography', html: chrono() },
  { name: 'concept-01b-lockup', html: lockupBoard() },
  { name: 'concept-02-flipbook', html: flipbook() },
  { name: 'concept-03-eighth-day', html: eighthDay() },
  { name: 'concept-03b-eighth-day-yellow', html: eighthDayYellow() },
  { name: 'concept-04-streak-grid', html: streakGrid() },
  { name: 'concept-05-motion-logotype', html: motionType() },
]

const page2doc = (body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${reset}</style></head><body>${body}</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })

for (const b of BOARDS) {
  const doc = page2doc(b.html)
  writeFileSync(join(outDir, `${b.name}.html`), doc)
  await page.setContent(doc, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: join(outDir, `${b.name}.png`) })
  console.log('rendered', b.name)
}

await browser.close()
console.log('\nDone →', outDir)
