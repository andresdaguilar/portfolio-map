/**
 * Isometric world tuning.
 *
 * A different game from the side-scroller: the player walks a plane in two
 * axes, there is no gravity and no jump, and the camera never rotates. One
 * unit is still roughly a metre.
 */

export const ISO_CAMERA = {
  /**
   * Rotation around the vertical axis. 45 degrees puts the world's square grid
   * on screen as diamonds, which is what makes a scene read as isometric.
   */
  azimuth: Math.PI / 4,
  /**
   * How far the camera is tilted down. True isometric is 35.26 degrees; the
   * strategy games this is modelled on sit a little shallower, which shows
   * more of the buildings' faces and less of their roofs.
   */
  elevation: (32 * Math.PI) / 180,
  /** Orthographic, so distance only decides clipping, never scale. */
  distance: 90,
  /** World units visible across the widest axis. Lower is more zoomed in. */
  /**
   * Close enough that the figure reads as a person rather than a token. The
   * whole map is legible from the overview; at play distance the unit is what
   * has to stay clear.
   */
  viewWidth: 28,
  /** How far the player can roam before the camera follows. */
  deadzone: 1.1,
  damping: 5.5,
} as const;

export const WALKER = {
  /** Collision is a circle, not a box: it slides along walls instead of catching. */
  radius: 0.42,
  height: 1.7,
  walkSpeed: 5.4,
  runSpeed: 8.6,
  runAfter: 0.5,
  accel: 34,
  brake: 26,
  /** How fast the body turns to face the direction of travel, in radians/sec. */
  turnSpeed: 14,
} as const;

export const ISO_PHYSICS = {
  step: 1 / 120,
  maxSteps: 8,
} as const;
