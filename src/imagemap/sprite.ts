/**
 * An optional hand-made character, drawn instead of the built-in figure.
 *
 * The built-in one is code: good enough to walk the map with, and it will
 * never look like the picture it is walking on.
 *
 * The sheet is taken as a grid, exactly as a render of poses arrives — no
 * cutting into a strip, no trimming the whitespace, no lining the feet up by
 * hand. Which cells make the walk and which one is standing still are named in
 * a small JSON beside it:
 *
 *   /map/character.png    a grid of poses
 *   /map/character.json   { "cols": 3, "rows": 3, "walk": [4,5,6,7],
 *                           "idle": 0, "facing": "left", "fps": 10 }
 *
 * Cells are numbered left to right, top to bottom. `facing` says which way the
 * art looks so the renderer knows when to mirror it.
 */

export interface SpriteMeta {
  cols: number;
  rows: number;
  /** Cell indices making up the walk cycle, in order. */
  walk: number[];
  /** Cell index shown standing still. */
  idle: number;
  /** Which way the artwork faces. The other direction is this one mirrored. */
  facing?: "left" | "right";
  fps?: number;
}

/** Where a pose actually is inside its cell, in source pixels. */
interface FrameBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Sprite {
  image: CanvasImageSource;
  walk: FrameBox[];
  idle: FrameBox;
  facing: 1 | -1;
}

import { CHARACTER_META, CHARACTER_SHEET } from "./config";

const SHEET = CHARACTER_SHEET;
const META = CHARACTER_META;

/** Anything this close to white counts as background on an opaque sheet. */
const WHITE = 244;

/**
 * Finds the pose inside its cell.
 *
 * Rendered sheets come with generous margins and the figures are not centred
 * in them, so using the whole cell would make the character float above the
 * ground and change size from frame to frame. Measuring the ink instead means
 * the feet can be pinned to the bottom of what is actually drawn.
 *
 * Handles both a transparent sheet and one on a white background, because
 * which of the two arrives is not something worth asking about.
 */
function contentBox(
  data: Uint8ClampedArray,
  sheetWidth: number,
  cell: FrameBox,
): FrameBox {
  let minX = cell.x + cell.w;
  let minY = cell.y + cell.h;
  let maxX = cell.x;
  let maxY = cell.y;

  for (let y = cell.y; y < cell.y + cell.h; y += 1) {
    for (let x = cell.x; x < cell.x + cell.w; x += 1) {
      const i = (y * sheetWidth + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 24) continue;
      const nearWhite =
        data[i] > WHITE && data[i + 1] > WHITE && data[i + 2] > WHITE;
      if (nearWhite) continue;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // An empty cell falls back to the whole thing rather than to nothing.
  if (maxX < minX || maxY < minY) return cell;

  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export async function loadSprite(): Promise<Sprite | null> {
  let meta: SpriteMeta;
  try {
    const response = await fetch(META);
    if (!response.ok) return null;
    meta = (await response.json()) as SpriteMeta;
  } catch {
    return null;
  }

  const image = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = SHEET;
  });
  if (!image) return null;

  const cols = Math.max(1, meta.cols);
  const rows = Math.max(1, meta.rows);
  const cellW = Math.floor(image.naturalWidth / cols);
  const cellH = Math.floor(image.naturalHeight / rows);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    // A cross-origin sheet taints the canvas. The sheet is served from the
    // same origin, so this should not happen, but losing the whole character
    // over it would be silly.
    return null;
  }

  const boxFor = (cell: number): FrameBox => {
    const index = Math.min(Math.max(cell, 0), cols * rows - 1);
    return contentBox(pixels, canvas.width, {
      x: (index % cols) * cellW,
      y: Math.floor(index / cols) * cellH,
      w: cellW,
      h: cellH,
    });
  };

  const walk = (meta.walk?.length ? meta.walk : [meta.idle ?? 0]).map(boxFor);

  // White is keyed out so a sheet that arrived without alpha still cuts out.
  const cutout = document.createElement("canvas");
  cutout.width = canvas.width;
  cutout.height = canvas.height;
  const cutCtx = cutout.getContext("2d")!;
  const image_ = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image_.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > WHITE && d[i + 1] > WHITE && d[i + 2] > WHITE) d[i + 3] = 0;
  }
  cutCtx.putImageData(image_, 0, 0);

  return {
    image: cutout,
    walk,
    idle: boxFor(meta.idle ?? 0),
    facing: meta.facing === "right" ? 1 : -1,
  };
}

export interface SpriteDraw {
  /** Centre of the feet, in canvas pixels. */
  x: number;
  y: number;
  /** Full height in canvas pixels. */
  height: number;
  /** Stride phase in radians — the frame follows distance walked, not time. */
  phase: number;
  facing: 1 | -1;
  moving: boolean;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  o: SpriteDraw,
) {
  let box = sprite.idle;
  if (o.moving && sprite.walk.length) {
    const step = Math.floor((o.phase / (Math.PI * 2)) * sprite.walk.length);
    // Walking left gives a negative phase, and a negative modulo would index
    // off the front of the sheet.
    const index = ((step % sprite.walk.length) + sprite.walk.length) % sprite.walk.length;
    box = sprite.walk[index];
  }

  const scale = o.height / box.h;
  const width = box.w * scale;

  ctx.save();
  ctx.translate(o.x, o.y);
  // Mirror when the character faces the other way from the artwork.
  if (o.facing !== sprite.facing) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    sprite.image,
    box.x,
    box.y,
    box.w,
    box.h,
    -width / 2,
    -o.height,
    width,
    o.height,
  );
  ctx.restore();
}
