/**
 * Flickday Media — atomized component library.
 *
 *   node scripts/story-assets/render-components.mjs
 *
 * Every brand element as an INDIVIDUAL, transparent, flat asset — so you can
 * combine them however you want in Figma / Photoshop / Illustrator. Nothing here
 * is pre-composed; these are the atoms.
 *
 * Output: flickday-assets/components/
 *   • vectors (icons + graphic elements): .svg  AND  .png (2×, transparent)
 *   • type (wordmark, K, MEDIA, slogan, handle, url): .png (2×, transparent)
 *
 * Two colorways per asset:
 *   -on-dark   → light-colored mark (yellow/white/warm) for dark backgrounds/garments
 *   -on-light  → dark-colored mark (ink + warm accents) for light backgrounds/garments
 *
 * Flat + hard-edged (no glow/shadow) so they composite cleanly and print (DTF) clean.
 * Offline-safe (embedded fonts).
 */
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { FONTS, YELLOW, AMBER, ORANGE, EMBER, wordmark, wordmarkTwo, wordmarkReel, playIcon } from './_brand-v2.mjs'

const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'components')
mkdirSync(outDir, { recursive: true })

const INK = '#16110f'
const DARK = { main: YELLOW, e1: ORANGE, e2: EMBER, text: '#ffffff', accent: YELLOW, cut: '#0a0a0a', off: '#2b2d33', lit: [YELLOW, AMBER, ORANGE], muted: '#a3a3a3', line: '#374151' }
const LIGHT = { main: INK, e1: ORANGE, e2: EMBER, text: INK, accent: ORANGE, cut: '#f5f5f0', off: '#dcdcd5', lit: [ORANGE, AMBER, EMBER], muted: '#6b6b66', line: '#c9c9c0' }

// ── graphic elements (color-fixed, single version) ──
const ELEMENTS = {
  'kick-streak': () => `<g transform="rotate(-32 60 60)">${[{ y: 36, w: 64, f: YELLOW }, { y: 52, w: 50, f: AMBER }, { y: 68, w: 38, f: ORANGE }, { y: 84, w: 26, f: EMBER }].map((b) => `<rect x="28" y="${b.y}" width="${b.w}" height="10" rx="5" fill="${b.f}"/>`).join('')}</g>`,
  'accent-bar': () => `<defs><linearGradient id="ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${YELLOW}"/><stop offset="1" stop-color="${ORANGE}"/></linearGradient></defs><rect x="50" y="8" width="20" height="104" rx="10" fill="url(#ab)"/>`,
  'chip': () => `<rect x="8" y="8" width="104" height="104" rx="26" fill="${YELLOW}"/>`,
  'streak-strip': () => {
    let s = ''
    const ROWS = 3, COLS = 12
    for (let col = 0; col < COLS; col++) for (let r = 0; r < ROWS; r++) {
      const on = (col * 7 + r * 3) % 17 !== 0 && col < COLS - 1
      const t = (col * 13 + r * 29) % 100
      const fill = !on ? '#2b2d33' : t < 25 ? ORANGE : t < 60 ? AMBER : YELLOW
      s += `<rect x="${6 + col * 18}" y="${6 + r * 18}" width="13" height="13" rx="3.5" fill="${fill}"/>`
    }
    return s
  },
  // dark container backgrounds — drop any glyph on top
  'tile': () => `<defs><radialGradient id="tg" cx="38%" cy="30%" r="92%"><stop offset="0" stop-color="#1a180f"/><stop offset="0.6" stop-color="#0a0a0a"/><stop offset="1" stop-color="#050505"/></radialGradient></defs><rect x="0" y="0" width="120" height="120" rx="27" fill="url(#tg)"/>`,
  'disc': () => `<defs><radialGradient id="dg" cx="38%" cy="30%" r="92%"><stop offset="0" stop-color="#1a180f"/><stop offset="0.6" stop-color="#0a0a0a"/><stop offset="1" stop-color="#050505"/></radialGradient></defs><circle cx="60" cy="60" r="60" fill="url(#dg)"/>`,
  'rule': () => `<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${YELLOW}"/><stop offset="1" stop-color="${ORANGE}"/></linearGradient></defs><rect x="6" y="7" width="108" height="10" rx="5" fill="url(#rg)"/>`,
}

const svgFile = (inner, vb = '0 0 120 120') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`

// FD scoreboard (LED grid spelling FD) — SVG rects, colorway-aware
const fdScoreInner = (lit, dim) => {
  const F = ['1111', '1000', '1000', '1110', '1000', '1000', '1000']
  const D = ['11100', '10010', '10001', '10001', '10001', '10010', '11100']
  const cell = 10, gap = 3
  let s = ''
  for (let r = 0; r < 7; r++) {
    const row = F[r] + '0' + D[r]
    for (let c = 0; c < 10; c++) {
      s += `<rect x="${c * (cell + gap)}" y="${r * (cell + gap)}" width="${cell}" height="${cell}" rx="2.4" fill="${row[c] === '1' ? lit : dim}"/>`
    }
  }
  return s
}

// ── type atoms (HTML) ──
const mono = (t, fs, color, ls = '0.3em', weight = 700) => `<span style="font-family:'JetBrains Mono',monospace;font-weight:${weight};font-size:${fs}px;letter-spacing:${ls};text-transform:uppercase;color:${color};white-space:nowrap">${t}</span>`
const bebas = (t, fs, color) => `<span style="font-family:'Bebas Neue',sans-serif;font-size:${fs}px;line-height:0.82;letter-spacing:0.02em;color:${color};white-space:nowrap">${t}</span>`
const handle = (fs, { text, at }) => `<span style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:${fs}px;letter-spacing:0.01em;color:${text};white-space:nowrap"><span style="color:${at}">@</span>flickday.media</span>`

const TYPE = {
  'wordmark': (c) => wordmark(700, { color: c.text }),
  'wordmark-twotone': (c) => wordmarkTwo(700, { letters: c.text, accent: c.accent }),
  'wordmark-reel': (c) => wordmarkReel(700, { color: c.accent }),
  'media': (c) => mono('Media', 90, c.accent, '0.5em'),
  'slogan': (c) => bebas("Every Day&rsquo;s a Flickday", 150, c.accent),
  'handle': (c) => handle(70, { text: c.text, at: c.accent }),
  'url': (c) => mono('flickdaymedia.com', 64, c.text, '0.12em', 700),
  'cta': (c) => mono('See the full set &rarr;', 44, c.accent, '0.34em', 600),
  'shot-by': (c) => mono('Shot by Flickday Media', 40, c.accent, '0.22em', 500),
}

// ── clean ASSEMBLED lockups (no board chrome — ready to drop in) ──
const hRule = (c, w) => `<span style="width:${w}px;height:2px;background:${c.line};display:inline-block"></span>`
const LOCKUPS = {
  // wordmark · MEDIA (rule) · tagline, stacked + centered — the full brand lockup
  'lockup-primary': (c) => `<div style="display:flex;flex-direction:column;align-items:center">
      ${wordmark(540, { color: c.text })}
      <div style="display:flex;align-items:center;gap:16px;margin-top:22px">
        ${hRule(c, 150)}<span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:24px;letter-spacing:0.5em;text-transform:uppercase;color:${c.accent};padding-left:0.5em">Media</span>${hRule(c, 150)}
      </div>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:500;font-size:18px;letter-spacing:0.34em;text-transform:uppercase;color:${c.muted};margin-top:14px">Every day&rsquo;s a Flickday</span>
    </div>`,
  // wordmark | MEDIA / tagline — horizontal (header style)
  'lockup-horizontal': (c) => `<div style="display:flex;align-items:center;gap:30px">
      ${wordmark(430, { color: c.text })}
      <span style="width:2px;height:120px;background:${c.line}"></span>
      <span style="display:flex;flex-direction:column;gap:10px">
        ${mono('Media', 32, c.accent, '0.4em')}
        ${mono("Every day&rsquo;s a Flickday", 16, c.muted, '0.26em', 500)}
      </span>
    </div>`,
  // wordmark over MEDIA — compact stacked
  'lockup-stacked': (c) => `<div style="display:flex;flex-direction:column;align-items:center;gap:14px">
      ${wordmark(500, { color: c.text })}
      ${mono('Media', 26, c.accent, '0.55em')}
    </div>`,
  // wordmark + MEDIA inline (no tagline)
  'lockup-wordmark-media': (c) => `<div style="display:flex;align-items:center;gap:22px">
      ${wordmark(440, { color: c.text })}${mono('Media', 26, c.accent, '0.4em')}
    </div>`,
  // two-tone: letters + accent 'd' (circle play), accent rule, accent MEDIA caps
  'lockup-twotone': (c) => `<div style="display:flex;flex-direction:column;align-items:center">
      ${wordmarkTwo(540, { letters: c.text, accent: c.accent })}
      <div style="width:470px;height:3px;background:${c.accent};margin-top:18px"></div>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:34px;letter-spacing:0.62em;text-transform:uppercase;color:${c.accent};margin-top:16px;padding-left:0.62em">Media</span>
    </div>`,
  // film-reel: accent wordmark (reel in the 'd'), text-color rule + MEDIA (cinema)
  'lockup-reel': (c) => `<div style="display:flex;flex-direction:column;align-items:center">
      ${wordmarkReel(540, { color: c.accent })}
      <div style="width:470px;height:3px;background:${c.text};margin-top:18px"></div>
      <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:34px;letter-spacing:0.62em;text-transform:uppercase;color:${c.text};margin-top:16px;padding-left:0.62em">Media</span>
    </div>`,
}

// ── assemble job list ──
const jobs = []
// the brand play icon (traced vector) — svg + png, both colorways
for (const [cwName, color] of [['on-dark', YELLOW], ['on-light', INK]]) {
  writeFileSync(join(outDir, `icon-play-${cwName}.svg`), playIcon(1024, { color }))
  jobs.push({ name: `icon-play-${cwName}`, kind: 'svg', svg: playIcon(1024, { color }) })
}
// FD scoreboard element — svg + png, both colorways
for (const [cwName, lit, dim] of [['on-dark', YELLOW, '#23252b'], ['on-light', INK, '#dcdcd5']]) {
  const inner = fdScoreInner(lit, dim)
  writeFileSync(join(outDir, `element-fd-scoreboard-${cwName}.svg`), svgFile(inner, '0 0 127 88'))
  jobs.push({ name: `element-fd-scoreboard-${cwName}`, kind: 'svg', svg: `<svg viewBox="0 0 127 88" width="760" style="display:block">${inner}</svg>` })
}
// graphic elements: svg + png (single colorway)
for (const [name, fn] of Object.entries(ELEMENTS)) {
  const vb = name === 'streak-strip' ? '0 0 222 60' : name === 'rule' ? '0 0 120 24' : '0 0 120 120'
  const w = name === 'streak-strip' ? 1480 : name === 'accent-bar' ? 240 : 1024
  const h = name === 'streak-strip' ? 400 : name === 'rule' ? 205 : 1024
  writeFileSync(join(outDir, `element-${name}.svg`), svgFile(fn(), vb))
  jobs.push({ name: `element-${name}`, kind: 'svg', svg: `<svg viewBox="${vb}" width="${w}" height="${h}" style="display:block">${fn()}</svg>` })
}
// type: png only (both colorways)
for (const [name, fn] of Object.entries(TYPE)) {
  for (const [cwName, cw] of [['on-dark', DARK], ['on-light', LIGHT]]) {
    jobs.push({ name: `type-${name}-${cwName}`, kind: 'type', html: fn(cw) })
  }
}
// assembled lockups: png (both colorways)
for (const [name, fn] of Object.entries(LOCKUPS)) {
  for (const [cwName, cw] of [['on-dark', DARK], ['on-light', LIGHT]]) {
    jobs.push({ name: `${name}-${cwName}`, kind: 'type', html: fn(cw) })
  }
}

// ── render PNGs (tight transparent crop via element screenshot) ──
const doc = (body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
  *{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent}
  body{display:inline-block;font-family:'Inter',sans-serif}.pad{display:inline-block;padding:24px}</style></head><body><div class="pad">${body}</div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2 })
let n = 0
for (const job of jobs) {
  const html = doc(job.kind === 'type' ? job.html : job.svg)
  const tmp = join(outDir, `_tmp.html`)
  writeFileSync(tmp, html)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]))
  await page.waitForTimeout(80)
  const el = await page.$('.pad')
  await el.screenshot({ path: join(outDir, `${job.name}.png`), omitBackground: true })
  rmSync(tmp)
  n++
}
await browser.close()

// drop obsolete atoms from earlier directions (FD monogram, kinetic K, Bebas
// nameplate, and the geometric alternate icons — identity is now locked to play)
const obsolete = ['icon-fd-play', 'type-kinetic-k', 'type-flickday-plain',
  'icon-strobe-play', 'icon-flipbook', 'icon-streak-grid', 'icon-frame-play',
  'icon-flick-comet', 'icon-strobe-chevron', 'icon-play-triangle']
for (const base of obsolete) {
  for (const cw of ['-on-dark', '-on-light']) {
    for (const ext of ['.png', '.svg']) rmSync(join(outDir, base + cw + ext), { force: true })
  }
}
console.log(`Rendered ${n} PNGs + SVGs → ${outDir}`)
