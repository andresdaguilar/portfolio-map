import { CAMERA, PLAYER } from "./constants";

/**
 * Camera follow, as a pure function.
 *
 * Pulled out of the component so it can be driven with fixed steps and
 * asserted on. Damping alone is not a guarantee: going down a flight of
 * stairs the camera lags behind, and with a generous deadzone the player
 * drifts to the bottom of the frame and eventually out of it. So the soft
 * follow is followed by a hard clamp that the character cannot escape.
 */

export interface CameraFrame {
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Framerate-independent damping: the same ease at 60Hz and 120Hz. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Half the world height visible at a given vertical field of view. */
export function visibleHalfHeight(fovDegrees: number): number {
  return CAMERA.distance * Math.tan((fovDegrees * Math.PI) / 360);
}

export interface FollowTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  grounded: boolean;
}

export function followPlayer(
  cam: CameraFrame,
  target: FollowTarget,
  dt: number,
  halfHeight: number,
): CameraFrame {
  // Lead in the direction of travel, proportional to speed, so the player sees
  // where they are going rather than where they have been.
  const lead =
    target.facing * CAMERA.lookAhead * Math.min(Math.abs(target.vx) / 4, 1);
  const focusX = target.x + lead;
  const focusY = target.y + CAMERA.yOffset;

  // Inside the deadzone the camera does not move at all, which is what stops a
  // side-scroller feeling seasick while the player is bouncing around.
  const restX = clamp(cam.x, focusX - CAMERA.deadzone.x, focusX + CAMERA.deadzone.x);
  const x = damp(cam.x, restX, CAMERA.damping.x, dt);

  // Vertically, the deadzone holds only while the player is actually moving up
  // or down. Once they settle on a floor the frame drifts back to centre, so a
  // descent does not leave them stranded at the bottom of the screen for good.
  const settled = target.grounded && Math.abs(target.vy) < 0.1;
  const restY = settled
    ? focusY
    : clamp(cam.y, focusY - CAMERA.deadzone.y, focusY + CAMERA.deadzone.y);
  let y = damp(
    cam.y,
    restY,
    settled ? CAMERA.recentre : CAMERA.damping.y,
    dt,
  );

  // The guarantee. Whatever the damping is doing, the character stays on
  // screen with room to spare.
  const bodyCentre = target.y + PLAYER.height / 2;
  const margin = Math.max(0, halfHeight - PLAYER.height * CAMERA.edgeMargin);
  y = clamp(y, bodyCentre - margin, bodyCentre + margin);

  return { x, y };
}

/**
 * How far the player's body centre sits from the centre of frame, as a
 * fraction of half the viewport. 1 means exactly on the edge.
 */
export function framingOffset(
  cam: CameraFrame,
  playerY: number,
  halfHeight: number,
): number {
  return Math.abs(cam.y - (playerY + PLAYER.height / 2)) / halfHeight;
}
