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
  /**
   * Zoom limits, expressed as how much world is visible across.
   *
   * Bounded in both directions on purpose: past the near limit the primitives
   * stop holding up close, and past the far one the walker is a few pixels and
   * the labels are unreadable.
   */
  minViewWidth: 14,
  maxViewWidth: 68,
  /** Multiplier applied per wheel notch. */
  zoomStep: 1.12,
  /** How quickly the view eases to a new zoom level. */
  zoomEase: 9,
  /** How far the player can roam before the camera follows. */
  deadzone: 1.1,
  damping: 5.5,
} as const;

export const WALKER = {
  /** Collision is a circle, not a box: it slides along walls instead of catching. */
  radius: 0.34,
  /**
   * Deliberately small against the buildings. The map is meant to be read as
   * a model of a life seen from above, and a figure at full architectural
   * scale turns it into a street you happen to be standing in.
   */
  height: 1.25,
  walkSpeed: 5.2,
  runSpeed: 8.8,
  runAfter: 0.5,
  accel: 34,
  brake: 26,
  /** How fast the body turns to face the direction of travel, in radians/sec. */
  turnSpeed: 14,
  /**
   * How quickly the walker settles onto a new ground height. Fast enough that
   * a step never looks like floating, slow enough that it reads as a stride
   * rather than a teleport.
   */
  climbEase: 12,
} as const;

export const ISO_PHYSICS = {
  step: 1 / 120,
  maxSteps: 8,
} as const;
