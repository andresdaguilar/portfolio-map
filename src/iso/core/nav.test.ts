import { describe, expect, it } from "vitest";
import { ISO_CAMERA, WALKER } from "./constants";
import { type Footprint, overlapsCircle, resolve, screenToWorld } from "./nav";

describe("screenToWorld", () => {
  it("sends 'up' away from the camera, not along a world axis", () => {
    const up = screenToWorld(0, 1, ISO_CAMERA.azimuth);
    // With the camera yawed 45 degrees, screen-up is a diagonal in world space.
    expect(up.x).toBeLessThan(0);
    expect(up.z).toBeLessThan(0);
    expect(Math.hypot(up.x, up.z)).toBeCloseTo(1, 5);
  });

  it("sends 'right' opposite to 'left'", () => {
    const right = screenToWorld(1, 0, ISO_CAMERA.azimuth);
    const left = screenToWorld(-1, 0, ISO_CAMERA.azimuth);
    expect(right.x).toBeCloseTo(-left.x, 5);
    expect(right.z).toBeCloseTo(-left.z, 5);
  });

  it("does not let diagonals outrun the cardinals", () => {
    const diagonal = screenToWorld(1, 1, ISO_CAMERA.azimuth);
    const straight = screenToWorld(1, 0, ISO_CAMERA.azimuth);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(
      Math.hypot(straight.x, straight.z),
      5,
    );
  });

  it("stays still with no input", () => {
    const still = screenToWorld(0, 0, ISO_CAMERA.azimuth);
    expect(still.x).toBeCloseTo(0, 10);
    expect(still.z).toBeCloseTo(0, 10);
  });
});

describe("resolve", () => {
  const box: Footprint[] = [{ x: -2, z: -2, w: 4, d: 4 }];

  it("leaves a circle clear of a building alone", () => {
    const out = resolve(8, 8, 0.5, box);
    expect(out).toEqual({ x: 8, z: 8 });
  });

  it("pushes a circle out to exactly the radius", () => {
    const out = resolve(2.2, 0, 0.5, box);
    expect(out.x).toBeCloseTo(2.5, 5);
    expect(out.z).toBeCloseTo(0, 5);
  });

  it("never leaves the circle overlapping", () => {
    for (const [x, z] of [[0, 0], [1.9, 1.9], [-2.1, 0.5], [0, 2.3]]) {
      const out = resolve(x, z, 0.5, box);
      expect(overlapsCircle(box[0], out.x, out.z, 0.5 - 1e-6)).toBe(false);
    }
  });

  it("escapes from dead centre rather than getting stuck", () => {
    const out = resolve(0, 0, 0.5, box);
    expect(overlapsCircle(box[0], out.x, out.z, 0.5 - 1e-6)).toBe(false);
  });

  it("threads a gap wide enough to pass", () => {
    // An alley two diameters across: the walker must end up clear of both.
    const alley = WALKER.radius * 4;
    const pair: Footprint[] = [
      { x: -4, z: -2, w: 4, d: 4 },
      { x: alley, z: -2, w: 4, d: 4 },
    ];
    const out = resolve(alley / 2, 0, WALKER.radius, pair);
    for (const rect of pair) {
      expect(overlapsCircle(rect, out.x, out.z, WALKER.radius - 1e-3)).toBe(false);
    }
  });
});
