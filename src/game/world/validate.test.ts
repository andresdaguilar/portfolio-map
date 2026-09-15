import { describe, expect, it } from "vitest";
import type { Collider } from "../core/collision";
import { findLadderTraps } from "./validate";
import { GREYBOX } from "./zones/greybox";

describe("findLadderTraps", () => {
  it("flags a ladder running into a solid floor", () => {
    const level: Collider[] = [
      { x: 0, y: 0, w: 1, h: 8, kind: "ladder" },
      { x: -4, y: 5, w: 12, h: 0.5, kind: "solid" },
    ];
    expect(findLadderTraps(level)).toHaveLength(1);
  });

  it("accepts a floor with a hatch cut for the ladder", () => {
    const level: Collider[] = [
      { x: 0, y: 0, w: 1, h: 8, kind: "ladder" },
      { x: -4, y: 5, w: 3.5, h: 0.5, kind: "solid" },
      { x: 1.5, y: 5, w: 6, h: 0.5, kind: "solid" },
    ];
    expect(findLadderTraps(level)).toEqual([]);
  });

  it("passes the greybox", () => {
    expect(findLadderTraps(GREYBOX)).toEqual([]);
  });
});

describe("the building", () => {
  it("has no ladder traps", async () => {
    const { BUILDING } = await import("./zones/building");
    expect(findLadderTraps(BUILDING)).toEqual([]);
  });

  it("joins every station with stairs the player can actually walk up", async () => {
    const { STATIONS, makeStairs, STAIR_RUN } = await import("./zones/building");
    const { PLAYER } = await import("../core/constants");

    for (let i = 0; i < STATIONS.length - 1; i += 1) {
      const from = STATIONS[i];
      const to = STATIONS[i + 1];
      const steps = makeStairs(
        from.x + from.width,
        from.floorY,
        to.floorY,
        STAIR_RUN,
      );

      // Each tread must be within one step of the previous one, including the
      // first step up off the lower floor.
      let previousTop = from.floorY;
      for (const step of steps) {
        const top = step.y + step.h;
        expect(top - previousTop).toBeLessThanOrEqual(PLAYER.stepHeight);
        previousTop = top;
      }
      expect(previousTop).toBeCloseTo(to.floorY, 5);
    }
  });

  it("climbs monotonically from first job to last", async () => {
    const { STATIONS } = await import("./zones/building");
    for (let i = 1; i < STATIONS.length; i += 1) {
      expect(STATIONS[i].floorY).toBeGreaterThan(STATIONS[i - 1].floorY);
    }
  });
});
