import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(
  projectRoot,
  'flickday-assets/concepts/2026-07-modular-wordmark/round-1/_outlined-base-avenir.svg',
)
const outDir = join(projectRoot, 'flickday-assets/brand/modular-wordmarks')

const colors = {
  warmWhite: '#F7F4ED',
  cinemaGold: '#FFC719',
  nearBlack: '#111318',
}

mkdirSync(outDir, { recursive: true })

const raw = readFileSync(sourcePath, 'utf8')

function baseSvg(baseColor) {
  return raw
    .replace(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="844" height="274" viewBox="0 0 844 274">',
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="869" height="234" viewBox="-12 28 869 234" role="img" aria-label="Flickday" shape-rendering="geometricPrecision">',
    )
    .replace(
      '<g fill="rgb(98.039216%, 80%, 8.235294%)" fill-opacity="1">',
      `<g id="wordmark" fill="${baseColor}" fill-opacity="1">`,
    )
    .replace('<defs>', '<title>Flickday</title>\n<defs>')
}

function addDefs(svg, defs) {
  return svg.replace('</defs>', `${defs}\n</defs>`)
}

function addOverlay(svg, overlay) {
  return svg.replace('</svg>', `${overlay}\n</svg>`)
}

function maskWordmark(svg, maskId) {
  return svg.replace('id="wordmark"', `id="wordmark" mask="url(#${maskId})"`)
}

function accentGlyph(svg, glyph, x, color) {
  return svg.replace(
    `<use xlink:href="#glyph-0-${glyph}" x="${x}" y="200"/>`,
    `<use xlink:href="#glyph-0-${glyph}" x="${x}" y="200" fill="${color}"/>`,
  )
}

function shutterSvg(baseColor, accentColor) {
  const cx = 186
  const cy = 64
  const cuts = Array.from({ length: 6 }, (_, index) => {
    const rotation = index * 60
    return `<path d="M ${cx} ${cy - 23.5} L ${cx + 13} ${cy - 8}" transform="rotate(${rotation} ${cx} ${cy})"/>`
  }).join('')

  const defs = `
<mask id="remove-i-dot" maskUnits="userSpaceOnUse" x="-12" y="28" width="869" height="234">
  <rect x="-12" y="28" width="869" height="234" fill="white"/>
  <circle cx="${cx}" cy="${cy}" r="27" fill="black"/>
</mask>
<mask id="aperture-cut" maskUnits="userSpaceOnUse" x="155" y="33" width="62" height="62">
  <rect x="155" y="33" width="62" height="62" fill="black"/>
  <circle cx="${cx}" cy="${cy}" r="23.5" fill="white"/>
  <g fill="none" stroke="black" stroke-width="2.6" stroke-linecap="round">${cuts}</g>
  <path d="M 193 64 L 189.5 70.1 L 182.5 70.1 L 179 64 L 182.5 57.9 L 189.5 57.9 Z" fill="black"/>
</mask>`

  return addOverlay(
    maskWordmark(addDefs(baseSvg(baseColor), defs), 'remove-i-dot'),
    `<circle id="shutter-dot" cx="${cx}" cy="${cy}" r="23.5" fill="${accentColor}" mask="url(#aperture-cut)"/>`,
  )
}

function playSvg(baseColor, accentColor) {
  const svg = accentGlyph(baseSvg(baseColor), 4, 459, accentColor)
  return addOverlay(
    svg,
    '<path id="play-glyph" d="M 518.5 136.5 L 518.5 157.5 L 536 147 Z" fill="' + accentColor + '"/>',
  )
}

const variants = [
  { id: 'core', build: (baseColor) => baseSvg(baseColor) },
  { id: 'shutter-i', build: shutterSvg },
  { id: 'play-d', build: playSvg },
]

const colorways = [
  { id: 'color', base: colors.warmWhite, accent: colors.cinemaGold },
  { id: 'white', base: '#FFFFFF', accent: '#FFFFFF' },
  { id: 'black', base: colors.nearBlack, accent: colors.nearBlack },
]

for (const variant of variants) {
  for (const colorway of colorways) {
    const name = `flickday-${variant.id}-${colorway.id}`
    const svgPath = join(outDir, `${name}.svg`)
    const pngPath = join(outDir, `${name}-3200w.png`)
    const svg = variant.build(colorway.base, colorway.accent)

    writeFileSync(svgPath, svg)
    execFileSync('rsvg-convert', ['--width', '3200', '--keep-aspect-ratio', '--output', pngPath, svgPath])
    console.log(`wrote ${name}.svg + ${name}-3200w.png`)
  }
}

const readme = `# Flickday modular wordmarks

Production vector and transparent PNG exports for the approved single-cue system.

## Recommended use

- **play-d / color** — primary video-production and reel mark.
- **shutter-i / color** — photography and event-coverage alternate.
- **core / white or black** — small watermark, legal line, sponsor grid, and maximum-legibility fallback.

## Colorways

- **color** — warm white \`${colors.warmWhite}\` with cinema gold \`${colors.cinemaGold}\`; use over dark footage.
- **white** — single-color white for overlays and knockout use.
- **black** — single-color near-black \`${colors.nearBlack}\`; use over light footage.

## Formats

- SVG files are outlined vector masters with no font dependency and transparent canvases.
- PNG files are transparent, 3200 pixels wide, and intended for CapCut, social exports, and presentations.

## CapCut starting points

- Persistent watermark: 9–13% of frame width, 55–75% opacity, 4–6% inset from the nearest edges.
- Opening stamp: 22–32% of frame width, 90–100% opacity, 6–10 frames of fade or scale-in.
- End card: prefer the color play-d mark on a solid \`${colors.nearBlack}\` field.
- Add shadows or outlines in the edit only when the footage requires them; keep the source masters clean.
`

writeFileSync(join(outDir, 'README.md'), readme)
console.log(`wrote ${join(outDir, 'README.md')}`)
