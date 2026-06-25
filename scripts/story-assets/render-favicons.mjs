/**
 * Flickday Media — full favicon / app-icon set.
 *
 *   node scripts/story-assets/render-favicons.mjs
 *
 * Renders one master (play icon on the dark brand tile, full-bleed square so iOS/
 * Android apply their own rounding/mask), then derives the standard set + manifest:
 *   favicon.ico (16/32/48) · favicon-16/32 · apple-touch-icon (180) ·
 *   android-chrome-192/512 · site.webmanifest
 *
 * Output: flickday-assets/favicon/   (then wire the <link> tags in index.html)
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { page, playIcon, renderJobs } from './_brand-v2.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const outDir = join(ROOT, 'flickday-assets', 'favicon')
mkdirSync(outDir, { recursive: true })

// master: full-square dark tile (no rounded corners) + centered play
const master = page(
  `<div class="tile" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">${playIcon(340)}</div>`,
  { w: 512, h: 512 }
)
await renderJobs([{ name: 'favicon-master', w: 512, h: 512, alpha: false, html: master, scale: 2 }], outDir)

const m = join(outDir, 'favicon-master.png')
const mg = (args) => execFileSync('magick', args, { stdio: 'pipe' })
mg([m, '-resize', '512x512', join(outDir, 'android-chrome-512x512.png')])
mg([m, '-resize', '192x192', join(outDir, 'android-chrome-192x192.png')])
mg([m, '-resize', '180x180', join(outDir, 'apple-touch-icon.png')])
mg([m, '-resize', '32x32', join(outDir, 'favicon-32x32.png')])
mg([m, '-resize', '16x16', join(outDir, 'favicon-16x16.png')])
mg([m, '-define', 'icon:auto-resize=48,32,16', join(outDir, 'favicon.ico')])

writeFileSync(
  join(outDir, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Flickday Media',
      short_name: 'Flickday',
      icons: [
        { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
      theme_color: '#0a0a0a',
      background_color: '#0a0a0a',
      display: 'standalone',
    },
    null,
    2
  )
)
rmSync(m) // drop the intermediate master
console.log('\nFavicon set →', outDir)
