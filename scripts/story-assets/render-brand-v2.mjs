/**
 * Flickday Media — canonical site marks in v2 (replaces the live aperture kit).
 *
 *   node scripts/story-assets/render-brand-v2.mjs
 *
 * Writes directly into flickday-assets/, overwriting the files index.html consumes:
 *   lockup-flickday-media-v2b.png  1200×675  og:image / share card (opaque)
 *   lockup-header.png              1100×280  site header logo (transparent)
 *   icon-favicon.png                512×512  favicon — solid F tile (opaque, square)
 *   icon-footer.png                 550×550  footer mark — chronophoto F (transparent)
 *
 * Rendered at 2× for crisp retina assets.
 */
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { YELLOW, page, ground, wordmark, playIcon, streak, renderJobs } from './_brand-v2.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets')

// ── og:image / share card — 1200×675 opaque ──
function ogCard() {
  const body = `${ground()}
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      ${wordmark(720, { color: YELLOW })}
      <div style="display:flex;align-items:center;gap:18px;width:620px;margin-top:30px">
        <span style="flex:1;height:1px;background:#374151"></span>
        <span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:24px;
          letter-spacing:0.5em;text-transform:uppercase;color:${YELLOW};padding-left:0.5em">Media</span>
        <span style="flex:1;height:1px;background:#374151"></span>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-weight:500;font-size:22px;letter-spacing:0.36em;
        text-transform:uppercase;color:#a3a3a3;margin-top:18px">Every day&rsquo;s a Flickday</div>
    </div>
    <div style="position:absolute;left:50%;bottom:46px;transform:translateX(-50%);opacity:0.85">
      ${streak(3, 22, { cell: 14, gap: 5 })}
    </div>`
  return page(body, { w: 1200, h: 675 })
}

// ── site header logo — 1100×280 transparent ──
function headerLockup() {
  const body = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:34px">
      ${wordmark(540, { color: YELLOW })}
      <span style="width:2px;height:150px;background:#374151"></span>
      <span style="display:flex;flex-direction:column;gap:12px;font-family:'JetBrains Mono',monospace">
        <span style="font-weight:700;font-size:36px;letter-spacing:0.4em;text-transform:uppercase;color:${YELLOW}">Media</span>
        <span style="font-weight:500;font-size:20px;letter-spacing:0.26em;text-transform:uppercase;color:#9ca3af">Every day&rsquo;s a Flickday</span>
      </span>
    </div>`
  return page(body, { w: 1100, h: 280, alpha: true })
}

// ── favicon — 512×512 opaque FD·play tile ──
function favicon() {
  const body = `<div class="tile" style="position:absolute;inset:0;border-radius:112px;display:flex;align-items:center;justify-content:center">
      ${playIcon(340)}
    </div>`
  return page(body, { w: 512, h: 512 })
}

// ── footer mark — 550×550 transparent FD·play ──
function footerMark() {
  const body = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
      ${playIcon(420)}
    </div>`
  return page(body, { w: 550, h: 550, alpha: true })
}

// ── avatar circle — 512×512 (transparent corners), FD·play on dark disc ──
function socialCircle() {
  const body = `<div class="tile round" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
      ${playIcon(320)}
    </div>`
  return page(body, { w: 512, h: 512, alpha: true })
}

// ── slogan lockup — 1200×675 opaque ──
function sloganPro() {
  const body = `${ground()}
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">
      ${wordmark(560, { color: YELLOW })}
      <div style="font-family:'Bebas Neue',sans-serif;font-size:150px;line-height:0.82;letter-spacing:0.02em;
        color:${YELLOW};text-align:center;text-shadow:0 0 70px rgba(250,204,21,0.35)">EVERY DAY&rsquo;S<br>A FLICKDAY</div>
    </div>
    <div style="position:absolute;left:50%;bottom:44px;transform:translateX(-50%);
      font-family:'JetBrains Mono',monospace;font-weight:600;font-size:20px;letter-spacing:0.34em;
      text-transform:uppercase;color:#9ca3af"><span style="color:${YELLOW}">@</span>flickday.media</div>`
  return page(body, { w: 1200, h: 675 })
}

const jobs = [
  { name: 'lockup-flickday-media-v2b', w: 1200, h: 675, alpha: false, html: ogCard(), scale: 2 },
  { name: 'lockup-header', w: 1100, h: 280, alpha: true, html: headerLockup(), scale: 2 },
  { name: 'icon-favicon', w: 512, h: 512, alpha: false, html: favicon(), scale: 2 },
  { name: 'icon-footer', w: 550, h: 550, alpha: true, html: footerMark(), scale: 2 },
  { name: 'icon-social-circle', w: 512, h: 512, alpha: true, html: socialCircle(), scale: 2 },
  { name: 'lockup-slogan-pro', w: 1200, h: 675, alpha: false, html: sloganPro(), scale: 2 },
]

console.log(`Rendering ${jobs.length} canonical site marks (v2)...\n`)
await renderJobs(jobs, outDir)
console.log('\nDone →', outDir)
