/**
 * Movement and collision on the ground plane.
 *
 * The player is a circle and the world is a set of axis-aligned footprints.
 * A circle is the right shape here: in a top-down world you constantly brush
 * past corners, and a box catches on them while a circle slides. Resolution is
 * a push-out along the shortest escape, which is stable and cheap enough to run
 * against every footprint each step.
 */

export interface Footprint {
  /** Minimum corner on the ground plane. */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Set on footprints that only mark a place rather than block it. */
  id?: string;
}

export interface Point {
  x: number;
  z: number;
}

/** Closest point to (px, pz) on the rectangle. */
function closestOn(rect: Footprint, px: number, pz: number): Point {
  return {
    x: Math.min(Math.max(px, rect.x), rect.x + rect.w),
    z: Math.min(Math.max(pz, rect.z), rect.z + rect.d),
  };
}

export function overlapsCircle(
  rect: Footprint,
  px: number,
  pz: number,
  radius: number,
): boolean {
  const near = closestOn(rect, px, pz);
  return Math.hypot(px - near.x, pz - near.z) < radius;
}

/**
 * Pushes a circle out of every footprint it is inside.
 *
 * Runs a couple of passes because escaping one building can push the player
 * into its neighbour; two is enough for the spacing this map uses and keeps
 * the cost flat.
 */
export function resolve(
  px: number,
  pz: number,
  radius: number,
  blockers: readonly Footprint[],
  passes = 2,
): Point {
  let x = px;
  let z = pz;

  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false;

    for (const rect of blockers) {
      const near = closestOn(rect, x, z);
      const dx = x - near.x;
      const dz = z - near.z;
      const distance = Math.hypot(dx, dz);

      if (distance >= radius) continue;
      moved = true;

      if (distance > 1e-6) {
        // Outside the rectangle: push straight away from the nearest edge.
        const scale = (radius - distance) / distance;
        x += dx * scale;
        z += dz * scale;
        continue;
      }

      // Dead centre inside the rectangle — there is no direction to push
      // along, so leave by the nearest face.
      const left = x - rect.x;
      const right = rect.x + rect.w - x;
      const top = z - rect.z;
      const bottom = rect.z + rect.d - z;
      const shortest = Math.min(left, right, top, bottom);

      if (shortest === left) x = rect.x - radius;
      else if (shortest === right) x = rect.x + rect.w + radius;
      else if (shortest === top) z = rect.z - radius;
      else z = rect.z + rect.d + radius;
    }

    if (!moved) break;
  }

  return { x, z };
}

/**
 * Turns screen-space input into world-space movement.
 *
 * The camera is rotated, so "up" on the keyboard is not -Z in the world. This
 * is the one piece of maths that makes an isometric game feel right: press up,
 * go up the screen, whatever the world's axes are doing underneath.
 */
export function screenToWorld(
  moveX: number,
  moveY: number,
  azimuth: number,
): Point {
  const sin = Math.sin(azimuth);
  const cos = Math.cos(azimuth);

  // Screen right and screen "into the distance", both on the ground plane.
  const x = moveX * cos - moveY * sin;
  const z = -moveX * sin - moveY * cos;

  const length = Math.hypot(x, z);
  // Diagonals must not be faster than the cardinals.
  return length > 1 ? { x: x / length, z: z / length } : { x, z };
}
