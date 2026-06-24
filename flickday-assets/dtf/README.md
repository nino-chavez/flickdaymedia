# Flickday Media — DTF Apparel Kit

Print-ready direct-to-film (DTF) artwork for heat-press onto apparel. Every mark
shares one brand atom — the **camera aperture** — so the whole set reads as one
identity across garments.

Regenerate the entire kit:

```bash
bash scripts/apparel/render-dtf.sh
```

## Print spec

- **3600px long edge @ 300 DPI** → prints crisp up to ~12in (left chest to full back).
- Transparent PNG, flat 2-colour (gold `#facc15` + structural black `#0a0a0a`),
  vector-traced — scales cleanly to any size.

## Marks (by canvas size)

| Mark | Role | Use it on |
|------|------|-----------|
| `lockup` | Hero — flaming ball-aperture + FLICKDAY MEDIA | Tee front, full back |
| `motion` | Hero icon, particle trail | Large back / sleeve hits |
| `slogan` | "Every Day's a Flickday" | Phrase tee, back print |
| `wordmark` | Secondary — lowercase `flickday`, aperture in the **d** | Tee/hoodie chest, medium prints |
| `fstop` | Compact monogram — `f/` + aperture (reads as an f-number) | Shorts leg, hat, sleeve, left chest, photo watermark |
| `icon` | Compact — ball-aperture, no flames | Hat, sleeve, small prints, favicon |

The hero/secondary/compact split is by **canvas size, not by brand** — a big
surface gets the lockup, a small one gets `icon` or `fstop`. Never shrink the
flaming `lockup`/`motion` to a small print; the trails break up. Use `icon` or
`fstop` there.

## Colorways (by garment)

Each mark ships up to four:

| Colorway | Garment |
|----------|---------|
| `fullcolor` | Light / medium garments (gold + black) |
| `mono-white` | Dark garments (1-colour white; seams show the shirt) |
| `mono-black` | Light / tonal garments (1-colour black) |
| `dark-keyline` | Dark garments, `icon` only (cream outline lifts it off black) |

`dark-keyline` is generated only for the solid `icon`; on the particle-heavy
`motion` and on the wordmarks a per-letter outline reads noisy, so those use
`mono-white` on dark garments.

Preview every mark × colorway on its intended garment: [`_mockups.png`](./_mockups.png).

## Building blocks

- `scripts/apparel/render-dtf.sh` — the whole pipeline (ImageMagick + potrace + node).
- `scripts/apparel/make-iris.mjs` — parametric brand iris used by the type marks.
- `scripts/apparel/fonts/` — Poppins (SemiBold for the wordmark, Bold for `f/`).
- Brand source marks live in `flickday-assets/outro/*-transparent.png`.
