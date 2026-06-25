/**
 * Flickday Media — brand system v2, shared source of truth.
 *
 * Shared source of truth so every generator (site marks, social bugs, outro,
 * reel overlays, components) speaks one language and can't drift:
 *   • wordmark(width)  → the flickday logotype (traced; play in the 'd')
 *   • playIcon(width)  → the play icon (traced)
 *   • streak()         → daily-cadence heatmap texture
 *   • outroCard()      → shared end card
 *   • page() / ground() / renderJobs() → render plumbing
 *
 * Locked marks load from flickday-assets/brand/*.svg and recolor by fill.
 * Palette + type unchanged from DESIGN.md. Reuses Playwright from letspepper.
 */
import { createRequire } from 'node:module'
import { writeFileSync, rmSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { FONTS as EMBEDDED_FONTS } from './_fonts.mjs'

// ── locked brand vectors (traced from the chosen Firefly marks) ──
// flickday wordmark (play-in-the-d) + play icon. Single-fill SVGs with holes
// preserved → recolor the whole fill for colorways; size by width.
const BRAND_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'flickday-assets', 'brand')
function loadMark(file) {
  const raw = readFileSync(join(BRAND_DIR, file), 'utf8')
  const vb = raw.match(/viewBox="([\d.\s]+)"/)[1].trim().split(/\s+/).map(Number)
  const inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
  return { w: vb[2], h: vb[3], inner }
}

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

// ── LOCKED MARKS: traced flickday wordmark + play icon ──
const _WORDMARK = loadMark('wordmark.svg')
const _PLAY = loadMark('icon-play.svg')
const _emit = (m, px, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.w} ${m.h}" width="${px}" height="${Math.round((px * m.h) / m.w)}" style="display:block">${m.inner.replace(/#facc15/gi, color)}</svg>`
// wordmark(width) — the flickday logotype. playIcon(width) — the play mark.
export const wordmark = (px, { color = '#ffffff' } = {}) => _emit(_WORDMARK, px, color)
export const playIcon = (px, { color = YELLOW } = {}) => _emit(_PLAY, px, color)
export const WORDMARK_RATIO = _WORDMARK.w / _WORDMARK.h
export const PLAY_RATIO = _PLAY.w / _PLAY.h

// two-tone wordmark variant — letters in one color, the 'd' (+ circle play) in the
// accent, so the d pops. Two fills → recolor letters + accent independently.
const _WORDMARK2 = loadMark('wordmark-twotone.svg')
export const wordmarkTwo = (px, { letters = '#ffffff', accent = YELLOW } = {}) => {
  const h = Math.round((px * _WORDMARK2.h) / _WORDMARK2.w)
  const inner = _WORDMARK2.inner.replace(/#ffffff/gi, letters).replace(/#facc15/gi, accent)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${_WORDMARK2.w} ${_WORDMARK2.h}" width="${px}" height="${h}" style="display:block">${inner}</svg>`
}
export const WORDMARK2_RATIO = _WORDMARK2.w / _WORDMARK2.h

// film-reel wordmark variant — all one color, a film reel in the 'd' (cinema / "flick")
const _WORDMARK_REEL = loadMark('wordmark-reel.svg')
export const wordmarkReel = (px, { color = YELLOW } = {}) => _emit(_WORDMARK_REEL, px, color)
export const WORDMARK_REEL_RATIO = _WORDMARK_REEL.w / _WORDMARK_REEL.h

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

// ── FD scoreboard — the daily-cadence grid that actually spells FD (LED look) ──
// Reads as a sports scoreboard (grassroots sports) + the every-day grid + the brand.
export function gridFD({ cell = 22, gap = 6, lit = YELLOW, dim = '#23252b' } = {}) {
  const F = ['1111', '1000', '1000', '1110', '1000', '1000', '1000']
  const D = ['11100', '10010', '10001', '10001', '10001', '10010', '11100']
  let cells = ''
  for (let r = 0; r < 7; r++) {
    const row = F[r] + '0' + D[r] // 10 cols: F(4) · gap(1) · D(5)
    for (let c = 0; c < 10; c++) {
      const on = row[c] === '1'
      cells += `<i style="width:${cell}px;height:${cell}px;border-radius:${Math.round(cell * 0.24)}px;background:${on ? lit : dim}"></i>`
    }
  }
  return `<div style="display:grid;grid-template-columns:repeat(10,${cell}px);gap:${gap}px">${cells}</div>`
}

// ── outro end card — shared by the outro kit + the reel-overlay kit ──
// Vertical (reel, h>w) or landscape. Avatar play · wordmark · streak · handle.
export function outroCard(w, h, { handle = 'flickday.media', cta = 'See the full set →' } = {}) {
  const reel = h > w
  const avPx = reel ? 150 : 132
  const wmW = reel ? 660 : 820
  const pad = reel ? '120px 0 96px' : '64px 0 56px'
  const handleClean = handle.replace('@', '')
  return `${ground()}
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:${pad}">
      <div class="tile round" style="width:${avPx}px;height:${avPx}px;display:flex;align-items:center;justify-content:center">
        ${playIcon(Math.round(avPx * 0.74))}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center">
        ${wordmark(wmW, { color: YELLOW })}
        <div style="display:flex;align-items:center;gap:16px;margin-top:${reel ? 18 : 14}px">
          <span style="width:${reel ? 150 : 130}px;height:2px;background:#3f3a1a"></span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:${reel ? 26 : 22}px;letter-spacing:0.5em;text-transform:uppercase;color:${YELLOW};padding-left:0.5em">Media</span>
          <span style="width:${reel ? 150 : 130}px;height:2px;background:#3f3a1a"></span>
        </div>
        <span style="font-family:'JetBrains Mono',monospace;font-weight:500;font-size:${reel ? 20 : 17}px;letter-spacing:0.34em;text-transform:uppercase;color:#9ca3af;margin-top:14px">Every day&rsquo;s a Flickday</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:${reel ? 54 : 40}px">
        <div>${gridFD({ cell: reel ? 30 : 26, gap: 9 })}</div>
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
  .stk{display:grid;grid-auto-flow:column}
  .stk i{display:block;border-radius:5px}
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
