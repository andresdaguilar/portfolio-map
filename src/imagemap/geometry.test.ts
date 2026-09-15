import { describe, expect, it } from "vitest";
import { hotspotAt, insidePolygon, isWalkable, stepTowards } from "./geometry";
import type { MapLayout, Shape } from "./types";

const square = (x: number, y: number, size: number) => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size },
];

describe("insidePolygon", () => {
  const box = square(0.2, 0.2, 0.4);

  it("finds a point in the middle", () => {
    expect(insidePolygon({ x: 0.4, y: 0.4 }, box)).toBe(true);
  });

  it("rejects a point outside", () => {
    expect(insidePolygon({ x: 0.8, y: 0.4 }, box)).toBe(false);
  });

  it("handles a concave outline", () => {
    // An L: the notch must not count as inside.
    const ell = [
      { x: 0, y: 0 },
      { x: 0.6, y: 0 },
      { x: 0.6, y: 0.2 },
      { x: 0.2, y: 0.2 },
      { x: 0.2, y: 0.6 },
      { x: 0, y: 0.6 },
    ];
    expect(insidePolygon({ x: 0.1, y: 0.1 }, ell)).toBe(true);
    expect(insidePolygon({ x: 0.4, y: 0.4 }, ell)).toBe(false);
  });
});

describe("isWalkable", () => {
  const shapes: Shape[] = [
    { id: "island", kind: "walk", points: square(0.1, 0.1, 0.5) },
    { id: "fountain", kind: "block", points: square(0.25, 0.25, 0.1) },
  ];

  it("allows ground inside a walkable shape", () => {
    expect(isWalkable({ x: 0.15, y: 0.15 }, shapes)).toBe(true);
  });

  it("refuses open water", () => {
    expect(isWalkable({ x: 0.9, y: 0.9 }, shapes)).toBe(false);
  });

  it("refuses a hole punched in the ground", () => {
    expect(isWalkable({ x: 0.3, y: 0.3 }, shapes)).toBe(false);
  });

  it("lets a block win wherever it sits in the list", () => {
    const reordered = [shapes[1], shapes[0]];
    expect(isWalkable({ x: 0.3, y: 0.3 }, reordered)).toBe(false);
  });

  it("treats a bridge as ground like anything else", () => {
    const withBridge: Shape[] = [
      ...shapes,
      { id: "bridge", kind: "walk", points: square(0.6, 0.3, 0.2) },
    ];
    expect(isWalkable({ x: 0.7, y: 0.4 }, withBridge)).toBe(true);
  });
});

describe("stepTowards", () => {
  const shapes: Shape[] = [
    { id: "island", kind: "walk", points: square(0.1, 0.1, 0.5) },
  ];

  it("takes the whole step when it lands on ground", () => {
    const to = { x: 0.3, y: 0.3 };
    expect(stepTowards({ x: 0.2, y: 0.2 }, to, shapes)).toEqual(to);
  });

  it("slides along an edge rather than stopping dead", () => {
    // Pushing diagonally off the right edge should still move down.
    const from = { x: 0.58, y: 0.3 };
    const moved = stepTowards(from, { x: 0.63, y: 0.35 }, shapes);
    expect(moved.x).toBeCloseTo(from.x, 6);
    expect(moved.y).toBeCloseTo(0.35, 6);
  });

  it("refuses to leave the ground at a corner", () => {
    const from = { x: 0.59, y: 0.59 };
    expect(stepTowards(from, { x: 0.65, y: 0.65 }, shapes)).toEqual(from);
  });
});

describe("hotspotAt", () => {
  const layout: MapLayout = {
    image: { width: 1000, height: 600 },
    shapes: [],
    hotspots: [
      { id: "library", at: { x: 0.2, y: 0.5 }, radius: 0.05, label: "Library" },
      { id: "hobbies", at: { x: 0.5, y: 0.7 }, radius: 0.05, label: "Hobbies" },
    ],
  };

  it("finds the one being stood on", () => {
    expect(hotspotAt({ x: 0.21, y: 0.51 }, layout)?.id).toBe("library");
  });

  it("finds nothing in between", () => {
    expect(hotspotAt({ x: 0.35, y: 0.6 }, layout)).toBeNull();
  });

  it("catches you from above as readily as from the side", () => {
    // The radius is drawn as a circle on screen, so it has to behave like one.
    // In normalised units a vertical offset covers nearly twice the screen
    // distance of the same horizontal one on a 16:9 image.
    const aspect = layout.image.width / layout.image.height;
    const spot = layout.hotspots[0];

    const fromSide = { x: spot.at.x + spot.radius * 0.8, y: spot.at.y };
    const fromAbove = { x: spot.at.x, y: spot.at.y - spot.radius * 0.8 * aspect };

    expect(hotspotAt(fromSide, layout)?.id).toBe("library");
    expect(hotspotAt(fromAbove, layout)?.id).toBe("library");
  });

  it("still lets go once you are properly outside it", () => {
    const aspect = layout.image.width / layout.image.height;
    const spot = layout.hotspots[0];
    const wellAbove = { x: spot.at.x, y: spot.at.y - spot.radius * 1.6 * aspect };
    expect(hotspotAt(wellAbove, layout)).toBeNull();
  });

  it("picks the nearest when two overlap", () => {
    const crowded: MapLayout = {
      ...layout,
      hotspots: [
        { id: "far", at: { x: 0.3, y: 0.5 }, radius: 0.2, label: "Far" },
        { id: "near", at: { x: 0.22, y: 0.5 }, radius: 0.2, label: "Near" },
      ],
    };
    expect(hotspotAt({ x: 0.2, y: 0.5 }, crowded)?.id).toBe("near");
  });
});
