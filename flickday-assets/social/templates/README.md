# Social post templates

Four data-driven post templates for the Flickday Media feed. Each one is a single HTML file that
renders at both 1080×1350 (feed) and 1080×1920 (story) from the same markup, switching on
`format` in its payload. Facts live in the `.data.json` files; the HTML holds no fact at all.

Rendering is not publishing. Every card here gets a human look before it goes out.

## The four templates

| File | What it announces |
|---|---|
| `booking-push.html` | Now booking — the drive to get organizers to book coverage |
| `drop-notice.html` | Gallery live, drop delayed, or a schedule update |
| `partner-thanks.html` | Thanks to the tournaments, organizers and partners of a season |
| `coverage-schedule.html` | Where Flickday is shooting next |

Each ships a sample payload (`<name>.data.json`) and two rendered samples
(`<name>-feed.png`, `<name>-story.png`).

## The not-for-publication bar

Every payload carries `facts_confirmed`. When it is `false` the card renders a full-width
orange bar reading `SAMPLE DATA — NOT FOR PUBLICATION` above everything else, and the rest of
the layout reflows to fit it.

- Set it to `true` only when every string on the card traces to a source you can name.
- `booking-push.data.json` ships `true` — every string on it comes from the live `index.html`.
- The other three ship `false` — their sample content is invented to show the composition.
- The orange is Event Orange `#f97316`, which BRAND-PRIORS lists as a deliberate non-site
  accent. The bar cannot be yellow: yellow is already the CTA colour on three of the four cards.

Never put a real date, price, sponsor, opponent or venue on a card unless you sourced it.

## Data fields

Fields shared by all four:

- `facts_confirmed` — boolean. Drives the bar above.
- `unconfirmed_label` — the bar's text.
- `format` — `"feed"` or `"story"`. `render.sh` sets this per size; you do not edit it.

### booking-push

- `eyebrow` — short line beside the wordmark, uppercased by the template.
- `word` — the single word that fills the stack. Any length; the template sizes it to the column.
- `stack_rows` — how many times to repeat it. Default 4.
- `accent_row` — which row is solid yellow, counting from 0. Default is second from the bottom.
- `rows` — 2 to 4 entries of `{label, value}`. Add `"mono": true` to set the value in JetBrains
  Mono, which is what an email address or a URL wants.
- `cta`, `url` — the yellow band at the foot.

### drop-notice

- `kind` — `"live"`, `"delayed"` or `"update"`. `live` inverts the headline block to a solid
  yellow field with black type, so a release does not read as an apology. The other two stay on
  black with a rule above and below, yellow for `update` and grey for `delayed`.
- `chip` — the small label beside the wordmark.
- `headline` — the status words. The template picks how to break them; see below.
- `reason` — one sentence under the headline.
- `next` — what the reader should do.
- `updates_at` — where the next update will appear.

### partner-thanks

- `eyebrow` — the season this covers.
- `headline` — the display line. Its last word is set in yellow.
- `tiles` — 4 to 8 entries of `{name}` or `{name, logo}`. `logo` is a path relative to this
  directory. A tile with no logo renders its name as a text tile, so the card works before any
  logo file arrives.
- `closing` — one line under the grid.

### coverage-schedule

- `eyebrow`, `title`, `subtitle` — the header block.
- `rows` — entries of `{m, d, name, where}` with an optional `chip`. A chip reading
  `Confirmed` fills yellow; anything else (`Tentative`) renders as a grey outline. A tentative
  date that looks confirmed is the failure this template exists to avoid.
- `cta`, `url` — the yellow band.
- `footer` — the day counter, e.g. `DAY 250 / 365`. It is a fact about today's date, so it goes
  stale; treat it as one more thing to check before posting.

## Commands

### render.sh

    ./render.sh [template-name ...]

Re-renders templates at both sizes. With no arguments it does all four.

- Reads `<name>.data.json`, injects `format` per size, writes `<name>-feed.png` and
  `<name>-story.png` beside the template.
- Calls `render-kit` at `~/Workspace/dev/tools/render-kit/bin/render-kit.mjs`.
- Takes one or more base names to render a subset: `./render.sh drop-notice`.
- Needs network. The four faces load from Google Fonts by `<link>`; BRAND-PRIORS bans
  `@import` in CSS because it hangs the load.

To change what a card says, edit its `.data.json` and run this. Do not edit the HTML.

## Where the brand comes from

Nothing here is invented, and nothing came from a generated brand doc — `standards/asset-render-standard.md`
gate 1 says the live site wins over any such doc, and records that the deleted `DESIGN.md` had
drifted.

- **Palette** — `index.html` `:root`: `--black #000000`, `--white #ffffff`, `--yellow #facc15`,
  `--yellow-bright #fde047`, `--gray-dark #111`, `--gray-mid #333`, `--gray-light #888`.
- **Type** — the same `:root`: Anton display, Inter body, Barlow Condensed 700 tags, JetBrains
  Mono labels. Loaded from the same Google Fonts URL `index.html` uses.
- **Marks** — the shipped PNGs one directory up: `bug-lockup-white.png` and
  `handle-flat-white.png`. The wordmark is never re-set in another face. `SOCIAL.md` notes those
  files render at 3× their intended display size, so the lockup sits at 238px and the handle at
  340px on a 1080 canvas, at both sizes.
- **Safe areas** — read off `motion/flickday-overlay-kit/compositions/*.html`, the only geometry
  in this repo validated against real posts: story keeps 300px clear at the top, 270px at the
  bottom and 84px at the left, with 180px at the right for the action rail. Feed uses 64px all
  round.
- **Tagline** — `Every Day's a Flickday`, set in the HTML and uppercased in CSS so the source
  string stays exact. It appears whole or not at all.

## Known gaps

- `BRAND-PRIORS.md` points at `flickday-assets/wordmarks/WORDMARK.md` for the optical cuts. That
  file is not in the repo. The crossover numbers used here come from `SOCIAL.md`, which quotes it.
- `booking-push` is the one card that renders with no bar, so its pixels carry no warning.
  Its 2026 framing is verbatim from the live site's hero badge and contact status, but the site
  itself may be behind: on a September render, "NOW BOOKING 2026" reads late in the year. Check
  the site says what you want it to say before posting this one.
- Nobody has looked at these on a phone yet. The sizes follow `SOCIAL.md`'s arithmetic, not a
  measurement of a real post.
