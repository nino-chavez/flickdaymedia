# Flickday isolated `d` glyph — round 1

Status: component construction study; not production artwork.

## Why this workflow

The custom `d` is developed independently, then overlaid into a fixed `flickday` wordmark. Image generation can explore the reel/filmstrip fusion without redrawing, misspelling, re-kearning, or distorting the other letters.

## Files

- `d-glyph-v2-transparent.png` — isolated high-resolution component with alpha.
- `d-glyph-v2-chroma-source.png` — original flat-background image-generation output.
- `wordmark-overlay-preview-v2.png` — deterministic composite at matched ascender and baseline height.

## Current assessment

The reel now functions as the bowl and the attached filmstrip functions as the ascender, so the silhouette reads as a lowercase `d` more reliably than the earlier reel-with-loose-tail concepts. The component is still too detailed for final small-size use: the sprocket perforations and five reel openings need optical simplification during vector reconstruction.

Recommended next refinements:

1. Test four versus five reel openings at watermark size.
2. Reduce the stem to two or three frame windows depending on final scale.
3. Match the bowl diameter, stroke mass, corner radii, gold value, and side bearings to the approved base wordmark.
4. Reconstruct the selected geometry as SVG; keep the raster only as a visual reference.

## Generation method

Built-in image generation using the supplied isolated film-reel reference, the prior Flickday lockup, and the Firefly placement concept. The selected second pass explicitly removed the loose under-reel tail and attached a compact filmstrip stem directly to the reel's right edge. A flat chroma background was removed locally to produce the alpha PNG.
