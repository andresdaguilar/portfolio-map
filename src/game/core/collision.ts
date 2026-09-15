/**
 * Axis-aligned collision for a side-scroller on a fixed Z plane.
 *
 * A physics engine would be dead weight here: the world is a static list of
 * boxes and the player is one moving box. Resolving X and Y as separate passes
 * is the standard platformer approach and it stays perfectly predictable —
 * which matters, because a portfolio must never drop the visitor through the
 * floor.
 */

export type ColliderKind = "solid" | "platform" | "ladder" | "trigger";

export interface Collider {
  /** Left edge. */
  x: number;
  /** Bottom edge. */
  y: number;
  w: number;
  h: number;
  kind: ColliderKind;
  /** Set on `trigger` colliders so the game can react to entering them. */
  id?: string;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** Colliders that stop horizontal movement. One-way platforms never do. */
const blocksHorizontally = (c: Collider) => c.kind === "solid";

export interface MoveResult {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  /** True when the player pushed into a wall this step. */
  hitWall: boolean;
  /** True when the player was lifted over a low ledge this step. */
  stepped: boolean;
}

/** Is this box clear of everything solid at these coordinates? */
function isClear(
  box: Box,
  colliders: readonly Collider[],
): boolean {
  return !colliders.some(
    (c) => c.kind === "solid" && overlaps(box, c),
  );
}

/**
 * Moves `box` by (dx, dy) and resolves it out of the world.
 *
 * `prevBottom` is the player's bottom edge before this step. One-way platforms
 * only catch a player that was already above them, so you can jump up through
 * a floor and land on it, but never get shoved up into one from below.
 */
export function moveAndCollide(
  box: Box,
  dx: number,
  dy: number,
  vx: number,
  vy: number,
  colliders: readonly Collider[],
  /** Ledges no taller than this are climbed automatically. 0 disables it. */
  stepHeight = 0,
): MoveResult {
  let { x, y } = box;
  const { w, h } = box;
  const prevBottom = y;
  let grounded = false;
  let hitWall = false;
  let stepped = false;

  // --- Horizontal pass ---
  x += dx;
  if (dx !== 0) {
    for (const c of colliders) {
      if (!blocksHorizontally(c)) continue;
      if (!overlaps({ x, y, w, h }, c)) continue;

      // Before treating it as a wall, see whether it is just a low ledge the
      // player can walk up. Requires headroom at the new height, otherwise the
      // player would be shoved into a ceiling.
      const top = c.y + c.h;
      const rise = top - y;
      if (stepHeight > 0 && rise > 0 && rise <= stepHeight) {
        const lifted = { x, y: top, w, h };
        if (isClear(lifted, colliders)) {
          y = top;
          stepped = true;
          continue;
        }
      }

      x = dx > 0 ? c.x - w : c.x + c.w;
      vx = 0;
      hitWall = true;
    }
  }

  // --- Vertical pass ---
  y += dy;
  if (dy !== 0) {
    for (const c of colliders) {
      if (c.kind === "trigger" || c.kind === "ladder") continue;

      // A one-way platform is only solid to a player falling onto its top.
      if (c.kind === "platform") {
        const landing = dy < 0 && prevBottom >= c.y + c.h - 0.01;
        if (!landing) continue;
      }

      if (!overlaps({ x, y, w, h }, c)) continue;

      if (dy > 0) {
        y = c.y - h;
        vy = 0;
      } else {
        y = c.y + c.h;
        vy = 0;
        grounded = true;
      }
    }
  }

  if (stepped) grounded = true;

  return { x, y, vx, vy, grounded, hitWall, stepped };
}

/** True when the box is resting on something solid. */
export function isGrounded(box: Box, colliders: readonly Collider[]): boolean {
  const feet = { x: box.x, y: box.y - 0.05, w: box.w, h: 0.05 };
  return colliders.some((c) => {
    if (c.kind === "trigger" || c.kind === "ladder") return false;
    if (c.kind === "platform" && box.y < c.y + c.h - 0.01) return false;
    return overlaps(feet, c);
  });
}

/** The ladder the box is currently inside, if any. */
export function ladderAt(
  box: Box,
  colliders: readonly Collider[],
): Collider | null {
  return (
    colliders.find((c) => c.kind === "ladder" && overlaps(box, c)) ?? null
  );
}

/** Every trigger the box currently overlaps. */
export function triggersAt(
  box: Box,
  colliders: readonly Collider[],
): Collider[] {
  return colliders.filter((c) => c.kind === "trigger" && overlaps(box, c));
}
