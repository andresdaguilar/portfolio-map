import { describe, expect, it } from "vitest";
import { NARROW_VIEWPORT, fitView } from "./view";

/** The real artwork: wide and landscape, which is the whole problem on a phone. */
const IMAGE = { width: 1672, height: 941 };

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 812 };
const PHONE_LANDSCAPE = { width: 812, height: 375 };

const CENTRE = { x: 0.5, y: 0.5 };

describe("fitting the map into the viewport", () => {
  it("shows the whole map on a desktop window", () => {
    const view = fitView(DESKTOP, IMAGE, CENTRE);

    expect(IMAGE.width * view.scale).toBeLessThanOrEqual(DESKTOP.width + 0.001);
    expect(IMAGE.height * view.scale).toBeLessThanOrEqual(DESKTOP.height + 0.001);
  });

  it("centres the map on a desktop window regardless of where the walker is", () => {
    const centred = fitView(DESKTOP, IMAGE, CENTRE);
    const cornered = fitView(DESKTOP, IMAGE, { x: 0.05, y: 0.95 });

    expect(cornered).toEqual(centred);
  });

  it("fills a phone screen rather than fitting a strip into it", () => {
    const view = fitView(PHONE, IMAGE, CENTRE);

    expect(IMAGE.width * view.scale).toBeGreaterThanOrEqual(PHONE.width);
    expect(IMAGE.height * view.scale).toBeGreaterThanOrEqual(PHONE.height);
  });

  it("zooms a phone in far enough to make the character visible", () => {
    // The figure is 0.08 of the image's height. Four pixels of character is
    // what the fit-the-whole-map version gave, and why this exists.
    const characterPx = (v: { scale: number }) => 0.08 * IMAGE.height * v.scale;

    expect(characterPx(fitView(PHONE, IMAGE, CENTRE))).toBeGreaterThan(40);
  });

  it("follows the walker on a phone", () => {
    const left = fitView(PHONE, IMAGE, { x: 0.2, y: 0.5 });
    const right = fitView(PHONE, IMAGE, { x: 0.8, y: 0.5 });

    expect(right.x).toBeLessThan(left.x);
  });

  it("keeps the walker centred while there is map on both sides", () => {
    const focus = { x: 0.5, y: 0.5 };
    const view = fitView(PHONE, IMAGE, focus);
    const onScreen = view.x + focus.x * IMAGE.width * view.scale;

    expect(onScreen).toBeCloseTo(PHONE.width / 2, 5);
  });

  it("never pans past the edge of the artwork", () => {
    for (const x of [0, 0.01, 0.1, 0.5, 0.9, 0.99, 1]) {
      for (const y of [0, 0.01, 0.5, 0.99, 1]) {
        const view = fitView(PHONE, IMAGE, { x, y });
        const width = IMAGE.width * view.scale;
        const height = IMAGE.height * view.scale;

        // No bare canvas at any edge: the image covers the viewport.
        expect(view.x).toBeLessThanOrEqual(0.001);
        expect(view.y).toBeLessThanOrEqual(0.001);
        expect(view.x + width).toBeGreaterThanOrEqual(PHONE.width - 0.001);
        expect(view.y + height).toBeGreaterThanOrEqual(PHONE.height - 0.001);
      }
    }
  });

  it("stops following once the walker reaches the edge of the map", () => {
    const atEdge = fitView(PHONE, IMAGE, { x: 0.02, y: 0.5 });
    const pastEdge = fitView(PHONE, IMAGE, { x: 0, y: 0.5 });

    expect(pastEdge.x).toBe(atEdge.x);
    expect(pastEdge.x).toBe(0);
  });

  it("letterboxes nothing: a filled axis is never centred", () => {
    const view = fitView(PHONE, IMAGE, CENTRE);

    // Vertically the image exactly covers a portrait phone at this scale, so
    // the walker cannot be centred on that axis — and must not leave a gap.
    expect(view.y).toBeLessThanOrEqual(0);
    expect(view.y + IMAGE.height * view.scale).toBeGreaterThanOrEqual(
      PHONE.height - 0.001,
    );
  });

  it("goes back to showing everything when a phone is turned sideways", () => {
    // Landscape is wide enough that filling and fitting agree: the whole map
    // is visible again, which is the right answer and needs no special case.
    const view = fitView(PHONE_LANDSCAPE, IMAGE, { x: 0.9, y: 0.1 });

    expect(IMAGE.width * view.scale).toBeLessThanOrEqual(
      PHONE_LANDSCAPE.width + 0.001,
    );
    expect(view.x).toBeGreaterThanOrEqual(0);
  });

  it("switches behaviour at the breakpoint the panels use", () => {
    const narrow = fitView({ width: NARROW_VIEWPORT - 1, height: 900 }, IMAGE, CENTRE);
    const wide = fitView({ width: NARROW_VIEWPORT, height: 900 }, IMAGE, CENTRE);

    expect(narrow.scale).toBeGreaterThan(wide.scale);
  });

  it("survives a canvas that has not been laid out yet", () => {
    expect(fitView({ width: 0, height: 0 }, IMAGE, CENTRE)).toEqual({
      scale: 1,
      x: 0,
      y: 0,
    });
  });
});
