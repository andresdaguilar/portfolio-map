import type { Direction } from "./character";
import { CHARACTER_META } from "./config";

/**
 * An optional hand-made character, drawn instead of the built-in figure.
 *
 * The built-in one is code: good enough to walk the map with, and it will
 * never look like the picture it is walking on.
 *
 * Sheets are read as grids of poses, exactly as a render arrives — no cutting
 * into strips, no trimming the margins, no lining the feet up by hand. Standing
 * and walking may come from different sheets, because they usually do: a sheet
 * of poses and a sheet of the walk are rendered separately.
 *
 *   /map/character.json
 *   {
 *     "idle": { "sheet": "/map/character.png", "cols": 3, "rows": 3,
 *               "front": 0, "back": 1, "right": 2, "left": 3 },
 *     "walk": { "sheet": "/map/character-walk.png", "cols": 3, "rows": 2,
 *               "left": [0, 1, 2], "right": [3, 4, 5] }
 *   }
 *
 * Cells are numbered left to right, top to bottom. Both sides are drawn, so
 * nothing is mirrored: mirroring would put the backpack on the wrong shoulder
 * every time the character turned around.
 */

export interface SpriteMeta {
  idle: {
    sheet: string;
    cols: number;
    rows: number;
    front: number;
    back: number;
    left: number;
    right: number;
  };
  walk: {
    sheet: string;
    cols: number;
    rows: number;
    left: number[];
    right: number[];
  };
}

/** Where a pose actually sits inside its cell, in source pixels. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Frame {
  image: CanvasImageSource;
  box: Box;
}

export interface Sprite {
  idle: Record<Direction, Frame>;
  walk: { left: Frame[]; right: Frame[] };
}

/** Anything this close to white counts as background — on an opaque sheet. */
const WHITE = 244;

/**
 * Does this sheet already have a cut-out, or is it a figure on white?
 *
 * It matters because the character wears a white t-shirt and white soles.
 * Keying white out of a sheet that is already transparent does not remove a
 * background — it punches holes in the clothes.
 */
function hasTransparency(data: Uint8ClampedArray): boolean {
  let clear = 0;
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 250) clear += 1;
  }
  return clear / (data.length / 16) > 0.05;
}

/**
 * Finds the pose inside its cell.
 *
 * Rendered sheets come with generous margins and the figures are not centred
 * in them, so using the whole cell would make the character float above the
 * ground and change size between frames. Measuring the ink instead lets the
 * feet be pinned to the bottom of what is actually drawn.
 */
function contentBox(
  data: Uint8ClampedArray,
  sheetWidth: number,
  cell: Box,
  transparent: boolean,
): Box {
  let minX = cell.x + cell.w;
  let minY = cell.y + cell.h;
  let maxX = cell.x;
  let maxY = cell.y;

  for (let y = cell.y; y < cell.y + cell.h; y += 1) {
    for (let x = cell.x; x < cell.x + cell.w; x += 1) {
      const i = (y * sheetWidth + x) * 4;
      if (data[i + 3] < 24) continue;
      if (!transparent) {
        const nearWhite =
          data[i] > WHITE && data[i + 1] > WHITE && data[i + 2] > WHITE;
        if (nearWhite) continue;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return cell;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

interface Sheet {
  image: CanvasImageSource;
  frame: (cell: number) => Frame;
}

async function loadSheet(
  url: string,
  cols: number,
  rows: number,
): Promise<Sheet | null> {
  const image = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  if (!image) return null;

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
    // A cross-origin sheet taints the canvas. Sheets are served from the same
    // origin, so this should not happen — but losing the character over it
    // would be silly.
    return null;
  }

  const transparent = hasTransparency(pixels);

  // A sheet that arrived on a white plate gets it keyed out. One already cut
  // out is left alone, or the white shirt goes with the background.
  let source: CanvasImageSource = image;
  if (!transparent) {
    const cutout = document.createElement("canvas");
    cutout.width = canvas.width;
    cutout.height = canvas.height;
    const keyed = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = keyed.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > WHITE && d[i + 1] > WHITE && d[i + 2] > WHITE) d[i + 3] = 0;
    }
    cutout.getContext("2d")!.putImageData(keyed, 0, 0);
    source = cutout;
  }

  // Sheets are rarely an exact multiple of their grid, so each boundary is
  // rounded from the full width rather than flooring a uniform cell size,
  // which would drift a pixel per column and clip the last one.
  const edgeX = (i: number) => Math.round((i * canvas.width) / cols);
  const edgeY = (j: number) => Math.round((j * canvas.height) / rows);

  return {
    image: source,
    frame(cell: number): Frame {
      const index = Math.min(Math.max(cell, 0), cols * rows - 1);
      const i = index % cols;
      const j = Math.floor(index / cols);
      return {
        image: source,
        box: contentBox(
          pixels,
          canvas.width,
          {
            x: edgeX(i),
            y: edgeY(j),
            w: edgeX(i + 1) - edgeX(i),
            h: edgeY(j + 1) - edgeY(j),
          },
          transparent,
        ),
      };
    },
  };
}

export async function loadSprite(): Promise<Sprite | null> {
  let meta: SpriteMeta;
  try {
    const response = await fetch(CHARACTER_META);
    if (!response.ok) return null;
    meta = (await response.json()) as SpriteMeta;
  } catch {
    return null;
  }
  if (!meta?.idle || !meta?.walk) return null;

  const [idleSheet, walkSheet] = await Promise.all([
    loadSheet(meta.idle.sheet, meta.idle.cols, meta.idle.rows),
    loadSheet(meta.walk.sheet, meta.walk.cols, meta.walk.rows),
  ]);
  if (!idleSheet || !walkSheet) return null;

  const cycle = (cells: number[] | undefined, fallback: Frame) =>
    cells?.length ? cells.map((c) => walkSheet.frame(c)) : [fallback];

  const idle = {
    front: idleSheet.frame(meta.idle.front),
    back: idleSheet.frame(meta.idle.back),
    left: idleSheet.frame(meta.idle.left),
    right: idleSheet.frame(meta.idle.right),
  };

  return {
    idle,
    walk: {
      left: cycle(meta.walk.left, idle.left),
      right: cycle(meta.walk.right, idle.right),
    },
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
  direction: Direction;
  /** The side cycle to borrow when walking towards or away from the viewer. */
  lastSide: "left" | "right";
  moving: boolean;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  o: SpriteDraw,
) {
  let frame = sprite.idle[o.direction];

  if (o.moving) {
    // Only the sides have a cycle; walking towards or away from the viewer
    // borrows whichever side the character last turned to.
    const side =
      o.direction === "left" || o.direction === "right" ? o.direction : o.lastSide;
    const frames = sprite.walk[side];
    const step = Math.floor((o.phase / (Math.PI * 2)) * frames.length);
    // Walking left gives a negative phase, and a negative modulo would index
    // off the front of the sheet.
    frame = frames[((step % frames.length) + frames.length) % frames.length];
  }

  const { box } = frame;
  const scale = o.height / box.h;
  const width = box.w * scale;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    frame.image,
    box.x,
    box.y,
    box.w,
    box.h,
    o.x - width / 2,
    o.y - o.height,
    width,
    o.height,
  );
  ctx.restore();
}
