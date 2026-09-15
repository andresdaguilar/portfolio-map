import { ISO_CAMERA } from "./constants";
import { ISLANDS } from "../world/islands";

/**
 * Projecting the world onto the screen, and keeping the camera over the map.
 *
 * The camera is orthographic and never turns, so a point's screen position is
 * a fixed linear function of its world position. Having that in closed form
 * means the view can be sized to fit the whole archipelago exactly, and the
 * follow can be clamped so the frame never drifts off into open water.
 */

const SIN_AZ = Math.sin(ISO_CAMERA.azimuth);
const COS_AZ = Math.cos(ISO_CAMERA.azimuth);
const SIN_EL = Math.sin(ISO_CAMERA.elevation);
const COS_EL = Math.cos(ISO_CAMERA.elevation);

export interface ScreenPoint {
  sx: number;
  sy: number;
}

/** Where a world point lands on screen, in world units. */
export function groundToScreen(x: number, z: number, y = 0): ScreenPoint {
  return {
    sx: COS_AZ * x - SIN_AZ * z,
    sy: -SIN_EL * (SIN_AZ * x + COS_AZ * z) + COS_EL * y,
  };
}

/** The inverse, for points on the ground plane. */
export function screenToGround(sx: number, sy: number): { x: number; z: number } {
  // sx = cos*x - sin*z and sy = -sinEl*(sin*x + cos*z); solve the pair.
  const along = -sy / SIN_EL; // sin*x + cos*z
  return {
    x: COS_AZ * sx + SIN_AZ * along,
    z: -SIN_AZ * sx + COS_AZ * along,
  };
}

/** Tallest thing on the map, so a dome is not framed out of the top. */
const HEIGHT_ALLOWANCE = 8;

/** The archipelago's extent in screen space. */
export const MAP_BOUNDS = (() => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const isle of ISLANDS) {
    for (const cx of [isle.x - isle.w / 2, isle.x + isle.w / 2]) {
      for (const cz of [isle.z - isle.d / 2, isle.z + isle.d / 2]) {
        for (const cy of [0, HEIGHT_ALLOWANCE]) {
          const { sx, sy } = groundToScreen(cx, cz, cy);
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
      }
    }
  }

  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
})();

/** Screen-space centre of the map, as a point on the ground. */
export const MAP_CENTRE = screenToGround(
  (MAP_BOUNDS.minX + MAP_BOUNDS.maxX) / 2,
  (MAP_BOUNDS.minY + MAP_BOUNDS.maxY) / 2,
);

/**
 * The view width that shows the entire archipelago at a given aspect ratio.
 *
 * This doubles as the zoom-out limit: there is nothing beyond the islands
 * worth framing, so the far end of the wheel is "the whole map" rather than an
 * arbitrary number.
 */
export function fitViewWidth(aspect: number, padding = 1.06): number {
  return Math.max(MAP_BOUNDS.width, MAP_BOUNDS.height * aspect) * padding;
}

/**
 * Keeps the framed rectangle inside the map.
 *
 * Once the view is wide enough to hold everything the two clamps cross over
 * and collapse to the centre, which is exactly the behaviour wanted: fully
 * zoomed out, the camera simply sits still over the whole archipelago.
 */
export function clampFocus(
  x: number,
  z: number,
  viewWidth: number,
  aspect: number,
): { x: number; z: number } {
  const halfWidth = viewWidth / 2;
  const halfHeight = viewWidth / aspect / 2;

  const { sx, sy } = groundToScreen(x, z);

  const clamp = (value: number, lo: number, hi: number) =>
    lo > hi ? (lo + hi) / 2 : Math.min(Math.max(value, lo), hi);

  return screenToGround(
    clamp(sx, MAP_BOUNDS.minX + halfWidth, MAP_BOUNDS.maxX - halfWidth),
    clamp(sy, MAP_BOUNDS.minY + halfHeight, MAP_BOUNDS.maxY - halfHeight),
  );
}
