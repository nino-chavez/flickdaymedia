/**
 * Stack one or more potrace SVG layers into a single 2-colour SVG.
 * Usage: node _combine.mjs <out.svg> <W> <H> <layer.svg> <color> [<layer.svg> <color> ...]
 * Layers paint bottom-to-top in argument order (first = behind).
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [out, W, H, ...rest] = process.argv.slice(2)
let layers = ''
for (let i = 0; i < rest.length; i += 2) {
  const svg = readFileSync(rest[i], 'utf8')
  const g = svg.match(/<g transform=[\s\S]*?<\/g>/)[0].replace(/fill="#[0-9a-fA-F]+"/, `fill="${rest[i + 1]}"`)
  layers += g + '\n'
}
writeFileSync(out, `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${layers}</svg>`)
