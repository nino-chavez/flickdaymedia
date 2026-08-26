import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'flickday-assets', 'concepts', '2026-07-modular-wordmark', 'round-1')
const input = join(outDir, '_outlined-base-avenir.svg')
const ink = '#facc15'
const baseInk = '#f5f5f1'
mkdirSync(outDir, { recursive: true })

execFileSync('pango-view', [
  '--no-display', '--font=Avenir Next Heavy 200', '--foreground=#facc15',
  '--background=transparent', '--margin=0', '--text=flickday', `--output=${input}`,
])

const source = readFileSync(input, 'utf8')
  .replace('width="844" height="274" viewBox="0 0 844 274"', 'width="885" height="290" viewBox="-20 0 885 290"')
  .replace('fill="rgb(98.039216%, 80%, 8.235294%)" fill-opacity="1"', `id="wordmark" fill="${baseInk}"`)

const fullMask = '<rect x="-20" y="0" width="885" height="290" fill="white"/>'

function withDefs(svg, defs) {
  return svg.replace('</defs>', `${defs}\n</defs>`)
}

function maskWordmark(svg, id) {
  return svg.replace('id="wordmark"', `id="wordmark" mask="url(#${id})"`)
}

function withOverlay(svg, overlay) {
  return svg.replace('</svg>', `${overlay}\n</svg>`)
}

const shutterCuts = Array.from({ length: 6 }, (_, i) =>
  `<path d="M 186 64 L 177 42 L 183 39 L 193 59 Z" transform="rotate(${i * 60} 186 64)"/>`
).join('')
const shutterDefs = `
<mask id="remove-i-dot">${fullMask}<circle cx="186" cy="64" r="29" fill="black"/></mask>
<mask id="shutter-cut"><rect x="-20" y="0" width="885" height="290" fill="black"/><circle cx="186" cy="64" r="25" fill="white"/><g fill="black">${shutterCuts}</g><circle cx="186" cy="64" r="7" fill="black"/></mask>`

const reelDefs = `
<mask id="reel-cut"><rect x="-20" y="0" width="885" height="290" fill="black"/><circle cx="525" cy="147" r="29" fill="white"/><circle cx="525" cy="147" r="3.5" fill="black"/><circle cx="525" cy="132" r="7.5" fill="black"/><circle cx="539" cy="142" r="7.5" fill="black"/><circle cx="534" cy="160" r="7.5" fill="black"/><circle cx="516" cy="160" r="7.5" fill="black"/><circle cx="511" cy="142" r="7.5" fill="black"/></mask>`

const playDefs = `
<mask id="play-cut"><rect x="-20" y="0" width="885" height="290" fill="black"/><circle cx="525" cy="147" r="29" fill="white"/><path d="M 516 130 L 516 164 L 544 147 Z" fill="black"/></mask>`

const ribbonPath = 'M 536 178 C 563 198 592 207 628 208 L 704 208 C 729 208 743 219 747 237 C 751 254 761 263 777 268 L 768 286 C 743 279 728 263 723 243 C 721 233 716 228 704 228 L 628 228 C 586 228 551 217 524 196 Z'
const holes = []
for (let x = 558; x <= 718; x += 16) {
  holes.push(`<rect x="${x}" y="208" width="7" height="3.5" rx="1" fill="black"/>`)
  holes.push(`<rect x="${x}" y="222" width="7" height="3.5" rx="1" fill="black"/>`)
}
holes.push('<rect x="727" y="211" width="6" height="3.5" rx="1" fill="black"/>')
holes.push('<rect x="737" y="218" width="6" height="3.5" rx="1" fill="black"/>')
holes.push('<rect x="742" y="229" width="6" height="3.5" rx="1" fill="black"/>')
holes.push('<rect x="746" y="241" width="6" height="3.5" rx="1" fill="black"/>')
holes.push('<rect x="751" y="253" width="6" height="3.5" rx="1" fill="black"/>')
holes.push('<rect x="761" y="263" width="6" height="3.5" rx="1" fill="black"/>')
const ribbonDefs = `<mask id="ribbon-cut"><rect x="-20" y="0" width="885" height="290" fill="black"/><path d="${ribbonPath}" fill="white"/>${holes.join('')}</mask>`

function accentGlyph(svg, glyph, x) {
  return svg.replace(`<use xlink:href="#glyph-0-${glyph}" x="${x}" y="200"/>`, `<use xlink:href="#glyph-0-${glyph}" x="${x}" y="200" fill="${ink}"/>`)
}

const variants = [
  ['01-core', source],
  [
    '02-shutter-i',
    withOverlay(
      maskWordmark(withDefs(source, shutterDefs), 'remove-i-dot'),
      `<circle cx="186" cy="64" r="25" fill="${ink}" mask="url(#shutter-cut)"/>`
    ),
  ],
  [
    '03-play-d',
    withOverlay(withDefs(accentGlyph(source, 4, 459), playDefs), `<circle cx="525" cy="147" r="29" fill="${ink}" mask="url(#play-cut)"/>`),
  ],
  [
    '04-reel-d',
    withOverlay(withDefs(accentGlyph(source, 4, 459), reelDefs), `<circle cx="525" cy="147" r="29" fill="${ink}" mask="url(#reel-cut)"/>`),
  ],
  [
    '05-filmstrip-y',
    withOverlay(withDefs(accentGlyph(source, 6, 716), ribbonDefs), `<path d="${ribbonPath}" fill="${ink}" mask="url(#ribbon-cut)"/>`),
  ],
  [
    '06-reel-to-y',
    withOverlay(
      withDefs(accentGlyph(accentGlyph(source, 4, 459), 6, 716), `${reelDefs}${ribbonDefs}`),
      `<circle cx="525" cy="147" r="29" fill="${ink}" mask="url(#reel-cut)"/><path d="${ribbonPath}" fill="${ink}" mask="url(#ribbon-cut)"/>`
    ),
  ],
]

for (const [name, svg] of variants) {
  writeFileSync(join(outDir, `${name}-on-dark.svg`), svg)
  writeFileSync(join(outDir, `${name}-on-light.svg`), svg.replaceAll(baseInk, '#111318'))
  console.log(`wrote ${name} on-dark + on-light SVGs`)
}
