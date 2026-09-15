import { ISO_CAMERA } from "./constants";

/**
 * How much world is visible across, driven by the wheel.
 *
 * Module state rather than React state: the camera reads it every frame, and
 * a scroll gesture fires dozens of events a second. Keeping it here also makes
 * the clamping testable without mounting a renderer.
 */
export const zoom = { viewWidth: ISO_CAMERA.viewWidth as number };

/**
 * Scales the view by `factor` and returns the result.
 *
 * Bounded at both ends: zoomed in past the near limit the primitives stop
 * holding up, and zoomed out past the far one the walker is a handful of
 * pixels and the labels are unreadable.
 */
export function zoomBy(factor: number): number {
  zoom.viewWidth = Math.min(
    ISO_CAMERA.maxViewWidth,
    Math.max(ISO_CAMERA.minViewWidth, zoom.viewWidth * factor),
  );
  return zoom.viewWidth;
}

/** Jumps straight to a view width, still respecting the limits. */
export function setViewWidth(width: number): number {
  zoom.viewWidth = Math.min(
    ISO_CAMERA.maxViewWidth,
    Math.max(ISO_CAMERA.minViewWidth, width),
  );
  return zoom.viewWidth;
}

export function resetZoom(): void {
  zoom.viewWidth = ISO_CAMERA.viewWidth;
}

/** Direction of a wheel event, as a zoom factor. */
export function factorForWheel(deltaY: number): number {
  // Wheel notches and trackpads report wildly different magnitudes, so only
  // the direction is used and the step size is ours.
  return deltaY > 0 ? ISO_CAMERA.zoomStep : 1 / ISO_CAMERA.zoomStep;
}
