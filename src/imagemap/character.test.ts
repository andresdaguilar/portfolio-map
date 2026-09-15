import { describe, expect, it } from "vitest";
import {
  advance,
  createCharacter,
  directionFor,
  intentTowards,
  WALK_SPEED,
} from "./character";
import type { Shape } from "./types";

/** A 16:9 image, like the map. */
const ASPECT = 1672 / 941;

const open: Shape[] = [
  { id: "ground", kind: "walk", points: [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
  ] },
];

describe("advance", () => {
  it("stands still with no intent", () => {
    const start = createCharacter({ x: 0.5, y: 0.5 });
    const next = advance(start, { x: 0, y: 0 }, 1 / 60, open, ASPECT);
    expect(next.at).toEqual(start.at);
    expect(next.moving).toBe(false);
  });

  it("covers the same screen distance horizontally and vertically", () => {
    const start = createCharacter({ x: 0.5, y: 0.5 });
    const right = advance(start, { x: 1, y: 0 }, 1, open, ASPECT);
    const down = advance(start, { x: 0, y: 1 }, 1, open, ASPECT);

    // In pixels, not in normalised units: that is the whole point.
    const acrossPx = (right.at.x - start.at.x) * 1672;
    const downPx = (down.at.y - start.at.y) * 941;
    expect(acrossPx).toBeCloseTo(downPx, 4);
  });

  it("does not let a diagonal outrun a straight line", () => {
    const start = createCharacter({ x: 0.5, y: 0.5 });
    const straight = advance(start, { x: 1, y: 0 }, 1, open, ASPECT);
    const diagonal = advance(start, { x: 1, y: 1 }, 1, open, ASPECT);

    const distance = (c: typeof straight) =>
      Math.hypot((c.at.x - start.at.x) * 1672, (c.at.y - start.at.y) * 941);
    expect(distance(diagonal)).toBeCloseTo(distance(straight), 4);
  });

  it("walks at the speed it says it does", () => {
    const start = createCharacter({ x: 0.2, y: 0.5 });
    const after = advance(start, { x: 1, y: 0 }, 1, open, ASPECT);
    expect(after.at.x - start.at.x).toBeCloseTo(WALK_SPEED, 6);
  });

  it("faces the way it is going, and keeps facing that way when it stops", () => {
    let c = createCharacter({ x: 0.5, y: 0.5 });
    c = advance(c, { x: -1, y: 0 }, 0.1, open, ASPECT);
    expect(c.facing).toBe(-1);
    c = advance(c, { x: 0, y: 0 }, 0.1, open, ASPECT);
    expect(c.facing).toBe(-1);
  });

  it("advances the stride with distance, not with time", () => {
    const start = createCharacter({ x: 0.2, y: 0.5 });
    const walked = advance(start, { x: 1, y: 0 }, 0.5, open, ASPECT);
    const stood = advance(start, { x: 0, y: 0 }, 5, open, ASPECT);
    expect(walked.phase).toBeGreaterThan(0);
    expect(stood.phase).toBe(start.phase);
  });

  it("stops at the edge of the ground instead of walking off it", () => {
    const island: Shape[] = [
      { id: "i", kind: "walk", points: [
        { x: 0.4, y: 0.4 }, { x: 0.6, y: 0.4 }, { x: 0.6, y: 0.6 }, { x: 0.4, y: 0.6 },
      ] },
    ];
    let c = createCharacter({ x: 0.5, y: 0.5 });
    for (let i = 0; i < 300; i += 1) c = advance(c, { x: 1, y: 0 }, 1 / 60, island, ASPECT);
    expect(c.at.x).toBeLessThanOrEqual(0.6);
    expect(c.at.x).toBeGreaterThan(0.4);
  });
});

describe("intentTowards", () => {
  it("points at the target", () => {
    const intent = intentTowards({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }, ASPECT);
    expect(intent.x).toBeGreaterThan(0);
    expect(intent.y).toBeCloseTo(0, 6);
  });

  it("gives up once it has arrived", () => {
    const intent = intentTowards({ x: 0.5, y: 0.5 }, { x: 0.5005, y: 0.5 }, ASPECT);
    expect(intent).toEqual({ x: 0, y: 0 });
  });

  it("arrives rather than orbiting the target", () => {
    const target = { x: 0.8, y: 0.62 };
    let c = createCharacter({ x: 0.2, y: 0.4 });
    for (let i = 0; i < 2000; i += 1) {
      const intent = intentTowards(c.at, target, ASPECT);
      if (intent.x === 0 && intent.y === 0) break;
      c = advance(c, intent, 1 / 60, open, ASPECT);
    }
    expect(Math.hypot(c.at.x - target.x, (c.at.y - target.y) / ASPECT)).toBeLessThan(0.01);
  });
});

describe("directionFor", () => {
  it("turns to the side when the heading is mostly sideways", () => {
    expect(directionFor(1, 0.2)).toBe("right");
    expect(directionFor(-1, -0.2)).toBe("left");
  });

  it("faces the viewer walking down the screen, away walking up", () => {
    expect(directionFor(0.2, 1)).toBe("front");
    expect(directionFor(-0.2, -1)).toBe("back");
  });

  it("prefers a side view on an exact diagonal", () => {
    // The map's paths run diagonally, so the tie has to fall somewhere; the
    // side poses are the only ones with a walk cycle, so they win.
    expect(directionFor(0.7071, 0.7071)).toBe("right");
    expect(directionFor(-0.7071, 0.7071)).toBe("left");
  });
});

describe("the direction the character holds", () => {
  const open: Shape[] = [
    { id: "ground", kind: "walk", points: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
    ] },
  ];

  it("keeps the last side it turned to while walking up or down", () => {
    let c = createCharacter({ x: 0.5, y: 0.5 });
    c = advance(c, { x: -1, y: 0 }, 0.2, open, ASPECT);
    expect(c.direction).toBe("left");
    expect(c.lastSide).toBe("left");

    c = advance(c, { x: 0, y: -1 }, 0.2, open, ASPECT);
    expect(c.direction).toBe("back");
    // Only the sides have a cycle, so walking away still animates.
    expect(c.lastSide).toBe("left");
  });

  it("holds its pose when it stops", () => {
    let c = createCharacter({ x: 0.5, y: 0.5 });
    c = advance(c, { x: 0, y: 1 }, 0.2, open, ASPECT);
    expect(c.direction).toBe("front");
    c = advance(c, { x: 0, y: 0 }, 0.5, open, ASPECT);
    expect(c.direction).toBe("front");
    expect(c.moving).toBe(false);
  });
});
