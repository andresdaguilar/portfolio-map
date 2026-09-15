import { stepTowards } from "./geometry";
import type { Point, Shape } from "./types";

/**
 * The character's movement over the map image.
 *
 * Pure, so the whole rule can be tested without a canvas: given a position, an
 * intent and the walkable outlines, where does the character end up.
 *
 * Positions are normalised to the image, which creates one trap worth naming.
 * A normalised unit along x is `image.width` pixels and along y it is
 * `image.height` pixels — on a 16:9 map, nearly twice as many. Moving by the
 * same normalised amount on both axes would make the character noticeably
 * faster going up and down the screen than across it, so the vertical
 * component is corrected by the aspect ratio.
 */

/**
 * Which way the character is turned.
 *
 * Four, because the artwork has four: the map is isometric but the poses were
 * drawn against the screen, so "back" means walking away from the viewer
 * rather than along any world axis.
 */
export type Direction = "front" | "back" | "left" | "right";

export interface Character {
  at: Point;
  direction: Direction;
  /**
   * The last left or right the character turned.
   *
   * Only the side views have a walk cycle. Moving straight up or down the
   * screen still has to animate, so it borrows the side cycle rather than
   * standing still and sliding — at this size, motion reads better than
   * a technically correct static pose.
   */
  lastSide: "left" | "right";
  /** 1 when facing right on screen, -1 when facing left. */
  facing: 1 | -1;
  /** Advances with distance walked; drives the stride, not the clock. */
  phase: number;
  moving: boolean;
}

export interface Intent {
  /** -1..1 on each screen axis. */
  x: number;
  y: number;
}

export const WALK_SPEED = 0.115;
/** Distance covered per full stride, as a fraction of image width. */
const STRIDE = 0.026;

export function createCharacter(at: Point): Character {
  return {
    at,
    direction: "front",
    lastSide: "right",
    facing: 1,
    phase: 0,
    moving: false,
  };
}

/** The pose that matches a screen-space heading. */
export function directionFor(dirX: number, dirY: number): Direction {
  if (Math.abs(dirX) >= Math.abs(dirY)) return dirX >= 0 ? "right" : "left";
  // Positive y is down the screen, which is towards the viewer.
  return dirY > 0 ? "front" : "back";
}

export function advance(
  character: Character,
  intent: Intent,
  dt: number,
  shapes: readonly Shape[],
  aspect: number,
  speed = WALK_SPEED,
): Character {
  const length = Math.hypot(intent.x, intent.y);
  if (length < 0.001) {
    return { ...character, moving: false };
  }

  // Normalise so a diagonal is not faster than a straight line.
  const dirX = intent.x / length;
  const dirY = intent.y / length;

  const dx = dirX * speed * dt;
  // Same screen distance, fewer normalised units: see the note above.
  const dy = dirY * speed * dt * aspect;

  const wanted = { x: character.at.x + dx, y: character.at.y + dy };
  const next = stepTowards(character.at, wanted, shapes);

  const travelled = Math.hypot(next.x - character.at.x, (next.y - character.at.y) / aspect);
  const direction = directionFor(dirX, dirY);

  return {
    at: next,
    direction,
    lastSide:
      direction === "left" || direction === "right"
        ? direction
        : character.lastSide,
    facing: dirX === 0 ? character.facing : dirX > 0 ? 1 : -1,
    phase: character.phase + (travelled / STRIDE) * Math.PI * 2,
    moving: travelled > 1e-6,
  };
}

/**
 * Walks towards a target, stopping when close enough.
 *
 * Click-to-move matters more here than it would in a side-scroller: the paths
 * wind, and steering a thin walkway with four keys is fiddly compared with
 * pointing at where you want to be.
 */
export function intentTowards(
  from: Point,
  target: Point,
  aspect: number,
  stopWithin = 0.004,
): Intent {
  const dx = target.x - from.x;
  const dy = (target.y - from.y) / aspect;
  if (Math.hypot(dx, dy) < stopWithin) return { x: 0, y: 0 };
  return { x: dx, y: dy };
}
