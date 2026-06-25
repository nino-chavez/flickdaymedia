/**
 * Flickday Media — IDENTITY SYSTEM v2 on real surfaces (proposal, not live).
 *
 *   node scripts/story-assets/render-system-v2.mjs
 *
 * The five concept territories resolved into one working system:
 *   • masthead (03)      → primary nameplate
 *   • chronophoto (01)   → motion/photo treatment + the F glyph
 *   • kinetic K (05)     → wordmark + secondary active mark
 *   • streak grid (04)   → daily-cadence texture + counter
 *   • day-counter (02)   → supporting motif
 *
 * Output: flickday-assets/logo-concepts/system-v2/
 *   Presentation boards (judge in context) + raw assets (transparent, deployable).
 *
 * Palette: yellow #facc15 / hover #fde047 / orange #f97316 / near-black.
 * Type: Bebas Neue (display), Inter (body), JetBrains Mono (labels).
 * Reuses Playwright from the sibling letspepper repo.
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'logo-concepts', 'system-v2')
mkdirSync(outDir, { recursive: true })

const YELLOW = '#facc15'
const ORANGE = '#f97316'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');`

const baseCss = `*{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:#fff;-webkit-font-smoothing:antialiased}`

const doc = (body, extraCss = '') =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${baseCss}${extraCss}</style></head><body>${body}</body></html>`

// ── shared components ──────────────────────────────────────────────────────
// ghost offsets as a ratio of font-size, from the wordmark tuning
const GH = [
  { xr: -0.28, sk: -7, op: 0.5, c: '#fbbf24' },
  { xr: -0.6, sk: -9, op: 0.33, c: '#f59e0b' },
  { xr: -0.96, sk: -11, op: 0.2, c: '#f97316' },
  { xr: -1.37, sk: -13, op: 0.12, c: '#f97316' },
  { xr: -1.84, sk: -15, op: 0.06, c: '#ea580c' },
]

// chronophoto text: ghost copies trail left + fade, crisp yellow frame on top
function chrono(text, fs, { spread = 1, n = 5, glow = 0.4 } = {}) {
  const ghosts = [...GH.slice(0, n)]
    .reverse()
    .map(
      (g) =>
        `<span class="cg" style="opacity:${g.op};color:${g.c};
        transform:translateX(${Math.round(g.xr * fs * spread)}px) skewX(${g.sk}deg)">${text}</span>`
    )
    .join('')
  return `<span class="cx" style="font-size:${fs}px">
    <span class="cstage">${ghosts}<span class="ch" style="text-shadow:0 0 ${Math.round(fs * 0.42)}px rgba(250,204,21,${glow})">${text}</span></span>
  </span>`
}
const chronoCss = `
  .cx{display:inline-block;font-family:'Bebas Neue',sans-serif;line-height:0.8;letter-spacing:0.02em}
  .cx .cstage{position:relative;display:inline-block}
  .cx span.cg,.cx span.ch{display:block;white-space:nowrap}
  .cx .cg{position:absolute;right:0;bottom:0;transform-origin:bottom right}
  .cx .ch{position:relative;color:${YELLOW}}`

// kinetic wordmark: FLIC[K]DAY, the K leans + kicks a rising streak into the gap
function kWord(fs) {
  const bars = [
    { w: 0.4, o: 0.95, c: YELLOW },
    { w: 0.32, o: 0.62, c: '#fbbf24' },
    { w: 0.24, o: 0.42, c: ORANGE },
    { w: 0.17, o: 0.26, c: ORANGE },
  ]
    .map(
      (b) =>
        `<i style="width:${Math.round(b.w * fs)}px;opacity:${b.o};background:${b.c}"></i>`
    )
    .join('')
  return `<span class="kw" style="font-size:${fs}px">FLIC<span class="kk">K<span class="kstreak">${bars}</span></span>DAY</span>`
}
const kCss = `
  .kw{display:inline-flex;align-items:baseline;font-family:'Bebas Neue',sans-serif;
    line-height:0.8;letter-spacing:0.02em;color:#fff}
  .kw .kk{display:inline-block;color:${YELLOW};transform:skewX(-12deg);
    transform-origin:bottom left;text-shadow:0 0 0.3em rgba(250,204,21,0.5);
    position:relative;margin-right:0.42em}
  .kw .kstreak{position:absolute;left:74%;bottom:0.12em;display:flex;flex-direction:column;
    gap:0.045em;transform:rotate(-32deg);transform-origin:left bottom;pointer-events:none}
  .kw .kstreak i{height:0.042em;border-radius:0.03em;display:block}`

// streak strip (contribution heatmap), rows×cols, deterministic fill
function streak(rows, cols, cell = 22, gap = 6, { taper = true } = {}) {
  let cells = ''
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let filled = taper ? c < cols - 2 : true
      if (c < 6 && (c * 7 + r * 3) % 17 === 0) filled = false
      if (taper && c === cols - 2) filled = r < Math.ceil(rows * 0.55)
      if (taper && c === cols - 1) filled = r < 1
      let s
      if (filled) {
        const t = (c * 13 + r * 29) % 100
        const col = t < 20 ? ORANGE : t < 55 ? '#fbbf24' : YELLOW
        const today = taper && c === cols - 1 && r === 0
        s = `background:${col};${today ? 'box-shadow:0 0 0 3px rgba(250,204,21,0.35),0 0 18px rgba(250,204,21,0.8);' : ''}`
      } else {
        s = 'background:#141519;border:1px solid #24262c'
      }
      cells += `<i style="${s}"></i>`
    }
  }
  return `<div class="stk" style="grid-template-rows:repeat(${rows},${cell}px);grid-auto-columns:${cell}px;gap:${gap}px">${cells}</div>`
}
const stkCss = `.stk{display:grid;grid-auto-flow:column}
  .stk i{display:block;border-radius:${`5px`}}`

// the F glyph — chronophoto initial (for tiles/avatars) and solid (for tiny sizes)
const glyphCss = `
  .tile{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;
    background:radial-gradient(120% 120% at 38% 30%,#1a180f,#0a0a0a 60%,#050505)}
  .tile.round{border-radius:50%}
  .solidF{font-family:'Bebas Neue',sans-serif;color:${YELLOW};line-height:0.8}`

// ── presentation boards (1600×1000, judged in context) ─────────────────────
const BW = 1600
const BH = 1000
const boardCss = (extra) => `
  html,body{width:${BW}px;height:${BH}px}
  body{background:radial-gradient(125% 120% at 50% 36%,#15140e 0%,#0a0a0a 52%,#000 100%);
    position:relative;overflow:hidden}
  .board{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .cap{position:absolute;left:64px;bottom:54px;font-family:'JetBrains Mono',monospace;
    font-weight:500;font-size:18px;letter-spacing:0.34em;text-transform:uppercase;color:#6b7280}
  .cap b{color:${YELLOW};font-weight:700}
  .corner{position:absolute;right:64px;bottom:54px;font-family:'JetBrains Mono',monospace;
    font-weight:500;font-size:15px;letter-spacing:0.3em;text-transform:uppercase;color:#374151}
  ${chronoCss}${kCss}${stkCss}${glyphCss}${extra}`

// board: app icon / favicon — big tile + reduced scale row
function boardIcon() {
  const tile = (px, chronoF, radius) =>
    `<div class="tile ${radius ? 'round' : ''}" style="width:${px}px;height:${px}px;border-radius:${radius || Math.round(px * 0.22)}px">
      ${chronoF ? `<div style="transform:translateX(${Math.round(px * 0.06)}px)">${chrono('F', Math.round(px * 0.62), { spread: 0.42, n: 3, glow: 0.5 })}</div>` : `<span class="solidF" style="font-size:${Math.round(px * 0.66)}px">F</span>`}
    </div>`
  return doc(
    `<div class="board">
      ${tile(300, true)}
      <div style="display:flex;align-items:flex-end;gap:42px;margin-top:74px">
        ${tile(96, true)}${tile(56, false)}${tile(32, false)}
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:0.3em;
        text-transform:uppercase;color:#4b5563;margin-top:26px">512 · 96 · reduced 56 / 32</div>
      <div class="cap">App icon / favicon &middot; <b>chronophoto F, solid when small</b></div>
      <div class="corner">Active mark</div>
    </div>`,
    boardCss()
  )
}

// board: avatar + handle bug, over a faux footage strip
function boardAvatarBug() {
  const av = `<div class="tile round" style="width:240px;height:240px">
      <div style="transform:translateX(14px)">${chrono('F', 150, { spread: 0.42, n: 3, glow: 0.5 })}</div>
    </div>`
  const bug = `<div style="display:inline-flex;align-items:center;gap:18px;padding:20px 38px 20px 28px;
      border-radius:16px;background:#0b0b0c;border:1px solid rgba(250,204,21,0.25);
      box-shadow:0 18px 50px rgba(0,0,0,0.5)">
      <span class="solidF" style="font-size:46px">F</span>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:34px;
        letter-spacing:0.02em;color:#fff"><span style="color:${YELLOW}">@</span>flickday.media</span>
    </div>`
  return doc(
    `<div class="board">
      <div style="display:flex;align-items:center;gap:80px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:22px">
          ${av}
          <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;
            letter-spacing:0.18em;color:#fff">flickday.media</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:0.2em;
            text-transform:uppercase;color:#6b7280">Sports media &middot; Chicago</span>
        </div>
        ${bug}
      </div>
      <div class="cap">Avatar + social bug &middot; <b>profile circle + reel handle</b></div>
      <div class="corner">Social</div>
    </div>`,
    boardCss()
  )
}

// board: site header — chronophoto lockup on a faux nav bar
function boardHeader() {
  const nav = `<div style="width:1320px;height:108px;border-radius:16px;background:#0b0b0c;
      border:1px solid #1d1f24;display:flex;align-items:center;justify-content:space-between;
      padding:0 44px;box-shadow:0 24px 60px rgba(0,0,0,0.5)">
      <div style="display:flex;align-items:center;gap:18px">
        <div class="tile" style="width:54px;height:54px;border-radius:12px">
          <span class="solidF" style="font-size:38px">F</span>
        </div>
        ${kWord(46)}
      </div>
      <div style="display:flex;gap:40px;font-family:'JetBrains Mono',monospace;font-weight:500;
        font-size:16px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af">
        <span>Work</span><span>Events</span><span>Galleries</span>
        <span style="color:#0a0a0a;background:${YELLOW};padding:10px 20px;border-radius:8px;font-weight:700">Book</span>
      </div>
    </div>`
  const big = `<div style="display:flex;flex-direction:column;align-items:center;gap:22px">
      ${kWord(132)}
      <div style="display:flex;align-items:center;gap:16px;width:560px">
        <span style="flex:1;height:1px;background:#374151"></span>
        <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:18px;
          letter-spacing:0.5em;text-transform:uppercase;color:${YELLOW};padding-left:0.5em">Media</span>
        <span style="flex:1;height:1px;background:#374151"></span>
      </div>
    </div>`
  return doc(
    `<div class="board" style="gap:96px">
      ${nav}
      ${big}
      <div class="cap">Site header &middot; <b>nav lockup + hero lockup</b></div>
      <div class="corner">Web</div>
    </div>`,
    boardCss()
  )
}

// board: reel outro card (1080×1920 shown framed as a phone)
function outroInner() {
  return `<div class="otr">
      <div style="display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:30px">
        <div class="tile round" style="width:150px;height:150px">
          <div style="transform:translateX(9px)">${chrono('F', 94, { spread: 0.42, n: 3, glow: 0.5 })}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center">
        <div style="width:760px;height:1px;background:#3f3a1a"></div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:200px;line-height:0.82;
          letter-spacing:0.015em;color:${YELLOW};text-shadow:0 0 90px rgba(250,204,21,0.4);margin:26px 0">FLICKDAY</div>
        <div style="width:760px;height:1px;background:#3f3a1a"></div>
        <div style="display:flex;justify-content:space-between;width:760px;margin-top:20px;
          font-family:'JetBrains Mono',monospace;font-weight:600;font-size:26px;
          letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af">
          <span>Media</span><span style="color:${YELLOW}">Every day&rsquo;s a Flickday</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:54px;margin-bottom:24px">
        <div style="opacity:0.9">${streak(5, 18, 26, 8)}</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:18px">
          <span style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:42px;
            letter-spacing:0.02em;color:#fff"><span style="color:${YELLOW}">@</span>flickday.media</span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:600;font-size:28px;
            letter-spacing:0.34em;text-transform:uppercase;color:#6b7280">See the full set &rarr;</span>
        </div>
      </div>
    </div>`
}
const otrCss = `.otr{width:1080px;height:1920px;display:flex;flex-direction:column;
  align-items:center;justify-content:space-between;padding:120px 0 90px;
  background:radial-gradient(120% 80% at 50% 40%,#16140d,#0a0a0a 56%,#000)}`

function boardOutro() {
  const scale = 0.44
  return doc(
    `<div class="board">
      <div style="position:relative;transform:scale(${scale});transform-origin:center">
        <div style="border-radius:64px;overflow:hidden;border:10px solid #1c1d22;box-shadow:0 50px 120px rgba(0,0,0,0.6)">
          ${outroInner()}
        </div>
      </div>
      <div class="cap">Reel outro &middot; <b>1080×1920 end card</b></div>
      <div class="corner">Short-form</div>
    </div>`,
    boardCss(otrCss)
  )
}

// ── raw deployable assets (transparent / exact dims) ───────────────────────
function rawFGlyph(px) {
  return doc(`<div style="display:inline-block;padding:${Math.round(px * 0.12)}px">${chrono('F', px, { spread: 0.42, n: 3, glow: 0.5 })}</div>`, chronoCss)
}
function rawHeaderLockup() {
  return doc(
    `<div style="display:inline-flex;align-items:center;gap:34px;padding:60px">
      ${kWord(120)}
      <span style="width:2px;height:120px;background:#374151"></span>
      <span style="display:flex;flex-direction:column;gap:10px;font-family:'JetBrains Mono',monospace">
        <span style="font-weight:700;font-size:30px;letter-spacing:0.4em;text-transform:uppercase;color:${YELLOW}">Media</span>
        <span style="font-weight:500;font-size:17px;letter-spacing:0.26em;text-transform:uppercase;color:#9ca3af">Every day&rsquo;s a Flickday</span>
      </span>
    </div>`,
    kCss
  )
}
function rawSocialBug() {
  return doc(
    `<div style="display:inline-block;padding:54px">
      <div style="display:inline-flex;align-items:center;gap:18px;padding:22px 42px 22px 30px;
        border-radius:18px;background:#0b0b0c;border:1px solid rgba(250,204,21,0.28);
        box-shadow:0 20px 56px rgba(0,0,0,0.55),0 0 40px rgba(250,204,21,0.1)">
        <span style="font-family:'Bebas Neue',sans-serif;color:${YELLOW};font-size:52px;line-height:0.8">F</span>
        <span style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:38px;
          letter-spacing:0.02em;color:#fff"><span style="color:${YELLOW}">@</span>flickday.media</span>
      </div>
    </div>`
  )
}

// ── render ─────────────────────────────────────────────────────────────────
const BOARDS = [
  { name: 'board-1-app-icon', html: boardIcon(), w: BW, h: BH },
  { name: 'board-2-avatar-bug', html: boardAvatarBug(), w: BW, h: BH },
  { name: 'board-3-header', html: boardHeader(), w: BW, h: BH },
  { name: 'board-4-outro', html: boardOutro(), w: BW, h: BH },
]
const ASSETS = [
  { name: 'asset-f-glyph', html: rawFGlyph(512), w: 640, h: 640, t: true },
  { name: 'asset-header-lockup', html: rawHeaderLockup(), w: 1640, h: 360, t: true },
  { name: 'asset-social-bug', html: rawSocialBug(), w: 820, h: 320, t: true },
  { name: 'asset-outro-reel', html: doc(outroInner(), otrCss), w: 1080, h: 1920, t: false },
]

const browser = await chromium.launch()
for (const item of [...BOARDS, ...ASSETS]) {
  writeFileSync(join(outDir, `${item.name}.html`), item.html)
  const page = await browser.newPage({
    viewport: { width: item.w, height: item.h },
    deviceScaleFactor: 2,
  })
  await page.setContent(item.html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: join(outDir, `${item.name}.png`), omitBackground: !!item.t })
  await page.close()
  console.log('rendered', item.name)
}
await browser.close()
console.log('\nDone →', outDir)
