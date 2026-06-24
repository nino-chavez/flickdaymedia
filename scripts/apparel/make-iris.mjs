// Parametric 6-blade camera iris — zero-dep. Yellow disk + black pinwheel blades,
// central hexagonal opening. Matches the Flickday volleyball-aperture core.
// Usage: node make-iris.mjs <out.svg> [R] [r] [twist] [gap] [body] [blade]
import { writeFileSync } from 'node:fs'
const [out, R=300, r=118, twist=34, gap=7, body='#facc15', blade='#0a0a0a'] =
  process.argv.slice(2)
const Ro=+R, ri=+r, t=+twist, g=+gap, cx=Ro+10, cy=Ro+10
const P=(rad,deg)=>{const a=deg*Math.PI/180;return `${(cx+rad*Math.cos(a)).toFixed(2)},${(cy+rad*Math.sin(a)).toFixed(2)}`}
let blades=''
for(let i=0;i<6;i++){
  const a1=60*i+g/2, a2=60*i+60-g/2
  blades+=`<polygon points="${P(Ro,a1)} ${P(Ro,a2)} ${P(ri,a2+t)} ${P(ri,a1+t)}" fill="${blade}"/>\n`
}
const S=2*(Ro+10)
writeFileSync(out,`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<circle cx="${cx}" cy="${cy}" r="${Ro}" fill="${body}"/>
${blades}</svg>`)
