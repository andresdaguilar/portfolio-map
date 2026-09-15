import type { Platform } from "../core/terrain";

/**
 * The archipelago.
 *
 * Six islands around a central plaza, with water between them and bridges
 * across. Separating the areas does more than decorate: it makes each district
 * a place you arrive at rather than a patch of the same lawn, and the water
 * gives the map an edge so the visitor always knows where the world stops.
 */

export interface Island {
  id: string;
  /** Centre on the ground plane. */
  x: number;
  z: number;
  w: number;
  d: number;
}

/**
 * Screen directions, given the camera's 45-degree yaw: -X is up-left on
 * screen, -Z is up-right, +Z is down-left and +X is down-right.
 *
 * Kept tight on purpose. The whole point is that the map fits on screen at
 * once, so every extra unit of water is a unit of nothing that has to be
 * framed alongside the things worth looking at.
 */
export const ISLANDS: Island[] = [
  { id: "plaza", x: 0, z: 0, w: 17, d: 17 },
  { id: "education", x: -20, z: -20, w: 26, d: 21 },
  { id: "work", x: -40, z: 5, w: 27, d: 27 },
  { id: "studio", x: 6, z: -40, w: 23, d: 21 },
  { id: "library", x: -6, z: 34, w: 25, d: 20 },
  { id: "commons", x: 25, z: 25, w: 21, d: 20 },
  { id: "yards", x: 39, z: -5, w: 23, d: 25 },
];

export const island = (id: string) => ISLANDS.find((i) => i.id === id)!;

/** The island as a walkable platform. */
function asPlatform(i: Island): Platform {
  return { id: `island-${i.id}`, x: i.x - i.w / 2, z: i.z - i.d / 2, w: i.w, d: i.d, y: 0 };
}

/**
 * A walkway between two points, as a chain of overlapping squares.
 *
 * Ground height is answered from axis-aligned rectangles, so a diagonal bridge
 * is approximated rather than modelled. Stepping squares along the line keeps
 * the walkable area honest — it is exactly what the player can stand on — and
 * the visible planks are drawn separately, rotated properly.
 */
export function bridgePlatforms(
  id: string,
  from: { x: number; z: number },
  to: { x: number; z: number },
  width = 3.6,
): Platform[] {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  const steps = Math.max(2, Math.ceil(length / (width * 0.45)));

  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const cx = from.x + dx * t;
    const cz = from.z + dz * t;
    return {
      id: `${id}-${i}`,
      x: cx - width / 2,
      z: cz - width / 2,
      w: width,
      d: width,
      y: 0,
    };
  });
}

export interface Bridge {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
}

/** Where each bridge starts and ends: the near edges of the two islands. */
function edgeToward(from: Island, to: Island, inset = 1.5) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz) || 1;
  // Step out to roughly the island's boundary along the line between them.
  const scale =
    Math.min(
      from.w / 2 / Math.max(Math.abs(dx) / length, 1e-6),
      from.d / 2 / Math.max(Math.abs(dz) / length, 1e-6),
    ) - inset;
  return { x: from.x + (dx / length) * scale, z: from.z + (dz / length) * scale };
}

const plaza = island("plaza");

export const BRIDGES: Bridge[] = ISLANDS.filter((i) => i.id !== "plaza").map(
  (target) => ({
    id: `bridge-${target.id}`,
    from: edgeToward(plaza, target),
    to: edgeToward(target, plaza),
    width: 3.6,
  }),
);

export const ISLAND_PLATFORMS: Platform[] = [
  ...ISLANDS.map(asPlatform),
  ...BRIDGES.flatMap((b) => bridgePlatforms(b.id, b.from, b.to, b.width)),
];
