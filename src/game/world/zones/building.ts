import { EXPERIENCE } from "@/content";
import { PLAYER } from "../../core/constants";
import type { Collider } from "../../core/collision";

/**
 * The career corridor, laid out from the content layer.
 *
 * Station order and floor heights come straight from `EXPERIENCE`, so adding a
 * job or correcting a date rebuilds the level — there are no hand-placed
 * coordinates to fall out of sync. The floor climbs with the career, and the
 * climb is walked: consecutive stations are joined by a flight of stairs whose
 * step height is derived from what the controller can walk up.
 */

export const STATION_WIDTH = 17;
export const STAIR_RUN = 7;
export const ENTRANCE_WIDTH = 20;
/** Clear height inside a room, floor to ceiling. */
export const ROOM_HEIGHT = 7.5;
/**
 * How high above the floor a company sign hangs.
 *
 * High enough to read as signage, low enough that a visitor standing still on
 * the floor has it in frame — the first version hung them just under the
 * ceiling and you had to jump to see whose office you were in.
 */
export const SIGN_HEIGHT = 4.3;
const FLOOR_THICKNESS = 1.2;

export interface Station {
  id: string;
  company: string;
  tagline: string;
  /** Left edge of the room. */
  x: number;
  width: number;
  /** Walking surface height. */
  floorY: number;
  /** Colour of this room's practical light. */
  light: string;
  props: string[];
  /** Where the sign hangs. */
  signX: number;
}

/**
 * Builds a flight of stairs from `fromY` up to `toY` across `run` units.
 *
 * Every rise is kept at or under the controller's step height so the player
 * walks up without touching the jump button — the corridor should never turn
 * into an obstacle course between jobs.
 */
export function makeStairs(
  x: number,
  fromY: number,
  toY: number,
  run: number,
): Collider[] {
  const climb = toY - fromY;
  if (climb <= 0) return [{ x, y: fromY - FLOOR_THICKNESS, w: run, h: FLOOR_THICKNESS, kind: "solid" }];

  const count = Math.ceil(climb / (PLAYER.stepHeight - 0.05));
  const rise = climb / count;
  const tread = run / count;

  return Array.from({ length: count }, (_, i) => ({
    x: x + i * tread,
    y: fromY - FLOOR_THICKNESS,
    // Each step is a full-height block, so there is mass under the staircase
    // rather than floating treads.
    w: tread + 0.02,
    h: FLOOR_THICKNESS + rise * (i + 1),
    kind: "solid" as const,
  }));
}

function buildStations(): Station[] {
  let cursor = 0;
  return EXPERIENCE.map((job) => {
    const x = cursor;
    cursor += STATION_WIDTH + STAIR_RUN;
    return {
      id: job.id,
      company: job.company,
      tagline: job.tagline,
      x,
      width: STATION_WIDTH,
      floorY: job.set.floorHeight,
      light: job.set.practicalLight,
      props: job.set.props,
      signX: x + 2.5,
    };
  });
}

export const STATIONS: Station[] = buildStations();

export const CORRIDOR_END =
  STATIONS[STATIONS.length - 1].x + STATION_WIDTH;

/**
 * The flights joining the stations, built once and shared.
 *
 * The renderer and the collider list both read this. Generating the stairs
 * twice would let the treads you see drift away from the treads you stand on —
 * the first version had colliders only, so the player walked up thin air.
 */
export const STAIRCASES: Collider[][] = STATIONS.slice(0, -1).map(
  (station, i) =>
    makeStairs(
      station.x + station.width,
      station.floorY,
      STATIONS[i + 1].floorY,
      STAIR_RUN,
    ),
);

/** Where the player starts: outside, at street level, facing the door. */
export const SPAWN = { x: -ENTRANCE_WIDTH + 4, y: 0 };

function buildColliders(): Collider[] {
  const out: Collider[] = [];

  // Street, outside the building.
  out.push({
    x: -ENTRANCE_WIDTH - 4,
    y: -FLOOR_THICKNESS,
    w: ENTRANCE_WIDTH + 4,
    h: FLOOR_THICKNESS,
    kind: "solid",
  });
  // The street ends in a wall, so there is only one way to go: in.
  out.push({ x: -ENTRANCE_WIDTH - 5, y: -FLOOR_THICKNESS, w: 1, h: 14, kind: "solid" });

  STATIONS.forEach((station, i) => {
    // The walking surface is the TOP of this block, so the block is one
    // thickness deep and sits just under the floor line. The visual mass that
    // makes the building look solid is drawn separately by `RoomShell` — it is
    // not a collider, and conflating the two put every floor above HP at twice
    // its intended height.
    out.push({
      x: station.x,
      y: station.floorY - FLOOR_THICKNESS,
      w: station.width,
      h: FLOOR_THICKNESS,
      kind: "solid",
    });

    if (STAIRCASES[i]) out.push(...STAIRCASES[i]);
  });

  // The far end of the corridor, until the upper floors are built.
  out.push({ x: CORRIDOR_END, y: 0, w: 2, h: 40, kind: "solid" });

  return out;
}

export const BUILDING: Collider[] = buildColliders();
