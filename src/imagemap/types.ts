/**
 * The layout drawn over the map image.
 *
 * Every coordinate is normalised to the image: 0 to 1 across its width and
 * height. That is the whole reason this survives contact with reality — the
 * image is displayed at whatever size the viewport allows, on any screen, and
 * a layout in pixels would be wrong everywhere except the monitor it was
 * authored on.
 */

/** A point in image space: 0..1 on both axes, origin top-left. */
export interface Point {
  x: number;
  y: number;
}

export type ShapeKind =
  /** Ground the character may stand on. */
  | "walk"
  /** A hole punched in the walkable ground: a fountain, a plinth, a wall. */
  | "block";

export interface Shape {
  id: string;
  kind: ShapeKind;
  points: Point[];
}

/** Somewhere the character can stop and the page will open a panel. */
export interface Hotspot {
  id: string;
  /** Where the character stands to trigger it. */
  at: Point;
  /** How close, as a fraction of image width. */
  radius: number;
  label: string;
}

export interface MapLayout {
  /** Natural pixel size of the image the layout was drawn against. */
  image: { width: number; height: number };
  shapes: Shape[];
  hotspots: Hotspot[];
  /**
   * Two points a known distance apart in the world, used to size the
   * character against the scene. Both in image space.
   */
  scale?: { from: Point; to: Point; label: string };
  /** Where the character starts. */
  spawn?: Point;
}

export const EMPTY_LAYOUT: MapLayout = {
  image: { width: 0, height: 0 },
  shapes: [],
  hotspots: [],
};
