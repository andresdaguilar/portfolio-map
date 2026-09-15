import { describe, expect, it } from "vitest";
import { BOOKS, CREDENTIALS, EXPERIENCE, PROJECTS, SHOWS, VOLUMES } from "@/content";
import { WALKER } from "../core/constants";
import { overlapsCircle } from "../core/nav";
import { isWalkable } from "../core/terrain";
import { BRIDGES, ISLANDS } from "./islands";
import {
  BLOCKERS,
  BUILDINGS,
  ISO_POIS,
  ISO_SPAWN,
  PLATFORMS,
  RAILINGS,
  nearestIsoPoi,
} from "./map";

/**
 * A map is only as good as the places you can actually stand.
 *
 * These catch the layout mistakes that are invisible in a data file and
 * obvious the moment someone walks into them: two things sharing a footprint,
 * a prompt inside a wall, an island you cannot reach, a spawn in the sea.
 */

function overlap(
  a: { x: number; z: number; w: number; d: number },
  b: { x: number; z: number; w: number; d: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.z < b.z + b.d && a.z + a.d > b.z;
}

describe("the archipelago", () => {
  it("keeps water between the islands", () => {
    const touching: string[] = [];
    for (let i = 0; i < ISLANDS.length; i += 1) {
      for (let j = i + 1; j < ISLANDS.length; j += 1) {
        const a = ISLANDS[i];
        const b = ISLANDS[j];
        const box = (isle: typeof a) => ({
          x: isle.x - isle.w / 2,
          z: isle.z - isle.d / 2,
          w: isle.w,
          d: isle.d,
        });
        if (overlap(box(a), box(b))) touching.push(`${a.id} / ${b.id}`);
      }
    }
    expect(touching).toEqual([]);
  });

  it("bridges every island back to the plaza", () => {
    const connected = new Set(BRIDGES.map((b) => b.id.replace("bridge-", "")));
    const unreachable = ISLANDS.filter(
      (i) => i.id !== "plaza" && !connected.has(i.id),
    ).map((i) => i.id);
    expect(unreachable).toEqual([]);
  });

  it("lays a continuous walkable path along every bridge", () => {
    // Sampling the line: a gap in the planks is a place the walker stops dead.
    for (const bridge of BRIDGES) {
      for (let t = 0; t <= 1; t += 0.05) {
        const x = bridge.from.x + (bridge.to.x - bridge.from.x) * t;
        const z = bridge.from.z + (bridge.to.z - bridge.from.z) * t;
        expect({ bridge: bridge.id, t: t.toFixed(2), walkable: isWalkable(x, z, PLATFORMS) })
          .toEqual({ bridge: bridge.id, t: t.toFixed(2), walkable: true });
      }
    }
  });
});

describe("the town", () => {
  it("never puts two structures in the same place", () => {
    const rails = new Set(RAILINGS.map((r) => r.id));
    const structures = BLOCKERS.filter((b) => !rails.has(b.id));

    const clashes: string[] = [];
    for (let i = 0; i < structures.length; i += 1) {
      for (let j = i + 1; j < structures.length; j += 1) {
        if (overlap(structures[i], structures[j])) {
          clashes.push(`${structures[i].id} / ${structures[j].id}`);
        }
      }
    }
    expect(clashes).toEqual([]);
  });

  it("puts every prompt somewhere the player can stand", () => {
    const blocked = ISO_POIS.filter(
      (poi) =>
        BLOCKERS.some((b) => overlapsCircle(b, poi.x, poi.z, WALKER.radius)) ||
        !isWalkable(poi.x, poi.z, PLATFORMS),
    ).map((p) => p.id);
    expect(blocked).toEqual([]);
  });

  it("keeps every structure on dry land", () => {
    const adrift = BUILDINGS.filter((b) => !isWalkable(b.x, b.z, PLATFORMS)).map(
      (b) => b.id,
    );
    expect(adrift).toEqual([]);
  });

  it("spawns the player in the open", () => {
    expect(isWalkable(ISO_SPAWN.x, ISO_SPAWN.z, PLATFORMS)).toBe(true);
    const inside = BLOCKERS.filter((b) =>
      overlapsCircle(b, ISO_SPAWN.x, ISO_SPAWN.z, WALKER.radius),
    ).map((b) => b.id);
    expect(inside).toEqual([]);
  });

  it("offers one thing at a time where it matters", () => {
    for (const poi of ISO_POIS) {
      expect(nearestIsoPoi(poi.x, poi.z)?.id).toBe(poi.id);
    }
  });

  it("puts every piece of content somewhere in the town", () => {
    const placed = new Set(ISO_POIS.map((p) => p.id));
    const missing = [
      ...EXPERIENCE.map((e) => e.id),
      ...CREDENTIALS.map((c) => c.id),
      ...PROJECTS.map((p) => p.id),
      ...BOOKS.map((b) => b.id),
      ...VOLUMES.map((v) => v.id),
      ...SHOWS.map((s) => s.id),
    ].filter((id) => !placed.has(id));

    expect(missing).toEqual([]);
  });
});

describe("gaps the player has to fit through", () => {
  it("leaves no slot narrower than the walker between neighbours", () => {
    const diameter = WALKER.radius * 2;
    const tooTight: string[] = [];

    for (let i = 0; i < BLOCKERS.length; i += 1) {
      for (let j = i + 1; j < BLOCKERS.length; j += 1) {
        const a = BLOCKERS[i];
        const b = BLOCKERS[j];

        if (a.z < b.z + b.d && a.z + a.d > b.z) {
          const gap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
          if (gap > 0 && gap < diameter) tooTight.push(`${a.id} | ${b.id} (${gap.toFixed(2)})`);
        }
        if (a.x < b.x + b.w && a.x + a.w > b.x) {
          const gap = Math.max(b.z - (a.z + a.d), a.z - (b.z + b.d));
          if (gap > 0 && gap < diameter) tooTight.push(`${a.id} — ${b.id} (${gap.toFixed(2)})`);
        }
      }
    }

    expect(tooTight).toEqual([]);
  });
});
