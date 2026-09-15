# The map image

The map in use is `map2.png`. The filename is set in one place —
`src/imagemap/config.ts` — because the viewer and the calibrator have to agree
on it: a layout traced against one picture means nothing against another.

Changing the picture means tracing it again. `IsoMAP.jpg` is the previous
render and its layout is in the git history, but the second map moved every
district, so none of it carried over.

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
never look like the picture it is walking on. To replace it, describe your
sheets in `character.json`.

Sheets are read as grids of poses, exactly as a render arrives — no cutting
into strips, no trimming the margins, no lining the feet up by hand. Standing
and walking may come from different sheets, because they usually do.

```json
{
  "idle": { "sheet": "/map/character.png", "cols": 3, "rows": 3,
            "front": 0, "back": 1, "right": 2, "left": 3 },
  "walk": { "sheet": "/map/character-walk.png", "cols": 3, "rows": 2,
            "left": [0, 1, 2], "right": [3, 4, 5] }
}
```

Cells are numbered left to right, top to bottom.

Both sides are drawn rather than one mirrored — a mirrored walk would put the
backpack on the wrong shoulder every time the character turned around. Only
the sides need a cycle: walking towards or away from the viewer borrows
whichever side was last faced, because at this size motion reads better than a
technically correct standing pose sliding across the ground.

Two things are handled for you. Each pose is measured inside its cell, so the
generous margins of a render do not shrink the character or leave it floating
above the ground — the feet are pinned to the bottom of what is actually
drawn. And a white background is keyed out only when the sheet has no alpha of
its own; keying an already cut-out sheet would take the white t-shirt with it.

Nothing breaks if `character.json` is absent; the built-in figure is used.
