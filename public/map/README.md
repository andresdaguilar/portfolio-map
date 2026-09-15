# The map image

The map in use is `IsoMAP.jpg`. The filename is set in one place —
`src/imagemap/config.ts` — because the viewer and the calibrator have to agree
on it: a layout traced against one picture means nothing against another.

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

## The character

The map ships with a small figure drawn in code. It walks fine and it will
never look like the picture it is walking on. To replace it, save the pose
sheet here as **`character.png`** and describe it in `character.json`.

The sheet is read as a grid, exactly as a render of poses arrives — no cutting
into a strip, no trimming the whitespace, no lining the feet up by hand. Cells
are numbered left to right, top to bottom.

```json
{ "cols": 3, "rows": 3, "walk": [4, 5, 6, 7], "idle": 3, "facing": "left" }
```

- `walk` — the cells that make the cycle, in order
- `idle` — the cell shown standing still
- `facing` — which way the artwork looks; the other direction is it mirrored

Two things are handled for you. Each pose is measured inside its cell, so the
generous margins of a render do not shrink the character or leave it floating
above the ground — the feet are pinned to the bottom of what is actually
drawn. And a white background is keyed out, so a sheet without transparency
still cuts out cleanly.

Nothing breaks if these are absent; the built-in figure is used instead.
