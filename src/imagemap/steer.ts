import { WALK_SPEED, type Intent } from "./character";

/**
 * Holding a finger down and steering with it.
 *
 * A tap already walks somewhere: it asks the pathfinder for a route and the
 * character takes it. That is the right gesture for "go over there" and the
 * wrong one for "go this way for a bit" — you cannot nudge with it, and on a
 * winding walkway nudging is most of what you want to do.
 *
 * So a held pointer becomes a stick, and the character is its centre. Push
 * away from him and he walks that way; slide the finger and he turns; let go
 * and he stops. On a phone, where the view is already centred on him, that is
 * literally a thumbstick under the thumb. On a desktop, where the view does
 * not pan, the same gesture reads as "walk towards here and stop" — which is
 * what holding a point ought to do there.
 *
 * Everything is in canvas pixels. The screen is where the gesture happens, and
 * it is also the space `Intent` is defined in, so nothing needs converting.
 */

export interface Screen {
  x: number;
  y: number;
}

export interface Steer {
  intent: Intent;
  /** Normalised units per second, already ramped. */
  speed: number;
}

/**
 * Inside this, the stick is centred.
 *
 * A finger resting on the character would otherwise pick a direction out of
 * a pixel of noise and jitter him on the spot. It also has to clear the
 * character's own drawn width, or he chases the thumb covering him.
 */
export const DEAD_ZONE_PX = 22;

/** Past this the stick is at the stop and the character is at full pace. */
export const FULL_TILT_PX = 96;

const STILL: Steer = { intent: { x: 0, y: 0 }, speed: 0 };

/**
 * What a pointer held at `pointer` asks of a character drawn at `character`.
 *
 * The speed ramps between the dead zone and full tilt rather than switching
 * on, which is the whole reason to hold instead of tap: a short push edges
 * along a ledge, a long one crosses a bridge.
 */
export function steerTowards(
  character: Screen,
  pointer: Screen,
  base = WALK_SPEED,
): Steer {
  const dx = pointer.x - character.x;
  const dy = pointer.y - character.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= DEAD_ZONE_PX) return STILL;

  const tilt = Math.min(
    1,
    (distance - DEAD_ZONE_PX) / (FULL_TILT_PX - DEAD_ZONE_PX),
  );

  return {
    // `advance` normalises the intent itself, so this only carries direction.
    intent: { x: dx, y: dy },
    speed: base * tilt,
  };
}

/**
 * How long a press has to last before it is a stick rather than a tap.
 *
 * Short enough that holding feels immediate, long enough that a deliberate
 * tap never starts walking the character sideways first.
 */
export const HOLD_MS = 180;

/**
 * Movement that turns a press into a stick before the timer does.
 *
 * Someone who is already dragging has said what they meant, and making them
 * wait out the timer first is the difference between a control that answers
 * and one that hesitates.
 */
export const DRAG_SLOP_PX = 12;

/** Whether a press that started at `from` and is now at `to` is steering yet. */
export function isSteering(
  from: Screen,
  to: Screen,
  heldMs: number,
  holdMs = HOLD_MS,
  slop = DRAG_SLOP_PX,
): boolean {
  return heldMs >= holdMs || Math.hypot(to.x - from.x, to.y - from.y) > slop;
}
