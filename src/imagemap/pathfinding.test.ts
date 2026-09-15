import { describe, expect, it } from "vitest";
import { buildGrid, findPath, nearestOpenCell, smoothPath } from "./pathfinding";
import { isWalkable } from "./geometry";
import layout from "./layout.json";
import type { MapLayout, Shape } from "./types";

const ASPECT = 16 / 9;

/** A corridor shaped like a U: the only way across is the bottom. */
const U: Shape[] = [
  { id: "left", kind: "walk", points: [
    { x: 0.1, y: 0.1 }, { x: 0.25, y: 0.1 }, { x: 0.25, y: 0.8 }, { x: 0.1, y: 0.8 },
  ] },
  { id: "bottom", kind: "walk", points: [
    { x: 0.1, y: 0.7 }, { x: 0.9, y: 0.7 }, { x: 0.9, y: 0.8 }, { x: 0.1, y: 0.8 },
  ] },
  { id: "right", kind: "walk", points: [
    { x: 0.75, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.8 }, { x: 0.75, y: 0.8 },
  ] },
];

describe("nearestOpenCell", () => {
  const grid = buildGrid(U, ASPECT, 140);

  it("returns the cell itself when it is already open", () => {
    expect(nearestOpenCell(grid, { x: 0.17, y: 0.3 })).not.toBeNull();
  });

  it("finds ground when the click lands in the water", () => {
    // Dead centre of the U is not walkable; there is still ground nearby.
    const cell = nearestOpenCell(grid, { x: 0.5, y: 0.3 });
    expect(cell).not.toBeNull();
  });
});

describe("findPath", () => {
  const grid = buildGrid(U, ASPECT, 140);

  it("goes the long way around rather than through a wall", () => {
    const path = findPath(grid, { x: 0.17, y: 0.2 }, { x: 0.82, y: 0.2 });
    expect(path).not.toBeNull();

    // A straight line between those two points crosses the gap; any real path
    // has to dip down to the bottom of the U.
    const lowest = Math.max(...path!.map((p) => p.y));
    expect(lowest).toBeGreaterThan(0.6);
  });

  it("keeps every waypoint on walkable ground", () => {
    const path = findPath(grid, { x: 0.17, y: 0.2 }, { x: 0.82, y: 0.2 })!;
    for (const point of path) {
      expect(isWalkable(point, U)).toBe(true);
    }
  });

  it("gives up when there is genuinely no way through", () => {
    const split: Shape[] = [
      { id: "a", kind: "walk", points: [
        { x: 0.1, y: 0.1 }, { x: 0.2, y: 0.1 }, { x: 0.2, y: 0.2 }, { x: 0.1, y: 0.2 },
      ] },
      { id: "b", kind: "walk", points: [
        { x: 0.8, y: 0.8 }, { x: 0.9, y: 0.8 }, { x: 0.9, y: 0.9 }, { x: 0.8, y: 0.9 },
      ] },
    ];
    const island = buildGrid(split, ASPECT, 140);
    expect(findPath(island, { x: 0.15, y: 0.15 }, { x: 0.85, y: 0.85 })).toBeNull();
  });
});

describe("smoothPath", () => {
  it("collapses a straight run to its endpoints", () => {
    const straight = Array.from({ length: 20 }, (_, i) => ({
      x: 0.12 + (i / 19) * 0.1,
      y: 0.75,
    }));
    expect(smoothPath(straight, U, ASPECT).length).toBeLessThan(5);
  });

  it("keeps the corner when the ground turns", () => {
    const grid = buildGrid(U, ASPECT, 140);
    const path = findPath(grid, { x: 0.17, y: 0.2 }, { x: 0.82, y: 0.2 })!;
    const smoothed = smoothPath(path, U, ASPECT);

    expect(smoothed.length).toBeGreaterThan(2);
    expect(smoothed.length).toBeLessThan(path.length);
    for (const point of smoothed) expect(isWalkable(point, U)).toBe(true);
  });
});

describe("the real map", () => {
  const map = layout as MapLayout;
  const aspect = map.image.width / map.image.height;
  const grid = buildGrid(map.shapes, aspect);

  it("connects the spawn to every hotspot", () => {
    const spawn = { x: 0.444, y: 0.505 };
    const unreachable = map.hotspots
      .filter((h) => findPath(grid, spawn, h.at) === null)
      .map((h) => h.id);
    expect(unreachable).toEqual([]);
  });

  it("builds the grid quickly enough to do it on load", () => {
    const started = performance.now();
    buildGrid(map.shapes, aspect);
    expect(performance.now() - started).toBeLessThan(1500);
  });
});
