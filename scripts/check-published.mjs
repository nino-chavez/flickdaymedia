/**
 * Check what a deployment of the site actually serves, judged by content.
 *
 *   node scripts/check-published.mjs [base-url]     (default https://flickdaymedia.com)
 *
 * Pages answers an unknown path with index.html and a 200, so a status code cannot tell
 * "served" from "not there". This compares bodies instead:
 *   - every file in site/ must come back byte-identical at its URL path,
 *   - the exact favicon, manifest and OG URLs index.html uses, and /gallery and /photos,
 *     must still work,
 *   - every tracked file outside site/ must NOT come back: a 200 whose body is not the
 *     home page counts as exposed.
 * Exits 0 only when every public URL works and nothing private is exposed.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.argv[2] || 'https://flickdaymedia.com').replace(/\/$/, '')
const GALLERY = 'https://ninochavez.co/photography'

const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const file = (p) => readFileSync(join(ROOT, p))
// Encode each segment, so a name with #, ? or non-ASCII maps to its real URL. A wrong URL
// gets the home-page fallback, which would read as "not exposed".
const enc = (p) => p.split('/').map(encodeURIComponent).join('/')

// The zone rewrites HTML per response: email obfuscation with a fresh key, a bot-detection
// script with a per-request token, and sometimes the Web Analytics beacon. Strip those,
// then all whitespace, so two fetches of one page hash alike.
function norm(buf) {
  const s = buf.toString('utf8')
    .replace(/<script data-cfasync="false" src="\/cdn-cgi\/[^"]*email-decode\.min\.js"><\/script>/g, '')
    .replace(/<script>\(function\(\)\{function c\(\)[\s\S]*?<\/script>/g, '')
    .replace(/<script[^<]*cloudflareinsights[^<]*<\/script>/g, '')
    .replace(/<(a|span) [^>]*class="__cf_email__"[^>]*>\[email&#160;protected\]<\/\1>/g, 'EMAIL')
    .replace(/\/cdn-cgi\/l\/email-protection#[0-9a-f]+|mailto:[^"]+|[\w.+-]+@[\w-]+\.[\w.]+/g, 'EMAIL')
  return sha(s.replace(/\s+/g, ''))
}

// One request to an already-encoded URL path, no redirect following unless asked. `follow`
// takes one same-origin 301/308, which is how Pages serves foo.html at /foo and
// dir/index.html at /dir/.
// A dropped connection is retried twice; a third failure throws rather than guessing.
async function get(urlPath, follow = false) {
  let res
  for (let attempt = 1; !res; attempt++) {
    try {
      res = await fetch(BASE + urlPath, {
        redirect: 'manual',
        headers: { 'user-agent': 'flickday-check-published/1' },
      })
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise((r) => setTimeout(r, 250 * attempt))
    }
  }
  const loc = res.headers.get('location') || ''
  if (follow && (res.status === 301 || res.status === 308) && loc.startsWith('/')) {
    await res.arrayBuffer()
    return get(loc)
  }
  return { status: res.status, location: loc, body: Buffer.from(await res.arrayBuffer()) }
}

// Run fn over items, eight requests at a time.
async function pool(items, fn) {
  const out = []
  for (let i = 0; i < items.length; i += 8) out.push(...(await Promise.all(items.slice(i, i + 8).map(fn))))
  return out.filter(Boolean)
}

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const site = tracked.filter((p) => p.startsWith('site/'))
const priv = tracked.filter((p) => !p.startsWith('site/'))
const fails = []

const home = await get('/')
if (home.status !== 200 || norm(home.body) !== norm(file('site/index.html'))) {
  fails.push(`/ -> ${home.status}, body is not site/index.html`)
}
// Cloudflare Pages redirects /index.html to /; Netlify serves it directly. Either is fine.
const idx = await get('/index.html')
const idxRedirects = [301, 308].includes(idx.status) && [`/`, `${BASE}/`].includes(idx.location)
const idxServes = idx.status === 200 && norm(idx.body) === norm(file('site/index.html'))
if (!idxRedirects && !idxServes) fails.push(`/index.html -> ${idx.status} location=${idx.location}`)

const manifest = JSON.parse(file('site/flickday-assets/site/favicon/site.webmanifest'))
const exact = [
  'og-share-card.png',
  'favicon/favicon-32x32.png',
  'favicon/favicon-16x16.png',
  'favicon/apple-touch-icon.png',
  'favicon/site.webmanifest',
].map((p) => [`/flickday-assets/site/${p}?v=2`, `site/flickday-assets/site/${p}`])
  .concat(manifest.icons.map((i) => [i.src, `site${i.src}`]))
const published = site
  .filter((p) => p !== 'site/index.html' && p !== 'site/_redirects')
  .map((p) => [enc(p.slice('site'.length)), p])

fails.push(...(await pool([...published, ...exact], async ([url, p]) => {
  const r = await get(url)
  if (r.status !== 200 || sha(r.body) !== sha(file(p))) return `${url} -> ${r.status}, ${r.body.length}B, expected ${p}`
})))

for (const path of ['/gallery', '/photos']) {
  const r = await get(path)
  if (r.status !== 302 || r.location !== GALLERY) fails.push(`${path} -> ${r.status} location=${r.location}`)
}

const homeHash = norm(home.body)
const exposed = await pool(priv, async (p) => {
  const r = await get(`/${enc(p)}`, true)
  if (r.status === 200 && norm(r.body) !== homeHash) return p
})

console.log(`base: ${BASE}`)
console.log(`public: ${published.length + 1} site files, ${exact.length} exact URLs, 2 redirects; failures: ${fails.length}`)
console.log(`private: ${priv.length} tracked files outside site/; exposed: ${exposed.length}`)
for (const f of fails) console.log(`  FAIL ${f}`)
const byTop = {}
for (const p of exposed) byTop[p.split('/')[0]] = (byTop[p.split('/')[0]] || 0) + 1
for (const [top, n] of Object.entries(byTop).sort()) console.log(`  EXPOSED ${String(n).padStart(4)}  ${top}`)
process.exit(fails.length || exposed.length ? 1 : 0)
