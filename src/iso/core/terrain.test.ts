import { beforeEach, describe, expect, it } from "vitest";
import { input, resetInput } from "@/game/core/input";
import { groundHeightAt } from "./terrain";
import { placeWalker, resetIsoClock, simulateWalk, walker } from "../player/walker";
import { BLOCKERS, LANDINGS, PLATFORMS } from "../world/map";

const FRAME = 1 / 60;

function walk(moveX: number, moveY: number, seconds: number) {
  input.moveX = moveX;
  input.moveY = moveY;
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i += 1) simulateWalk(FRAME, BLOCKERS, PLATFORMS);
}

beforeEach(() => {
  resetInput();
  resetIsoClock();
  placeWalker(0, 6);
});

describe("ground height", () => {
  it("is zero out on the grass", () => {
    expect(groundHeightAt(48, 44, PLATFORMS)).toBe(0);
  });

  it("matches each landing at its centre", () => {
    for (const landing of LANDINGS) {
      expect(groundHeightAt(landing.x, landing.z, PLATFORMS)).toBeCloseTo(
        landing.y,
        5,
      );
    }
  });
});

describe("the terrace", () => {
  it("climbs in steps small enough to walk", () => {
    for (let i = 1; i < LANDINGS.length; i += 1) {
      const rise = LANDINGS[i].y - LANDINGS[i - 1].y;
      expect(rise).toBeGreaterThan(0);
      expect(rise).toBeLessThan(0.6);
    }
  });

  it("stays a gentle climb overall", () => {
    const total = LANDINGS[LANDINGS.length - 1].y - LANDINGS[0].y;
    // The whole career should be a terrace, not a hill.
    expect(total).toBeLessThan(4);
  });

  it("turns a corner rather than running in one line", () => {
    const xs = new Set(LANDINGS.map((l) => Math.round(l.x)));
    const zs = new Set(LANDINGS.map((l) => Math.round(l.z)));
    // An L uses more than one value on both axes.
    expect(xs.size).toBeGreaterThan(1);
    expect(zs.size).toBeGreaterThan(1);
  });

  it("lifts the walker as they climb the first arm", () => {
    // The terrace's arms follow the world grid, which the isometric camera
    // turns 45 degrees on screen — so climbing is a diagonal press, exactly as
    // it is in every game of this kind. Up-and-right runs straight up the arm.
    placeWalker(LANDINGS[0].x, LANDINGS[0].z + 3);
    walk(1, 1, 6);
    expect(walker.y).toBeGreaterThan(1.5);
  });

  it("keeps climbing around the corner onto the second arm", () => {
    placeWalker(LANDINGS[0].x, LANDINGS[0].z + 3);
    walk(1, 1, 6);
    const atCorner = walker.y;

    // The second leg runs the other way along the grid: down-and-right.
    walk(1, -1, 6);
    expect(walker.y).toBeGreaterThan(atCorner);
    expect(walker.y).toBeCloseTo(LANDINGS[LANDINGS.length - 1].y, 1);
  });

  it("does not let the walker fall off the top of the terrace", () => {
    const top = LANDINGS[LANDINGS.length - 1];
    placeWalker(top.x, top.z);
    // Shove hard against every edge in turn.
    for (const [mx, my] of [[1, 1], [-1, -1], [1, -1], [-1, 1], [0, 1], [0, -1]]) {
      walk(mx, my, 2.5);
      expect({ push: `${mx},${my}`, y: walker.y > 1 }).toEqual({
        push: `${mx},${my}`,
        y: true,
      });
      placeWalker(top.x, top.z, top.y);
    }
  });

  it("settles exactly onto a landing, never between two", () => {
    const landing = LANDINGS[3];
    placeWalker(landing.x, landing.z);
    walk(0, 0, 1.5);
    expect(walker.y).toBeCloseTo(landing.y, 2);
  });
});
