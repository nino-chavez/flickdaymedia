/**
 * Both wordmarks (play-in-d + reel-in-d) set in each candidate font, so we can
 * pick the typeface off the finished mark rather than bare type. Clean flat
 * vector icons nested in the 'd' counter (measured per-glyph, not eyeballed).
 *
 *   node scripts/wordmark-preview.mjs   →  flickday-assets/wordmarks/_wordmark-fonts.png
 */
import { createRequire } from 'node:module'
import { writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
const require = createRequire('/Users/nino/Workspace/dev/apps/letspepper/package.json')
const { chromium } = require('playwright')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'flickday-assets', 'wordmarks')

// flat-terminal geometric candidates (rounded faces excluded — trace has flat ends)
const FONTS = [['Poppins', 800], ['Montserrat', 800], ['Plus Jakarta Sans', 800],
  ['Sora', 800], ['Figtree', 900], ['Manrope', 800]]
const fam = FONTS.map(([f, w]) => `family=${f.replace(/ /g, '+')}:wght@${w}`).join('&')

const block = ([f, w]) => `
  <div class="fb">
    <div class="lbl">${f} ${w}</div>
    <div class="marks">
      <div class="mark" data-icon="play" style="font-family:'${f}';font-weight:${w}">flick<span class="d">d</span><span class="bl"></span>ay</div>
      <div class="mark" data-icon="reel" style="font-family:'${f}';font-weight:${w}">flick<span class="d">d</span><span class="bl"></span>ay</div>
    </div>
  </div>`

const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fam}&family=JetBrains+Mono:wght@600&display=swap">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0f0f12;padding:52px 60px;font-family:system-ui}
    h1{color:#facc15;font-size:25px;margin-bottom:4px}
    .sub{color:#7a7a7a;font-size:14px;margin-bottom:8px}
    .fb{padding:26px 0;border-bottom:1px solid #212127}
    .lbl{color:#8a8a8a;font-size:14px;font-family:'JetBrains Mono',monospace;margin-bottom:14px}
    .marks{display:flex;gap:90px;flex-wrap:wrap}
    .mark{position:relative;color:#facc15;font-size:118px;line-height:1;letter-spacing:-.01em;color:#facc15}
    .d{position:relative}
    .bl{display:inline-block;width:0;height:0;vertical-align:baseline}
  </style></head>
  <body>
    <h1>flickday — finished marks per font</h1>
    <div class="sub">Left = play-in-d · Right = reel-in-d. Same clean icons, so you're judging the letterforms.</div>
    ${FONTS.map(block).join('')}
    <script>
    function icon(type, s){
      const c = s/2, y = '#facc15', bg = '#0f0f12'
      if(type==='play'){
        const p = [[0.26,0.14],[0.26,0.86],[0.84,0.5]].map(([a,b])=>(a*s).toFixed(1)+','+(b*s).toFixed(1)).join(' ')
        return '<polygon points="'+p+'" fill="'+y+'"/>'
      }
      // film reel: yellow plate, punched holes + center
      let g = '<circle cx="'+c+'" cy="'+c+'" r="'+(0.47*s)+'" fill="'+y+'"/>'
      for(let i=0;i<6;i++){const a=Math.PI/6 + i*Math.PI/3; const hx=c+Math.cos(a)*0.30*s, hy=c+Math.sin(a)*0.30*s; g+='<circle cx="'+hx.toFixed(1)+'" cy="'+hy.toFixed(1)+'" r="'+(0.088*s)+'" fill="'+bg+'"/>'}
      g += '<circle cx="'+c+'" cy="'+c+'" r="'+(0.135*s)+'" fill="'+bg+'"/>'
      g += '<circle cx="'+c+'" cy="'+c+'" r="'+(0.055*s)+'" fill="'+y+'"/>'
      return g
    }
    const EM = 118
    document.querySelectorAll('.mark').forEach(m=>{
      const d = m.querySelector('.d'), bl = m.querySelector('.bl')
      const dr = d.getBoundingClientRect(), mr = m.getBoundingClientRect()
      const baseY = bl.getBoundingClientRect().top - mr.top   // true baseline
      // bowl of the 'd': left of the stem, centered in the x-height band
      const s = 0.27*EM
      const cx = dr.left - mr.left + dr.width*0.47
      const cy = baseY - 0.26*EM
      const ns='http://www.w3.org/2000/svg'
      const svg=document.createElementNS(ns,'svg')
      svg.setAttribute('width',s); svg.setAttribute('height',s)
      svg.setAttribute('viewBox','0 0 '+s+' '+s)
      svg.style.cssText='position:absolute;left:'+(cx-s/2)+'px;top:'+(cy-s/2)+'px'
      svg.innerHTML=icon(m.dataset.icon, s)
      m.appendChild(svg)
    })
    </script>
  </body></html>`

const W = 1600
const tmp = join(OUT, '_wmfonts.html'); writeFileSync(tmp, html)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2 })
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle', timeout: 25000 })
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500)
const full = await page.evaluate(() => document.body.scrollHeight)
await page.setViewportSize({ width: W, height: full })
await page.screenshot({ path: join(OUT, '_wordmark-fonts.png') })
await browser.close(); rmSync(tmp)
console.log('✓ _wordmark-fonts.png', `${W}x${full}`)
