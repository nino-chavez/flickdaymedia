# Flickday Media — Reaction Stickers

Pop-on stickers for hype frames — a big block, a bounce, a freeze. Transparent,
tightly-cropped PNGs in Flickday's own language (yellow `#facc15` → orange
`#f97316`, comic ink edge, Anton impact, the camera/viewfinder motif). **No
mascot** — a media brand rides on top of its clients' brands, so the energy comes
from camera-native graphics, not a character.

## What's here

**Camera-native (sport-agnostic — use on any shoot)**

| File | Use |
|---|---|
| `sticker-caught-it` | The signature freeze-frame stamp. Pop it on a still / freeze. |
| `sticker-look-here` | Yellow ring + arrow — circle the ball or a player. Transparent centre. |
| `sticker-focus-lock` | AF-lock corner box — bracket a subject. Scale to fit them. |
| `sticker-frame-tag` | `● FRAME 24` freeze marker — small viewfinder tag. |

**Hype word-bursts**

| File | Note |
|---|---|
| `sticker-snap` | Universal (`SNAP!` — the shutter pun). |
| `sticker-block`, `sticker-ace` | Volleyball-pack **examples**. Add/cut words in the render queue. |

## Use in CapCut

These are static art — you animate the *entrance*:

1. Drop the PNG on a track over the freeze/hype frame.
2. Add a **scale-in** keyframe (0 → ~110% → 100% over ~6–10 frames) for the "pop".
   The built-in "Pop"/"Bounce" In animation works too.
3. Hold ~0.5–1s, then cut or scale out. Pair with a shutter-click SFX on `caught-it`.

`look-here` and `focus-lock` have transparent centres — position them *around* the
subject, not over it.

## Add a word / make a sport pack

Word-bursts are one line each in the render queue at the bottom of
`scripts/story-assets/render-stickers.mjs`:

```js
{ name: 'sticker-dig', html: wordBurst('DIG!', { fs: 150, rot: -6 }) },
```

`fs` = font size, `rot` = tilt. Then re-render:

```
node scripts/story-assets/render-stickers.mjs
```

> Rendering reuses Playwright from the sibling `letspepper` repo, so that repo must
> be installed (`pnpm i`) for a regenerate to work.
