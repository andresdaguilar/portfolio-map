import type { Collider } from "../../core/collision";

/**
 * A test fixture, not a shipping zone. Nothing renders it any more — the real
 * world lives in `building.ts`. It stays because the physics tests are written
 * against it, and a controller regression should fail here before anyone
 * notices it in a room with a company logo on the wall.
 *
 * Exists to prove the controller before any art does: flat ground to feel the
 * acceleration ramp, a gap sized just inside a running jump, steps to read
 * jump height against, a one-way platform, and a ladder to a mezzanine.
 *
 * Distances are derived, not guessed. With jumpVelocity 10 and gravity 26 the
 * apex is ~1.9 units and the airtime ~0.77s, so a running jump covers ~4.3
 * units. The gap is 3 — clearable, but you have to mean it.
 */
export const GREYBOX: Collider[] = [
  { x: -20, y: -1, w: 36, h: 1, kind: "solid" },
  { x: 19, y: -1, w: 30, h: 1, kind: "solid" },

  // Steps: the first is a stride, the second needs a jump.
  { x: 6, y: 0, w: 3, h: 0.6, kind: "solid" },
  { x: 10, y: 0, w: 3, h: 1.4, kind: "solid" },

  // One-way platform, reachable from the tall step but not from the floor.
  { x: 24, y: 2.6, w: 5, h: 0.3, kind: "platform" },
  { x: 21.5, y: 0, w: 2, h: 1.1, kind: "solid" },

  // Ladder to the mezzanine. It overshoots the floor so the player can step
  // off at the top, and the floor has a hatch cut where it comes through.
  { x: 34, y: 0, w: 1, h: 7.4, kind: "ladder" },
  { x: 32, y: 6, w: 1.7, h: 0.5, kind: "solid" },
  { x: 35.3, y: 6, w: 8.7, h: 0.5, kind: "solid" },

  // Walls at both ends.
  { x: 46, y: 0, w: 1, h: 8, kind: "solid" },
  { x: -21, y: -1, w: 1, h: 10, kind: "solid" },
];

/** Where the player spawns in the greybox. */
export const GREYBOX_SPAWN = { x: -14, y: 0 };
