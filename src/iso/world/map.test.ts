import { describe, expect, it } from "vitest";
import { WALKER } from "../core/constants";
import { overlapsCircle } from "../core/nav";
import {
  BLOCKERS,
  BUILDINGS,
  DISTRICTS,
  ISO_POIS,
  ISO_SPAWN,
  nearestIsoPoi,
} from "./map";

/**
 * A map is only as good as the places you can actually stand.
 *
 * These catch the layout mistakes that are invisible in a data file and
 * obvious the moment someone walks into them: buildings sharing a footprint,
 * a prompt stuck inside a wall, a spawn point inside a house.
 */

function footprintsOverlap(
  a: { x: number; z: number; w: number; d: number },
  b: { x: number; z: number; w: number; d: number },
) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.z < b.z + b.d && a.z + a.d > b.z
  );
}

describe("the town", () => {
  it("has a building for every job, book, project and certificate", () => {
    // Every district must actually contain something.
    for (const district of DISTRICTS) {
      const inside = BUILDINGS.filter(
        (b) =>
          Math.abs(b.x - district.x) < district.w + 6 &&
          Math.abs(b.z - district.z) < district.d + 6,
      );
      expect({ district: district.id, count: inside.length }).toEqual({
        district: district.id,
        count: inside.length,
      });
      expect(inside.length).toBeGreaterThan(0);
    }
  });

  it("never puts two buildings in the same place", () => {
    const clashes: string[] = [];
    for (let i = 0; i < BLOCKERS.length; i += 1) {
      for (let j = i + 1; j < BLOCKERS.length; j += 1) {
        if (footprintsOverlap(BLOCKERS[i], BLOCKERS[j])) {
          clashes.push(`${BLOCKERS[i].id} / ${BLOCKERS[j].id}`);
        }
      }
    }
    expect(clashes).toEqual([]);
  });

  it("puts every prompt somewhere the player can stand", () => {
    const blocked = ISO_POIS.filter((poi) =>
      BLOCKERS.some((b) => overlapsCircle(b, poi.x, poi.z, WALKER.radius)),
    ).map((p) => p.id);
    expect(blocked).toEqual([]);
  });

  it("spawns the player in the open", () => {
    const inside = BLOCKERS.filter((b) =>
      overlapsCircle(b, ISO_SPAWN.x, ISO_SPAWN.z, WALKER.radius),
    ).map((b) => b.id);
    expect(inside).toEqual([]);
  });

  it("offers one thing at a time where it matters", () => {
    // Standing on a prompt should resolve to that prompt, not a neighbour's.
    for (const poi of ISO_POIS) {
      expect(nearestIsoPoi(poi.x, poi.z)?.id).toBe(poi.id);
    }
  });

  it("gives every building a label to show", () => {
    const unlabelled = BUILDINGS.filter((b) => !b.label).map((b) => b.id);
    expect(unlabelled).toEqual([]);
  });
});

describe("gaps the player has to fit through", () => {
  /**
   * A slot narrower than the walker is a trap: the push-out from one wall
   * shoves them into the other and they judder or squeeze through. Cheap to
   * check here, maddening to debug from a video of someone getting stuck.
   */
  it("leaves no slot narrower than the walker between neighbours", () => {
    const diameter = WALKER.radius * 2;
    const tooTight: string[] = [];

    for (let i = 0; i < BLOCKERS.length; i += 1) {
      for (let j = i + 1; j < BLOCKERS.length; j += 1) {
        const a = BLOCKERS[i];
        const b = BLOCKERS[j];

        const overlapZ = a.z < b.z + b.d && a.z + a.d > b.z;
        const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;

        if (overlapZ) {
          const gap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
          if (gap > 0 && gap < diameter) tooTight.push(`${a.id} | ${b.id} (${gap.toFixed(2)})`);
        }
        if (overlapX) {
          const gap = Math.max(b.z - (a.z + a.d), a.z - (b.z + b.d));
          if (gap > 0 && gap < diameter) tooTight.push(`${a.id} — ${b.id} (${gap.toFixed(2)})`);
        }
      }
    }

    expect(tooTight).toEqual([]);
  });
});
