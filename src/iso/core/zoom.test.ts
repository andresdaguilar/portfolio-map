import { beforeEach, describe, expect, it } from "vitest";
import { ISO_CAMERA } from "./constants";
import { factorForWheel, resetZoom, setViewWidth, zoom, zoomBy } from "./zoom";
import {
  MAP_BOUNDS,
  clampFocus,
  fitViewWidth,
  groundToScreen,
  screenToGround,
} from "./view";

beforeEach(resetZoom);

describe("wheel zoom", () => {
  it("scrolling down zooms out, scrolling up zooms in", () => {
    const start = zoom.viewWidth;
    expect(zoomBy(factorForWheel(120))).toBeGreaterThan(start);
    resetZoom();
    expect(zoomBy(factorForWheel(-120))).toBeLessThan(start);
  });

  it("stops at the far limit however hard you scroll", () => {
    for (let i = 0; i < 200; i += 1) zoomBy(factorForWheel(120));
    expect(zoom.viewWidth).toBe(zoom.maxWidth);
  });

  it("stops at the near limit however hard you scroll", () => {
    for (let i = 0; i < 200; i += 1) zoomBy(factorForWheel(-120));
    expect(zoom.viewWidth).toBe(ISO_CAMERA.minViewWidth);
  });

  it("returns to where it started after equal scrolling both ways", () => {
    const start = zoom.viewWidth;
    for (let i = 0; i < 4; i += 1) zoomBy(factorForWheel(120));
    for (let i = 0; i < 4; i += 1) zoomBy(factorForWheel(-120));
    expect(zoom.viewWidth).toBeCloseTo(start, 6);
  });

  it("ignores how big the wheel delta claims to be", () => {
    const trackpad = zoomBy(factorForWheel(3));
    resetZoom();
    const mouse = zoomBy(factorForWheel(400));
    expect(trackpad).toBeCloseTo(mouse, 6);
  });

  it("clamps a direct jump too", () => {
    expect(setViewWidth(9999)).toBe(zoom.maxWidth);
    expect(setViewWidth(0.1)).toBe(ISO_CAMERA.minViewWidth);
  });
});

describe("screen projection", () => {
  it("round-trips a ground point through screen space", () => {
    for (const [x, z] of [[0, 0], [12, -30], [-44, 18], [7.5, 7.5]]) {
      const { sx, sy } = groundToScreen(x, z);
      const back = screenToGround(sx, sy);
      expect(back.x).toBeCloseTo(x, 6);
      expect(back.z).toBeCloseTo(z, 6);
    }
  });

  it("puts -Z up and to the right on screen", () => {
    const here = groundToScreen(0, 0);
    const away = groundToScreen(0, -10);
    expect(away.sx).toBeGreaterThan(here.sx);
    expect(away.sy).toBeGreaterThan(here.sy);
  });
});

describe("fitting the map on screen", () => {
  it("frames the whole archipelago on a laptop", () => {
    const aspect = 16 / 9;
    const width = fitViewWidth(aspect);
    expect(width).toBeGreaterThanOrEqual(MAP_BOUNDS.width);
    expect(width / aspect).toBeGreaterThanOrEqual(MAP_BOUNDS.height);
  });

  it("frames it on a phone held upright too", () => {
    const aspect = 390 / 844;
    const width = fitViewWidth(aspect);
    expect(width).toBeGreaterThanOrEqual(MAP_BOUNDS.width);
    expect(width / aspect).toBeGreaterThanOrEqual(MAP_BOUNDS.height);
  });
});

describe("keeping the camera over the map", () => {
  const aspect = 16 / 9;

  it("sits still at the centre once the whole map is in frame", () => {
    const width = fitViewWidth(aspect);
    const a = clampFocus(-40, 30, width, aspect);
    const b = clampFocus(38, -38, width, aspect);
    expect(a.x).toBeCloseTo(b.x, 4);
    expect(a.z).toBeCloseTo(b.z, 4);
  });

  it("stops the frame running off into open water when zoomed in", () => {
    const width = 26;
    const pulled = clampFocus(-200, 200, width, aspect);
    const { sx, sy } = groundToScreen(pulled.x, pulled.z);
    expect(sx).toBeGreaterThanOrEqual(MAP_BOUNDS.minX + width / 2 - 1e-6);
    expect(sy).toBeLessThanOrEqual(MAP_BOUNDS.maxY - width / aspect / 2 + 1e-6);
  });

  it("leaves a point in the middle of the map alone", () => {
    const width = 22;
    const kept = clampFocus(0, 0, width, aspect);
    expect(kept.x).toBeCloseTo(0, 4);
    expect(kept.z).toBeCloseTo(0, 4);
  });
});
