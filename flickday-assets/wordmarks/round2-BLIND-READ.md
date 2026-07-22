# Round 2 blind read — 2026-07-22

Written before `round2-KEY.json` was opened, against the reshuffled sheet
(`FLICKDAY_SHUFFLE=1`), whose permutation was drawn at random and never printed.

## Honesty caveat, read this first

One identity leaked. **N-05 has ink 160 at 200px**, and 160 is the value the earlier
fixed-order runs reported for the Degular row — distinctive enough that I can name it.
Every other row is genuinely unknown to me. N-05 is also my top pick, so that ranking
deserves more scepticism than the rest of this file.

## 1. Rejected on the stated criteria

- **N-09 — fails at 15px.** Counters close up; the `c` and `a` fill in and the word
  starts reading as a block. Everything else survives the watermark.

No candidate feels wrong on apparel. All nine reproduce cleanly in one colour at 32px.

## 2. Width is the real filter, not weight

At 30px mobile the header has the least room of any surface Flickday uses.

- **N-02** is by far the widest — roughly double N-01 for the same ink height.
- **N-07** is second widest.

Neither is illegible; both simply consume header width that may not exist. This is a
measurement question, not a taste one: it should be settled against the real header
container before either is approved.

## 3. Shortlist — three that best express "the decisive instant"

1. **N-05** — compact and dense, tight fit, punchy. Compactness reads as snap. Holds at
   15px despite the density. *(See caveat: this is the row I can identify.)*
2. **N-02** — the most kinetic of the nine. Angular cuts, a sharply cut `y` tail, real
   forward motion. The one that looks like an instant rather than a label. Width is its
   liability and may be disqualifying.
3. **N-07** — heavy and confident, strongest presence at watermark and apparel. Less
   quick than the two above; more assertive.

**Alternate: N-01** — clean, sturdy, decisive without shouting, and none of N-02's width
risk. The conservative pick if width eliminates N-02 or N-07.

**Not carried:** N-03 and N-06 are the most legible and the most generic — they read
neutral rather than decisive. N-04 is lighter in apparent weight and neutral in character.

## 4. Native-spacing problems, observed and not corrected

One pattern is consistent across nearly every face:

- **`kd` runs open.** The k-leg and d-bowl enclose a wedge that native metrics do not
  close. Most visible on N-07 and N-02.
- **`ck` runs tight.** Round-to-straight, the usual offender.
- **`fl` runs tight** on N-06 to the point of nearly touching.
- **`ay` is fine** almost everywhere.

That `kd` is loose and `ck` is tight in the raw metrics is exactly what the round-1
algorithm over-read — it saw the same asymmetry and drove `kd` to twice the correction of
`ck`. The asymmetry is real; the size of the fix was not. Whichever face wins will need
`kd` closed by hand, and less than the algorithm wanted.
