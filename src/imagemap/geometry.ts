import type { MapLayout, Point, Shape } from "./types";

/**
 * The geometry the character walks on.
 *
 * Pure functions over normalised points, so the whole movement rule can be
 * tested without a browser: a position is legal when it is inside some walkable
 * shape and inside no blocking one.
 */

/**
 * Even-odd ray casting.
 *
 * Handles concave outlines, which matters here: an island with a bite taken
 * out of it for a waterfall is not convex, and the cheaper convex tests would
 * quietly let the character walk over the gap.
 */
export function insidePolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];

    const straddles = a.y > point.y !== b.y > point.y;
    if (!straddles) continue;

    const crossingX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (point.x < crossingX) inside = !inside;
  }

  return inside;
}

/** True when the point is on ground the character may stand on. */
export function isWalkable(point: Point, shapes: readonly Shape[]): boolean {
  let onGround = false;

  for (const shape of shapes) {
    if (shape.points.length < 3) continue;
    if (!insidePolygon(point, shape.points)) continue;
    // A block wins outright, wherever it sits in the list.
    if (shape.kind === "block") return false;
    onGround = true;
  }

  return onGround;
}

/**
 * Distance as seen on screen, expressed in units of image width.
 *
 * Normalised coordinates are not isotropic: one unit along x is `image.width`
 * pixels and one along y is `image.height`. Comparing them directly makes a
 * hotspot's catchment an ellipse squashed vertically — roughly half as tall as
 * the circle drawn for it — so walking up to something from above misses it.
 */
function screenDistance(a: Point, b: Point, aspect: number): number {
  const dx = a.x - b.x;
  const dy = (a.y - b.y) / aspect;
  return Math.hypot(dx, dy);
}

/**
 * The furthest part of an intended step that still lands on ground.
 *
 * Tries the whole move, then each axis alone, so walking into the edge of a
 * platform slides along it instead of stopping dead — the same rule the
 * isometric version used, and the thing that makes edges feel solid rather
 * than sticky.
 */
export function stepTowards(
  from: Point,
  to: Point,
  shapes: readonly Shape[],
): Point {
  if (isWalkable(to, shapes)) return to;

  const alongX = { x: to.x, y: from.y };
  if (isWalkable(alongX, shapes)) return alongX;

  const alongY = { x: from.x, y: to.y };
  if (isWalkable(alongY, shapes)) return alongY;

  return from;
}

/** The hotspot the character is standing on, if any. */
export function hotspotAt(point: Point, layout: MapLayout) {
  const aspect = layout.image.width / (layout.image.height || 1);
  let best: MapLayout["hotspots"][number] | null = null;
  let bestDistance = Infinity;

  for (const hotspot of layout.hotspots) {
    const distance = screenDistance(point, hotspot.at, aspect);
    if (distance > hotspot.radius) continue;
    if (distance < bestDistance) {
      best = hotspot;
      bestDistance = distance;
    }
  }

  return best;
}

/** Any point on walkable ground, for a spawn when none was authored. */
export function firstWalkablePoint(layout: MapLayout): Point | null {
  if (layout.spawn && isWalkable(layout.spawn, layout.shapes)) return layout.spawn;

  const walk = layout.shapes.find((s) => s.kind === "walk" && s.points.length >= 3);
  if (!walk) return null;

  // The centroid of an outline can fall outside a concave one, so it is
  // checked rather than trusted.
  const centre = walk.points.reduce(
    (sum, p) => ({ x: sum.x + p.x / walk.points.length, y: sum.y + p.y / walk.points.length }),
    { x: 0, y: 0 },
  );
  return isWalkable(centre, layout.shapes) ? centre : walk.points[0];
}
