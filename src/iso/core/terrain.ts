/**
 * Ground height.
 *
 * The town started perfectly flat, which was fine while everything stood on
 * one plane. A stepped terrace needs the walker to actually be at the height
 * of whatever they are standing on, so the ground becomes a set of raised
 * slabs and this answers "how high is the floor here".
 *
 * Kept deliberately simple: slabs are axis-aligned and never overhang, so the
 * answer is just the highest slab covering the point. No need for a height
 * field, and it stays exact rather than sampled.
 */

export interface Platform {
  id: string;
  /** Minimum corner on the ground plane. */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Height of the walking surface. */
  y: number;
}

export function contains(p: Platform, x: number, z: number): boolean {
  return x >= p.x && x <= p.x + p.w && z >= p.z && z <= p.z + p.d;
}

export function groundHeightAt(
  x: number,
  z: number,
  platforms: readonly Platform[],
): number {
  let height = 0;
  for (const platform of platforms) {
    if (platform.y > height && contains(platform, x, z)) height = platform.y;
  }
  return height;
}

/** The platform the point is standing on, if it is above ground level. */
export function platformAt(
  x: number,
  z: number,
  platforms: readonly Platform[],
): Platform | null {
  let best: Platform | null = null;
  for (const platform of platforms) {
    if (!contains(platform, x, z)) continue;
    if (!best || platform.y > best.y) best = platform;
  }
  return best;
}

/**
 * Is there ground to stand on here?
 *
 * With the world broken into islands this is what keeps the walker out of the
 * water. Anywhere not covered by a platform — island, bridge or terrace step —
 * is simply not somewhere you can be.
 */
export function isWalkable(
  x: number,
  z: number,
  platforms: readonly Platform[],
): boolean {
  return platforms.some((p) => contains(p, x, z));
}
