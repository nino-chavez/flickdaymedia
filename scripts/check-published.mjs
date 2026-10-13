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
 *   - every tracked file outside site/ must NOT come back. A 200 counts as exposed when its
 *     body is that file's own bytes or something unrecognized. The home page is the unknown-
 *     path fallback. A body matching any committed index.html is an edge still serving an
 *     earlier deploy's fallback; it is counted on its own line and does not fail the run.
 * A public file that comes back as an earlier commit's copy, or as any committed index.html,
 * passes as stale when a cache-busted request for it returns the right bytes: the deployment
 * is right and an edge is lagging. A failed build leaves the old deployment live, so the
 * cache-busted request is wrong too, and the file fails with a label saying what came back.
 * Exits 0 only when every public URL works and nothing private is exposed.
 */
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://flickdaymedia.com'
const BASE = (process.argv[2] || ORIGIN).replace(/\/$/, '')
const GALLERY = 'https://ninochavez.co/photography'

const sha = (buf) => createHash('sha256').update(buf).digest('hex')
const file = (p) => readFileSync(join(ROOT, p))
const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] })
// Encode each segment, so a name with #, ? or non-ASCII maps to its real URL. A wrong URL
// gets the home-page fallback, which would read as "not exposed".
const enc = (p) => p.split('/').map(encodeURIComponent).join('/')

// The zone rewrites HTML per response: email obfuscation with a fresh key, a bot-detection
// script with a per-request token, and sometimes the Web Analytics beacon. Netlify adds a
// "hosted on Netlify" comment in production and a review-drawer snippet in deploy
// previews. Strip those, then all whitespace, so two fetches of one page hash alike.
function norm(buf) {
  const s = buf.toString('utf8')
    .replace(/<!-- This site is hosted on Netlify\.[\s\S]*?-->/g, '')
    .replace(/<div data-netlify-deploy-id="[^"]*"[\s\S]*?<\/div>/g, '')
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
  return { status: res.status, location: loc, headers: res.headers, body: Buffer.from(await res.arrayBuffer()) }
}

// Every committed version of a file, newest first, as [short sha, bytes]. A commit that
// deleted it is skipped. No cap: an edge can hold a fallback from far back. On 2026-10-12 one
// served index.html as of the 11th-newest commit for a PNG path, and a ten-version window
// failed it as unrecognized.
function history(p) {
  const shas = git('log', '--format=%H', '--', p).toString('utf8').split('\n').filter(Boolean)
  return shas.flatMap((h) => {
    try {
      return [[h.slice(0, 7), git('show', `${h}:${p}`)]]
    } catch {
      return []
    }
  })
}

// Run fn over items, eight requests at a time.
async function pool(items, fn) {
  const out = []
  for (let i = 0; i < items.length; i += 8) out.push(...(await Promise.all(items.slice(i, i + 8).map(fn))))
  return out.filter(Boolean)
}

const tracked = git('ls-files', '-z').toString('utf8').split('\0').filter(Boolean)
const site = tracked.filter((p) => p.startsWith('site/'))
const priv = tracked.filter((p) => !p.startsWith('site/'))
const fails = []

// After a deploy that changes index.html, Pages edges keep answering unknown paths with the
// previous deployment's index.html for a while (cf-cache-status HIT, age climbing, despite
// max-age=0). Every committed version lets the check name that instead of calling it
// exposure. A shallow clone knows fewer, and its stale fallbacks read as unrecognized.
const homes = new Map()
for (const [h, buf] of history('site/index.html')) if (!homes.has(norm(buf))) homes.set(norm(buf), h)

const home = await get('/')
const homeHash = norm(home.body)
if (home.status !== 200 || homeHash !== norm(file('site/index.html'))) {
  fails.push(`/ -> ${home.status}, body is not site/index.html`)
}
// Cloudflare Pages redirects /index.html to /; Netlify serves it directly. Either is fine.
const idx = await get('/index.html')
const idxRedirects = [301, 308].includes(idx.status) && [`/`, `${BASE}/`].includes(idx.location)
const idxServes = idx.status === 200 && norm(idx.body) === norm(file('site/index.html'))
if (!idxRedirects && !idxServes) fails.push(`/index.html -> ${idx.status} location=${idx.location}`)

const manifest = JSON.parse(file('site/flickday-assets/site/favicon/site.webmanifest'))
// Each with the ?v= index.html gives it. Pages ignores the query string, so a stale
// version here would still pass; the declared check below makes it fail instead. Edges key
// their cache on it, though: re-render one of these files and its ?v must go up in the same
// change, or edges keep the old bytes under the old URL (the wordmarks, 2026-10-12).
const head = [
  ['og-share-card.png', 6],
  ['wordmark-yellow.png', 3],
  ['wordmark-white.png', 3],
  ['favicon/favicon-32x32.png', 2],
  ['favicon/favicon-16x16.png', 2],
  ['favicon/apple-touch-icon.png', 2],
  ['favicon/site.webmanifest', 2],
].map(([p, v]) => [`/flickday-assets/site/${p}?v=${v}`, `site/flickday-assets/site/${p}`])
const html = file('site/index.html').toString('utf8')
// og:image is absolute, the icons ./-relative, the wordmarks bare-relative; any form counts.
const declares = (url) => [`".${url}"`, `"${url.slice(1)}"`, `"${ORIGIN}${url}"`].some((s) => html.includes(s))
for (const [url] of head) if (!declares(url)) fails.push(`index.html does not declare ${url}`)
const exact = head.concat(manifest.icons.map((i) => [i.src, `site${i.src}`]))
const published = site
  .filter((p) => p !== 'site/index.html' && p !== 'site/_redirects')
  .map((p) => [enc(p.slice('site'.length)), p])

// What a wrong 200 body for public file p actually is, when the check can tell.
function identify(body, p) {
  const n = norm(body)
  if (n === homeHash) return 'home-page fallback, not in this deploy'
  if (homes.has(n)) return `stale home fallback, index.html as of ${homes.get(n)}`
  const old = history(p).find(([, buf]) => sha(buf) === sha(body))
  return old ? `stale copy of ${old[0]}` : ''
}

// A fresh key per request, so the cache-buster itself never gets a cached copy to go stale.
const stalePublic = []
fails.push(...(await pool([...published, ...exact], async ([url, p]) => {
  const r = await get(url)
  if (r.status === 200 && sha(r.body) === sha(file(p))) return
  let what = r.status === 200 ? identify(r.body, p) : ''
  if (what.startsWith('stale')) {
    const fresh = await get(`${url}${url.includes('?') ? '&' : '?'}cb=${randomUUID()}`)
    if (fresh.status === 200 && sha(fresh.body) === sha(file(p))) return void stalePublic.push(`${url} (${what})`)
    what += '; a cache-busted request is wrong too'
  }
  return `${url} -> ${r.status}, ${r.body.length}B, expected ${p}${what ? ` (${what})` : ''}`
})))

for (const path of ['/gallery', '/photos']) {
  const r = await get(path)
  if (r.status !== 302 || r.location !== GALLERY) fails.push(`${path} -> ${r.status} location=${r.location}`)
}

const ownBytes = (p, body) => {
  try {
    const f = file(p)
    return sha(body) === sha(f) || norm(body) === norm(f)
  } catch {
    return false
  }
}
const seen = await pool(priv, async (p) => {
  const r = await get(`/${enc(p)}`, true)
  if (r.status !== 200) return
  const n = norm(r.body)
  if (n === homeHash) return
  if (ownBytes(p, r.body)) return { p, kind: 'own bytes' }
  if (homes.has(n)) return { p, kind: 'stale', from: homes.get(n) }
  const h = (k) => r.headers.get(k) || '-'
  return { p, kind: 'unrecognized', info: `${r.body.length}B ${h('content-type')}, cf-cache-status ${h('cf-cache-status')}, age ${h('age')}` }
})
const exposed = seen.filter((x) => x.kind !== 'stale')
const stale = seen.filter((x) => x.kind === 'stale')
const unknown = exposed.filter((x) => x.kind === 'unrecognized')

console.log(`base: ${BASE}`)
console.log(`home versions known: ${homes.size}, from every commit to site/index.html`)
console.log(`public: ${published.length + 1} site files, ${exact.length} exact URLs, 2 redirects; failures: ${fails.length}`)
console.log(`private: ${priv.length} tracked files outside site/; exposed: ${exposed.length} (own bytes ${exposed.length - unknown.length}, unrecognized ${unknown.length})`)
console.log(`stale home fallback: ${stale.length}`)
console.log(`stale public: ${stalePublic.length}`)
for (const f of fails) console.log(`  FAIL ${f}`)
for (const x of stalePublic) console.log(`  STALE ${x}`)
const byTop = {}
for (const { p } of exposed) byTop[p.split('/')[0]] = (byTop[p.split('/')[0]] || 0) + 1
for (const [top, n] of Object.entries(byTop).sort()) console.log(`  EXPOSED ${String(n).padStart(4)}  ${top}`)
for (const x of unknown.slice(0, 5)) console.log(`  UNRECOGNIZED /${x.p} -> ${x.info}`)
const lag = []
if (stale.length) lag.push(`the previous deploy's index.html (as of ${[...new Set(stale.map((x) => x.from))].join(', ')}) for ${stale.length} unknown paths`)
if (stalePublic.length) lag.push(`earlier copies of ${stalePublic.length} public URLs, which a cache-busted request gets right`)
if (lag.length) console.log(`note: edges are still serving ${lag.join(', and ')}. That is cache lag, not exposure or a bad deploy; it clears on its own.`)
process.exit(fails.length || exposed.length ? 1 : 0)
