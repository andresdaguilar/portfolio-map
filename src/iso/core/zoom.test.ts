import { beforeEach, describe, expect, it } from "vitest";
import { ISO_CAMERA } from "./constants";
import { factorForWheel, resetZoom, setViewWidth, zoom, zoomBy } from "./zoom";

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
    expect(zoom.viewWidth).toBe(ISO_CAMERA.maxViewWidth);
  });

  it("stops at the near limit however hard you scroll", () => {
    for (let i = 0; i < 200; i += 1) zoomBy(factorForWheel(-120));
    expect(zoom.viewWidth).toBe(ISO_CAMERA.minViewWidth);
  });

  it("returns to where it started after equal scrolling both ways", () => {
    const start = zoom.viewWidth;
    for (let i = 0; i < 5; i += 1) zoomBy(factorForWheel(120));
    for (let i = 0; i < 5; i += 1) zoomBy(factorForWheel(-120));
    expect(zoom.viewWidth).toBeCloseTo(start, 6);
  });

  it("ignores how big the wheel delta claims to be", () => {
    // A trackpad reports tiny deltas and a mouse reports large ones; one
    // notch should mean one step either way.
    const trackpad = zoomBy(factorForWheel(3));
    resetZoom();
    const mouse = zoomBy(factorForWheel(400));
    expect(trackpad).toBeCloseTo(mouse, 6);
  });

  it("clamps a direct jump too", () => {
    expect(setViewWidth(9999)).toBe(ISO_CAMERA.maxViewWidth);
    expect(setViewWidth(0.1)).toBe(ISO_CAMERA.minViewWidth);
  });

  it("keeps the default inside its own limits", () => {
    expect(ISO_CAMERA.viewWidth).toBeGreaterThanOrEqual(ISO_CAMERA.minViewWidth);
    expect(ISO_CAMERA.viewWidth).toBeLessThanOrEqual(ISO_CAMERA.maxViewWidth);
  });
});
