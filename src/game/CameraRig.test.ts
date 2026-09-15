import { describe, expect, it } from "vitest";
import { CAMERA } from "./core/constants";
import { fovForAspect } from "./CameraRig";

/** How many world units are visible across at a given aspect ratio. */
function visibleWidth(aspect: number): number {
  const fov = fovForAspect(aspect);
  const halfHeight = CAMERA.distance * Math.tan((fov * Math.PI) / 360);
  return halfHeight * aspect * 2;
}

describe("fovForAspect", () => {
  it("keeps the long lens on a widescreen desktop", () => {
    expect(fovForAspect(16 / 9)).toBeLessThanOrEqual(24);
  });

  it("frames a room rather than the void under its floor", () => {
    // Visible height on a landscape screen should be close to a room's 7.5
    // units, not double it, or the frame fills with dead space below the floor.
    for (const aspect of [4 / 3, 16 / 10, 16 / 9]) {
      const fov = fovForAspect(aspect);
      const visibleHeight = 2 * CAMERA.distance * Math.tan((fov * Math.PI) / 360);
      expect(visibleHeight).toBeLessThanOrEqual(CAMERA.maxVisibleHeight + 0.1);
    }
  });

  it("gives width priority over height on a phone held upright", () => {
    // The height cap must never be allowed to strangle the playable width.
    for (const aspect of [390 / 844, 375 / 812]) {
      const fov = fovForAspect(aspect);
      const halfHeight = CAMERA.distance * Math.tan((fov * Math.PI) / 360);
      expect(halfHeight * aspect * 2).toBeGreaterThanOrEqual(
        CAMERA.minVisibleWidth - 0.1,
      );
    }
  });

  it("opens the lens on a phone held upright", () => {
    expect(fovForAspect(375 / 812)).toBeGreaterThan(40);
  });

  it("never exceeds the clamps", () => {
    for (const aspect of [0.3, 0.46, 0.75, 1, 1.33, 1.78, 2.4, 3.5]) {
      const fov = fovForAspect(aspect);
      expect(fov).toBeGreaterThanOrEqual(CAMERA.fovMin);
      expect(fov).toBeLessThanOrEqual(CAMERA.fovMax);
    }
  });

  it("shows a playable slice of world on every realistic screen", () => {
    // Portrait phone, landscape phone, tablet, laptop, ultrawide.
    for (const aspect of [375 / 812, 812 / 375, 4 / 3, 16 / 10, 21 / 9]) {
      expect(visibleWidth(aspect)).toBeGreaterThan(10);
    }
  });
});
