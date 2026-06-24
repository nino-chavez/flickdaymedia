/**
 * Flickday Media — reaction stickers for hype frames (CapCut / Reels).
 * Transparent, tightly-cropped PNGs that pop onto a crazy frame — a big block, a
 * bounce, a freeze. Static assets; give them the "pop" with a scale-in keyframe
 * in CapCut (the entrance is animated there, the art is here).
 *
 *   node scripts/story-assets/render-stickers.mjs
 *
 * Output: flickday-assets/stickers/   (alpha, auto-cropped, rendered 2x)
 *
 * Flickday's own language — NO mascot (a media brand rides on top of its clients'
 * brands; a character would fight them). Yellow #facc15 → orange #f97316, ink edge,
 * Anton for impact, the camera/viewfinder motif. Two families:
 *   camera-native (sport-agnostic) — caught-it · look-here · focus · frame-tag
 *   hype word-bursts               — snap · block · ace … (add a word = one line)
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
const outDir = join(ROOT, 'flickday-assets', 'stickers')
mkdirSync(outDir, { recursive: true })

const aperture = pathToFileURL(join(ROOT, 'flickday-assets', 'outro', 'aperture-icon-transparent.png')).href

const YELLOW = '#facc15'
const ORANGE = '#f97316'
const INK = '#0a0a0a'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@500;700;800&display=swap');`

// comic ink outline around a clipped/odd shape, built from stacked drop-shadows
const inkEdge = (px) => Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI / 4) * i
  return `drop-shadow(${(Math.cos(a) * px).toFixed(1)}px ${(Math.sin(a) * px).toFixed(1)}px 0 ${INK})`
}).join(' ')

// star/burst clip-path polygon
function starPolygon(points, outer, inner) {
  const pts = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI / points) * i - Math.PI / 2
    pts.push(`${(50 + 50 * r * Math.cos(a)).toFixed(2)}% ${(50 + 50 * r * Math.sin(a)).toFixed(2)}%`)
  }
  return `polygon(${pts.join(',')})`
}
const STAR = starPolygon(14, 1, 0.66)

const reset = `*{margin:0;padding:0;box-sizing:border-box}
  html,body{background:transparent}
  body{font-family:'Anton',sans-serif;-webkit-font-smoothing:antialiased;display:inline-block}
  .pad{display:inline-block;padding:64px}`

const doc = (css, body) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}${reset}${css}</style></head><body>${body}</body></html>`

/* ── hype word-burst: jagged star + Anton word + optional camera sub ── */
function wordBurst(word, { sub = '', fs = 132, rot = -7 } = {}) {
  const css = `
    .burst{position:relative;width:540px;height:540px;display:flex;align-items:center;justify-content:center}
    .star{position:absolute;inset:0;clip-path:${STAR};background:linear-gradient(135deg,${YELLOW} 8%,${ORANGE});
      transform:rotate(${rot}deg);filter:${inkEdge(5)} drop-shadow(0 16px 26px rgba(0,0,0,0.4))}
    .txt{position:relative;text-align:center;color:${INK};font-size:${fs}px;line-height:0.8;letter-spacing:0.01em;
      text-transform:uppercase;transform:rotate(${rot}deg)}
    .sub{display:block;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:25px;letter-spacing:0.14em;
      color:rgba(10,10,10,0.72);margin-top:14px}`
  const body = `<div class="pad"><div class="burst"><div class="star"></div>
    <div class="txt">${word}${sub ? `<span class="sub">${sub}</span>` : ''}</div></div></div>`
  return doc(css, body)
}

/* ── CAUGHT IT — the signature freeze-frame sticker (camera-native) ── */
function caughtIt() {
  const css = `
    .burst{position:relative;width:560px;height:560px;display:flex;align-items:center;justify-content:center}
    .star{position:absolute;inset:0;clip-path:${STAR};background:linear-gradient(135deg,${YELLOW} 8%,${ORANGE});
      transform:rotate(-5deg);filter:${inkEdge(5)} drop-shadow(0 16px 26px rgba(0,0,0,0.4))}
    .txt{position:relative;text-align:center;transform:rotate(-5deg)}
    .ap{width:74px;height:74px;margin-bottom:6px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))}
    .big{color:${INK};font-size:128px;line-height:0.78;text-transform:uppercase}
    .sub{display:block;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:25px;letter-spacing:0.16em;
      color:rgba(10,10,10,0.72);margin-top:14px}`
  const body = `<div class="pad"><div class="burst"><div class="star"></div>
    <div class="txt"><img class="ap" src="${aperture}"><div class="big">CAUGHT<br>IT</div>
    <span class="sub">f/2.8 · 1/2000s</span></div></div></div>`
  return doc(css, body)
}

/* ── LOOK HERE — yellow ring + arrow to circle the ball / a player (SVG) ── */
function lookHere() {
  const css = `.s{filter:drop-shadow(0 0 16px rgba(250,204,21,0.45)) drop-shadow(0 10px 20px rgba(0,0,0,0.4))}`
  const svg = `<svg class="s" width="480" height="480" viewBox="0 0 480 480" fill="none">
    <circle cx="250" cy="270" r="158" stroke="${INK}" stroke-width="30"/>
    <circle cx="250" cy="270" r="158" stroke="${YELLOW}" stroke-width="16"/>
    <path d="M70 70 Q 150 70 210 138" stroke="${INK}" stroke-width="30" stroke-linecap="round"/>
    <path d="M70 70 Q 150 70 210 138" stroke="${YELLOW}" stroke-width="16" stroke-linecap="round"/>
    <path d="M150 60 L70 70 L96 150" stroke="${INK}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M150 60 L70 70 L96 150" stroke="${YELLOW}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
  return doc(css, `<div class="pad">${svg}</div>`)
}

/* ── FOCUS — AF-lock corner box to bracket a subject (transparent centre) ── */
function focusBox() {
  const sz = 380, c = 84, t = 11
  const css = `
    .fb{position:relative;width:${sz}px;height:${sz}px;filter:drop-shadow(0 0 14px rgba(250,204,21,0.45))}
    .fb .c{position:absolute;width:${c}px;height:${c}px;border:${t}px solid ${YELLOW};
      box-shadow:0 0 0 4px ${INK}, inset 0 0 0 4px ${INK}}
    .tl{top:0;left:0;border-right:0;border-bottom:0}.tr{top:0;right:0;border-left:0;border-bottom:0}
    .bl{bottom:0;left:0;border-right:0;border-top:0}.br{bottom:0;right:0;border-left:0;border-top:0}
    .lab{position:absolute;top:-62px;left:-2px;display:inline-flex;align-items:center;gap:11px;padding:10px 18px;
      background:${INK};box-shadow:0 6px 20px rgba(0,0,0,0.5);
      font-family:'JetBrains Mono',monospace;font-weight:700;font-size:30px;letter-spacing:0.14em;color:${YELLOW}}
    .lab .dot{width:15px;height:15px;border-radius:50%;background:#ef4444;box-shadow:0 0 12px rgba(239,68,68,0.9)}`
  const body = `<div class="pad"><div class="fb">
    <span class="lab"><span class="dot"></span>FOCUS LOCK</span>
    <span class="c tl"></span><span class="c tr"></span><span class="c bl"></span><span class="c br"></span>
  </div></div>`
  return doc(css, body)
}

/* ── FRAME ## — small freeze marker, viewfinder tag ── */
function frameTag(n = '24') {
  const arm = 34, t = 5
  const css = `
    .ft{position:relative;display:inline-flex;align-items:center;gap:13px;padding:20px 30px;
      background:rgba(6,6,6,0.86);box-shadow:0 12px 34px rgba(0,0,0,0.5)}
    .b{position:absolute}.b i{position:absolute;background:${YELLOW};box-shadow:0 0 8px rgba(250,204,21,0.5)}
    .b.tl{top:-2px;left:-2px}.b.tl i.x{top:0;left:0;width:${arm}px;height:${t}px}.b.tl i.y{top:0;left:0;width:${t}px;height:${arm}px}
    .b.br{bottom:-2px;right:-2px}.b.br i.x{bottom:0;right:0;width:${arm}px;height:${t}px}.b.br i.y{bottom:0;right:0;width:${t}px;height:${arm}px}
    .dot{width:15px;height:15px;border-radius:50%;background:#ef4444;box-shadow:0 0 12px rgba(239,68,68,0.9);flex:none}
    .tx{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:42px;letter-spacing:0.12em;color:#f5f5f0}
    .tx b{color:${YELLOW}}`
  const body = `<div class="pad"><div class="ft">
    <div class="b tl"><i class="x"></i><i class="y"></i></div>
    <div class="b br"><i class="x"></i><i class="y"></i></div>
    <span class="dot"></span><span class="tx">FRAME <b>${n}</b></span></div></div>`
  return doc(css, body)
}

/* ─────────────────────────  render queue  ───────────────────────── */
const jobs = [
  // camera-native (sport-agnostic)
  { name: 'sticker-caught-it', html: caughtIt() },
  { name: 'sticker-look-here', html: lookHere() },
  { name: 'sticker-focus-lock', html: focusBox() },
  { name: 'sticker-frame-tag', html: frameTag('24') },
  // hype word-bursts — SNAP is universal; BLOCK/ACE are the volleyball-pack examples.
  { name: 'sticker-snap', html: wordBurst('SNAP!', { sub: 'SHUTTER FREEZE', fs: 150 }) },
  { name: 'sticker-block', html: wordBurst('BLOCK!', { fs: 138, rot: 6 }) },
  { name: 'sticker-ace', html: wordBurst('ACE!', { fs: 168, rot: -6 }) },
]

const browser = await chromium.launch()
console.log(`Rendering ${jobs.length} stickers...\n`)
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 2 })
  const tmp = join(outDir, `_tmp.html`)
  writeFileSync(tmp, job.html)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
  const el = await page.$('.pad')
  await el.screenshot({ path: join(outDir, `${job.name}.png`), omitBackground: true })
  console.log(`✓ ${job.name}.png`)
  await page.close()
  rmSync(tmp)
}
await browser.close()
console.log('\nDone. Stickers in flickday-assets/stickers/')
