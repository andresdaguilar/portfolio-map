import { describe, expect, it } from "vitest";
import { WALK_SPEED } from "./character";
import {
  DEAD_ZONE_PX,
  DRAG_SLOP_PX,
  FULL_TILT_PX,
  HOLD_MS,
  isSteering,
  steerTowards,
} from "./steer";

const HIM = { x: 200, y: 400 };

/** Where `advance` would send him: the intent, normalised. */
function heading(from: typeof HIM, to: typeof HIM) {
  const { intent } = steerTowards(from, to);
  const length = Math.hypot(intent.x, intent.y);
  return { x: intent.x / length, y: intent.y / length };
}

describe("steering with a held pointer", () => {
  it("stands still when the finger is on top of him", () => {
    expect(steerTowards(HIM, HIM)).toEqual({ intent: { x: 0, y: 0 }, speed: 0 });
  });

  it("stands still anywhere inside the dead zone", () => {
    const justInside = { x: HIM.x + DEAD_ZONE_PX - 1, y: HIM.y };

    expect(steerTowards(HIM, justInside).speed).toBe(0);
  });

  it("walks towards the finger", () => {
    expect(heading(HIM, { x: 400, y: 400 })).toEqual({ x: 1, y: 0 });
    expect(heading(HIM, { x: 200, y: 100 })).toEqual({ x: 0, y: -1 });
  });

  it("turns as the finger slides, without being let go", () => {
    const right = heading(HIM, { x: 400, y: 400 });
    const down = heading(HIM, { x: 200, y: 600 });

    expect(right).not.toEqual(down);
    expect(down.y).toBeGreaterThan(0);
  });

  it("ramps the pace with how far the stick is pushed", () => {
    const nudge = steerTowards(HIM, { x: HIM.x + DEAD_ZONE_PX + 10, y: HIM.y });
    const shove = steerTowards(HIM, { x: HIM.x + FULL_TILT_PX - 10, y: HIM.y });

    expect(nudge.speed).toBeGreaterThan(0);
    expect(nudge.speed).toBeLessThan(shove.speed);
    expect(shove.speed).toBeLessThan(WALK_SPEED);
  });

  it("reaches full pace at the stop and never passes it", () => {
    const atStop = steerTowards(HIM, { x: HIM.x + FULL_TILT_PX, y: HIM.y });
    const farAway = steerTowards(HIM, { x: HIM.x + 4000, y: HIM.y });

    expect(atStop.speed).toBeCloseTo(WALK_SPEED, 10);
    expect(farAway.speed).toBeCloseTo(WALK_SPEED, 10);
  });

  it("ramps from a standstill at the edge of the dead zone", () => {
    const edge = steerTowards(HIM, { x: HIM.x + DEAD_ZONE_PX + 0.001, y: HIM.y });

    expect(edge.speed).toBeGreaterThan(0);
    expect(edge.speed).toBeLessThan(WALK_SPEED / 10);
  });

  it("honours a slower base pace", () => {
    const half = steerTowards(HIM, { x: HIM.x + 4000, y: HIM.y }, WALK_SPEED / 2);

    expect(half.speed).toBeCloseTo(WALK_SPEED / 2, 10);
  });
});

describe("telling a tap from a hold", () => {
  const down = { x: 100, y: 100 };

  it("is a tap while the finger is still and the press is short", () => {
    expect(isSteering(down, down, HOLD_MS - 1)).toBe(false);
  });

  it("becomes a stick once the press outlasts the threshold", () => {
    expect(isSteering(down, down, HOLD_MS)).toBe(true);
  });

  it("becomes a stick immediately if the finger is already dragging", () => {
    const dragged = { x: down.x + DRAG_SLOP_PX + 1, y: down.y };

    expect(isSteering(down, dragged, 0)).toBe(true);
  });

  it("does not mistake a shaky tap for a drag", () => {
    const wobble = { x: down.x + 3, y: down.y - 4 };

    expect(isSteering(down, wobble, 20)).toBe(false);
  });
});
