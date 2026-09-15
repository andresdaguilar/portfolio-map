/**
 * World tuning. One unit is roughly one metre; the player is 1.7 tall.
 *
 * These numbers are the difference between "a box that slides" and a body with
 * weight. Inside's whole feel comes from acceleration ramps and recovery
 * frames, so nothing here should be changed without walking the result.
 */

export const PLAYER = {
  width: 0.55,
  height: 1.7,
  /** Top speed when walking. */
  walkSpeed: 3.2,
  /** Top speed when running (held direction for `runAfter` seconds). */
  runSpeed: 5.6,
  runAfter: 0.45,
  /** Ground acceleration and braking. Braking is slower — that reads as weight. */
  accel: 22,
  brake: 14,
  /** Air control is deliberately poor. */
  airAccel: 9,
  /**
   * Gives a jump apex of v^2/2g = 1.9 units — just over the player's own
   * height. Lower than this and the character cannot clear their own body,
   * which reads as broken no matter how good the animation is.
   */
  jumpVelocity: 10,
  climbSpeed: 2.4,
  /**
   * Ledges up to this high are walked over automatically. The career corridor
   * is built out of small rises; without this the player has to jump every
   * curb and the walk through twenty years turns into an obstacle course.
   */
  stepHeight: 0.7,
  /** Jump still works this long after walking off an edge. */
  coyoteTime: 0.1,
  /** A jump pressed this long before landing still fires on touchdown. */
  jumpBuffer: 0.12,
} as const;

export const PHYSICS = {
  gravity: 26,
  maxFall: 24,
  /** Fixed simulation step. Rendering interpolates between steps. */
  step: 1 / 120,
  /** Never simulate more than this many steps in one frame (tab-switch guard). */
  maxSteps: 8,
} as const;

export const CAMERA = {
  /**
   * Long lens. Telephoto compression is what makes a 3D scene read as 2.5D,
   * so this is the value to protect — but it cannot be protected on every
   * screen. See `fovMin`/`fovMax`.
   */
  fov: 24,
  distance: 30,
  /**
   * How much world the player should see across, in units. Zones are authored
   * against this width.
   */
  /**
   * Wider than the rooms are tall, so ceilings, signs and the floor above are
   * all in frame at once. Too tight and the visitor only sees a company's sign
   * by jumping at it.
   */
  targetWidth: 18,
  /**
   * The lens opens up on narrow screens. A phone held upright simply cannot
   * show a useful slice of a side-scroller at 24 degrees — it frames about six
   * units and the player ends up nose-to-nose with a wall. Portrait trades
   * compression for being playable at all; landscape keeps the long lens.
   */
  /**
   * Low, because rooms are about 7.5 units tall and the frame should be filled
   * by the room rather than by the void under its floor. A tighter lens also
   * means more compression, which is the look.
   */
  fovMin: 14,
  /**
   * Ceiling on how much world height is framed, in units.
   *
   * Deriving the lens from width alone means a squarer window frames far more
   * height than a 7.5-unit room can fill, and the surplus lands as dead space
   * under the floor. Capping height trades a little width on those windows for
   * a frame that is actually full.
   */
  maxVisibleHeight: 11,
  /**
   * Floor on framed width, in units. Outranks `maxVisibleHeight`: on a phone
   * held upright, capping height collapses the horizontal slice to a few units
   * and the side-scroller stops being playable. Height is a nicety, width is
   * the game.
   */
  minVisibleWidth: 12,
  fovMax: 48,
  /** The player can move this far from centre before the camera follows. */
  deadzone: { x: 1.6, y: 1.3 },
  /** Higher is snappier. Vertical lags more so stairs feel calm. */
  damping: { x: 4.5, y: 4.2 },
  /** How far the camera leads in the direction of travel, in units. */
  lookAhead: 2.4,
  /** Frames the character slightly below centre, leaving headroom. */
  yOffset: 2.6,
  /**
   * Hard limit on how far the character may sit from centre frame, in player
   * heights of clearance from the edge. The damping is allowed to lag, but
   * never far enough to push the character out of view.
   */
  edgeMargin: 1.1,
  /**
   * How quickly the frame drifts back to centre once the player settles.
   *
   * A deadzone alone never re-centres: walk down a flight and the camera stops
   * the moment the player re-enters the zone, leaving them parked low in frame
   * for the rest of the game. Slow enough not to be noticed while playing.
   */
  recentre: 1.7,
} as const;

/**
 * Depth planes. Gameplay is always z = 0.
 *
 * `haze` sits far enough back that linear fog has fully consumed it, so that
 * plane renders as pure fog colour — the lit backdrop every silhouette reads
 * against. Moving it closer is the fastest way to ruin the look.
 */
export const DEPTH = {
  foreground: 7,
  gameplay: 0,
  background: -9,
  haze: -62,
} as const;

/**
 * Linear fog, not exponential. Exp2 makes the near plane mushy long before the
 * far plane saturates; with near/far the play plane stays crisp and the
 * backdrop still dissolves completely.
 */
export const FOG_RANGE = { near: 26, far: 95 } as const;
