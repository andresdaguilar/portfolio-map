import type { Point } from "./types";

/**
 * Where the map sits inside the canvas.
 *
 * On a desktop window the whole map fits, centred, and there is nothing to
 * decide. On a phone it does not: the artwork is a wide landscape and the
 * screen is a tall portrait, so fitting all of it means fitting it to the
 * *width* — a 1672-pixel map squeezed into 375 leaves a strip a couple of
 * centimetres tall floating in a black screen, with a character on it four
 * pixels wide. Technically the whole world; practically unusable.
 *
 * So on a narrow screen the map fills the viewport instead and the view
 * follows the character, clamped so no edge of the image ever comes inside
 * the frame. Same transform in both cases — only the choice between fitting
 * and filling changes.
 */

export interface Size {
  width: number;
  height: number;
}

/** The transform from image space (0..1) to canvas pixels. */
export interface View {
  /** Canvas pixels per image pixel. */
  scale: number;
  /** Canvas position of the image's top-left corner. */
  x: number;
  y: number;
}

/**
 * Below this width, fitting the whole map leaves it too small to read.
 *
 * Matches the `sm:` breakpoint the panels already use, so the map and the UI
 * over it change character at the same width rather than at two nearby ones.
 */
export const NARROW_VIEWPORT = 640;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Lay the image into the viewport, keeping `focus` in frame.
 *
 * `focus` is in image space and is only consulted on the axes where the image
 * is larger than the viewport — on the others the image is centred, which is
 * what makes the desktop case fall out of the same code.
 */
export function fitView(viewport: Size, image: Size, focus: Point): View {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    image.width <= 0 ||
    image.height <= 0
  ) {
    return { scale: 1, x: 0, y: 0 };
  }

  const toWidth = viewport.width / image.width;
  const toHeight = viewport.height / image.height;

  // Fit the whole map, or fill the screen with it.
  const scale =
    viewport.width < NARROW_VIEWPORT
      ? Math.max(toWidth, toHeight)
      : Math.min(toWidth, toHeight);

  const width = image.width * scale;
  const height = image.height * scale;

  return {
    scale,
    x: axis(viewport.width, width, focus.x),
    y: axis(viewport.height, height, focus.y),
  };
}

/**
 * One axis: centre the image when it fits, otherwise centre the focus and
 * clamp. The clamp is what stops the camera from panning off the artwork and
 * showing bare canvas next to it.
 */
function axis(viewport: number, image: number, focus: number): number {
  if (image <= viewport) return (viewport - image) / 2;
  return clamp(viewport / 2 - focus * image, viewport - image, 0);
}
