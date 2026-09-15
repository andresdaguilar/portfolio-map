import { ISO_CAMERA } from "./constants";

/**
 * How much world is visible across, driven by the wheel.
 *
 * Module state rather than React state: the camera reads it every frame and a
 * scroll gesture fires dozens of events a second. Keeping it here also makes
 * the clamping testable without mounting a renderer.
 */
export const zoom = {
  viewWidth: ISO_CAMERA.viewWidth as number,
  /**
   * The zoom-out limit, set from the map's own extent once the viewport size
   * is known. There is nothing past the islands worth framing, so the far end
   * of the wheel is "the whole archipelago" rather than an arbitrary number.
   */
  maxWidth: ISO_CAMERA.maxViewWidth as number,
};

function clamp(width: number): number {
  return Math.min(zoom.maxWidth, Math.max(ISO_CAMERA.minViewWidth, width));
}

/** Scales the view by `factor` and returns the result, within the limits. */
export function zoomBy(factor: number): number {
  zoom.viewWidth = clamp(zoom.viewWidth * factor);
  return zoom.viewWidth;
}

/** Jumps straight to a view width, still respecting the limits. */
export function setViewWidth(width: number): number {
  zoom.viewWidth = clamp(width);
  return zoom.viewWidth;
}

/**
 * Sets the zoom-out limit and opens the map at it.
 *
 * Called once the viewport is measured: the whole point is that a visitor
 * arrives looking at the entire map and then chooses what to walk up to.
 */
export function fitTo(width: number): void {
  zoom.maxWidth = width;
  zoom.viewWidth = clamp(width);
}

export function resetZoom(): void {
  zoom.maxWidth = ISO_CAMERA.maxViewWidth;
  zoom.viewWidth = clamp(ISO_CAMERA.viewWidth);
}

/** Direction of a wheel event, as a zoom factor. */
export function factorForWheel(deltaY: number): number {
  // Wheel notches and trackpads report wildly different magnitudes, so only
  // the direction is used and the step size is ours.
  return deltaY > 0 ? ISO_CAMERA.zoomStep : 1 / ISO_CAMERA.zoomStep;
}
