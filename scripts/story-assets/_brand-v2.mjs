/**
 * Flickday Media — brand system v2, shared source of truth.
 *
 * The five concept territories resolved into reusable components so every
 * generator (site marks, social bugs, outro, reel overlays) speaks one language
 * and can't drift:
 *   • kinetic K wordmark (kWord)   → the logotype
 *   • chronophoto initial (chrono) → the F glyph + motion/photo treatment
 *   • masthead (masthead)          → editorial nameplate
 *   • streak grid (streak)         → daily-cadence texture
 *   • handle bug (handleBug)       → @flickday.media credit
 *
 * Replaces the old aperture / viewfinder (EVF) language. Palette + type are
 * unchanged from DESIGN.md. Reuses Playwright from the sibling letspepper repo.
 */
import { createRequire } from 'node:module'
import { writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FONTS as EMBEDDED_FONTS } from './_fonts.mjs'

export const YELLOW = '#facc15'
export const AMBER = '#fbbf24'
export const ORANGE = '#f97316'
export const EMBER = '#ea580c'
export const INK = '#f5f5f0'

// embedded base64 woff2 — offline-safe (no Google Fonts network dependency)
export const FONTS = EMBEDDED_FONTS

// warm asymmetric ground (near-black, off-center glow) — shared across opaque cards
export const groundCss = `
  .v2warm{position:absolute;inset:0;background:
    radial-gradient(74% 56% at 28% 26%, rgba(250,204,21,0.13), transparent 56%),
    radial-gradient(90% 70% at 86% 96%, rgba(249,115,22,0.08), transparent 60%)}
  .v2vign{position:absolute;inset:0;box-shadow:inset 0 0 340px 80px rgba(0,0,0,0.72);pointer-events:none}`
export const ground = () => `<div class="v2warm"></div><div class="v2vign"></div>`

// ── chronophoto text: ghost copies trail left + fade, crisp yellow frame on top ──
const GH = [
  { xr: -0.28, sk: -7, op: 0.5, c: AMBER },
  { xr: -0.6, sk: -9, op: 0.33, c: '#f59e0b' },
  { xr: -0.96, sk: -11, op: 0.2, c: ORANGE },
  { xr: -1.37, sk: -13, op: 0.12, c: ORANGE },
  { xr: -1.84, sk: -15, op: 0.06, c: EMBER },
]
export function chrono(text, fs, { spread = 1, n = 5, glow = 0.4 } = {}) {
  const ghosts = [...GH.slice(0, n)]
    .reverse()
    .map(
      (g) =>
        `<span class="cg" style="opacity:${g.op};color:${g.c};
        transform:translateX(${Math.round(g.xr * fs * spread)}px) skewX(${g.sk}deg)">${text}</span>`
    )
    .join('')
  return `<span class="cx" style="font-size:${fs}px"><span class="cstage">${ghosts}<span class="ch" style="text-shadow:0 0 ${Math.round(fs * 0.42)}px rgba(250,204,21,${glow})">${text}</span></span></span>`
}

// ── kinetic wordmark: FLIC[K]DAY, the K leans + kicks a rising streak ──
export function kWord(fs) {
  const bars = [
    { w: 0.4, o: 0.95, c: YELLOW },
    { w: 0.32, o: 0.62, c: AMBER },
    { w: 0.24, o: 0.42, c: ORANGE },
    { w: 0.17, o: 0.26, c: ORANGE },
  ]
    .map((b) => `<i style="width:${Math.round(b.w * fs)}px;opacity:${b.o};background:${b.c}"></i>`)
    .join('')
  return `<span class="kw" style="font-size:${fs}px">FLIC<span class="kk">K<span class="kstreak">${bars}</span></span>DAY</span>`
}

// ── streak grid (contribution heatmap), deterministic fill ──
export function streak(rows, cols, { cell = 22, gap = 6, taper = true } = {}) {
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
        const col = t < 20 ? ORANGE : t < 55 ? AMBER : YELLOW
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

// ── masthead: editorial nameplate — dateline rule, big yellow FLICKDAY, base rule ──
export function masthead(fs, { width = 760, top = 'Vol. I · No. 365', loc = 'Chicago', sub = "Every day's a Flickday" } = {}) {
  return `<div class="mh" style="--mw:${width}px">
    <div class="mh-top"><span>${top}</span><span>${loc}</span></div>
    <div class="mh-rule"></div>
    <div class="mh-title" style="font-size:${fs}px">FLICKDAY</div>
    <div class="mh-rule"></div>
    <div class="mh-bot"><span>Media</span><span class="hot">${sub}</span></div>
  </div>`
}

// ── handle bug: solid F + @handle ──
export function handleBug(fs, { handle = '@flickday.media' } = {}) {
  return `<span class="hb" style="font-size:${fs}px"><span class="hb-f">F</span><span class="hb-at">${handle}</span></span>`
}

// solid F glyph (small sizes)
export const solidF = (fs) => `<span class="solidF" style="font-size:${fs}px">F</span>`

// ── outro end card — shared by the outro kit + the reel-overlay kit ──
// Vertical (reel, h>w) or landscape. Avatar F · masthead nameplate · streak · handle.
export function outroCard(w, h, { handle = 'flickday.media', cta = 'See the full set →' } = {}) {
  const reel = h > w
  const titleFs = reel ? 200 : 156
  const avPx = reel ? 150 : 132
  const fFs = Math.round(avPx * 0.62)
  const mw = reel ? 760 : 900
  const pad = reel ? '120px 0 96px' : '64px 0 56px'
  const rows = reel ? 5 : 4
  const cols = reel ? 18 : 26
  const handleClean = handle.replace('@', '')
  return `${ground()}
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:${pad}">
      <div class="tile round" style="width:${avPx}px;height:${avPx}px">
        <div style="transform:translateX(${Math.round(avPx * 0.06)}px)">${chrono('F', fFs, { spread: 0.42, n: 3, glow: 0.5 })}</div>
      </div>
      ${masthead(titleFs, { width: mw })}
      <div style="display:flex;flex-direction:column;align-items:center;gap:${reel ? 54 : 40}px">
        <div style="opacity:0.9">${streak(rows, cols, { cell: reel ? 26 : 22, gap: 8 })}</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px">
          <span style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:${reel ? 42 : 38}px;
            letter-spacing:0.02em;color:#fff"><span style="color:${YELLOW}">@</span>${handleClean}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:600;font-size:${reel ? 28 : 24}px;
            letter-spacing:0.34em;text-transform:uppercase;color:#6b7280">${cta}</span>
        </div>
      </div>
    </div>`
}

// ── one CSS blob for all components ──
export const CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
  .cx{display:inline-block;font-family:'Bebas Neue',sans-serif;line-height:0.8;letter-spacing:0.02em}
  .cx .cstage{position:relative;display:inline-block}
  .cx span.cg,.cx span.ch{display:block;white-space:nowrap}
  .cx .cg{position:absolute;right:0;bottom:0;transform-origin:bottom right}
  .cx .ch{position:relative;color:${YELLOW}}
  .kw{display:inline-flex;align-items:baseline;font-family:'Bebas Neue',sans-serif;line-height:0.8;letter-spacing:0.02em;color:#fff}
  .kw .kk{display:inline-block;color:${YELLOW};transform:skewX(-12deg);transform-origin:bottom left;
    text-shadow:0 0 0.3em rgba(250,204,21,0.5);position:relative;margin-right:0.42em}
  .kw .kstreak{position:absolute;left:74%;bottom:0.12em;display:flex;flex-direction:column;gap:0.045em;
    transform:rotate(-32deg);transform-origin:left bottom;pointer-events:none}
  .kw .kstreak i{height:0.042em;border-radius:0.03em;display:block}
  .stk{display:grid;grid-auto-flow:column}
  .stk i{display:block;border-radius:5px}
  .mh{width:var(--mw);display:flex;flex-direction:column;align-items:center}
  .mh-rule{width:100%;height:1px;background:#3f3a1a}
  .mh-top,.mh-bot{width:100%;display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;
    font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;font-size:calc(var(--mw)*0.024)}
  .mh-top{padding-bottom:0.7em}.mh-bot{padding-top:0.7em}
  .mh-bot .hot{color:${YELLOW};font-weight:700}
  .mh-title{font-family:'Bebas Neue',sans-serif;line-height:0.82;letter-spacing:0.015em;color:${YELLOW};
    margin:0.12em 0;text-shadow:0 0 0.4em rgba(250,204,21,0.4)}
  .solidF{font-family:'Bebas Neue',sans-serif;color:${YELLOW};line-height:0.8}
  .hb{display:inline-flex;align-items:center;gap:0.46em;font-family:'JetBrains Mono',monospace;font-weight:800;
    letter-spacing:0.02em;color:#fff;white-space:nowrap}
  .hb .hb-f{font-family:'Bebas Neue',sans-serif;color:${YELLOW};font-weight:400;font-size:1.36em;line-height:0.7}
  .hb .hb-at{}
  .tile{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;
    background:radial-gradient(120% 120% at 38% 30%,#1a180f,#0a0a0a 60%,#050505)}
  .tile.round{border-radius:50%}`

export const page = (body, { w, h, alpha = false, extraCss = '' } = {}) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${CSS}${groundCss}
    html,body{width:${w}px;height:${h}px;overflow:hidden;${alpha ? 'background:transparent' : 'background:#070707'}}
    ${extraCss}</style></head><body>${body}</body></html>`

// ── render queue helper ──
export async function renderJobs(jobs, outDir, { scale = 1 } = {}) {
  const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
  const { chromium } = require('playwright')
  const browser = await chromium.launch()
  for (const job of jobs) {
    const page2 = await browser.newPage({
      viewport: { width: job.w, height: job.h },
      deviceScaleFactor: job.scale || scale,
    })
    const tmp = join(outDir, `_tmp-${job.name}.html`)
    writeFileSync(tmp, job.html)
    await page2.goto(pathToFileURL(tmp).href, { waitUntil: 'domcontentloaded', timeout: 60000 })
    // cap font wait so a flaky CDN can't hang the load event (the @import blocks 'load')
    await page2.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))]))
    await page2.waitForTimeout(250)
    await page2.screenshot({
      path: join(outDir, `${job.name}.png`),
      omitBackground: !!job.alpha,
      clip: { x: 0, y: 0, width: job.w, height: job.h },
    })
    rmSync(tmp)
    await page2.close()
    console.log('✓', job.name, `(${job.w}x${job.h})${job.alpha ? ' alpha' : ''}`)
  }
  await browser.close()
}
