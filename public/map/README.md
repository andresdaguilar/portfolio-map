# The map image

Put the rendered map here as `map.png` (or `.webp` / `.jpg` — the calibrator
takes any of them, the game reads `map.png` by default).

Two things matter:

**Resolution.** The image is the artwork; it is displayed as large as the
viewport allows and there is no zooming past its own pixels. 3000px wide or
more, ideally. The version this was designed against is 1680 × 945, which is
already soft on a modern display at full screen.

**Text.** Any wording baked into the image cannot be corrected or translated
later, and the current render has some of it wrong — "NutricionDesj", a
truncated "Organis", a duplicated line under Education. The section titles and
project names are drawn over the image as HTML instead: crisp at any size,
selectable, and updated from `src/content/` rather than by regenerating the
picture. A version of the image without baked text is preferred.

The walkable layout is traced over this image at `/calibrate` and saved to
`src/imagemap/layout.json`.
