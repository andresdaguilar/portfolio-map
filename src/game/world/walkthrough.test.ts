import { beforeEach, describe, expect, it } from "vitest";
import { input, resetInput } from "../core/input";
import { placePlayer, player, resetClock, simulate } from "../player/body";
import { BUILDING, CORRIDOR_END, SPAWN, STATIONS } from "./zones/building";

/**
 * The test that matters most: can a visitor actually walk the whole building?
 *
 * Unit tests on the stair generator passed while every floor above the first
 * sat at twice its intended height, because nothing checked the assembled
 * level. This walks the real collider list from the real spawn with the key
 * held down, exactly as a visitor would, and asserts they arrive.
 */

const FRAME = 1 / 60;

/** Holds right for `seconds`, reporting the highest floor reached. */
function walkRight(seconds: number) {
  input.moveX = 1;
  const frames = Math.round(seconds / FRAME);
  let highest = player.y;
  for (let i = 0; i < frames; i += 1) {
    simulate(FRAME, BUILDING);
    if (player.grounded) highest = Math.max(highest, player.y);
  }
  return highest;
}

beforeEach(() => {
  resetInput();
  resetClock();
  placePlayer(SPAWN.x, SPAWN.y);
});

describe("walking the building", () => {
  it("reaches every station just by holding right", () => {
    const reached = new Set<string>();

    input.moveX = 1;
    for (let i = 0; i < 60 * 90; i += 1) {
      simulate(FRAME, BUILDING);
      if (!player.grounded) continue;
      for (const station of STATIONS) {
        const inside =
          player.x >= station.x &&
          player.x <= station.x + station.width &&
          Math.abs(player.y - station.floorY) < 0.2;
        if (inside) reached.add(station.id);
      }
    }

    const missed = STATIONS.filter((s) => !reached.has(s.id)).map((s) => s.id);
    expect(missed).toEqual([]);
  });

  it("climbs from the street to the top floor without jumping", () => {
    const top = STATIONS[STATIONS.length - 1].floorY;
    const highest = walkRight(90);
    expect(highest).toBeCloseTo(top, 1);
  });

  it("never gets stuck against a step it cannot climb", () => {
    input.moveX = 1;
    let stuckFrames = 0;
    let lastX = player.x;
    let jammedAt: number | null = null;

    for (let i = 0; i < 60 * 90; i += 1) {
      simulate(FRAME, BUILDING);
      // Moving less than a millimetre a frame while pressing into a wall.
      if (Math.abs(player.x - lastX) < 0.001) stuckFrames += 1;
      else stuckFrames = 0;
      lastX = player.x;

      // Stopping at the wall that closes the corridor is the intended end of
      // the walk; stopping anywhere before it is a jam.
      if (stuckFrames > 120 && player.x < CORRIDOR_END - 2) {
        jammedAt = player.x;
        break;
      }
    }

    expect(jammedAt === null ? null : jammedAt.toFixed(1)).toBeNull();
  });

  it("ends up at the far wall, not short of it", () => {
    walkRight(90);
    expect(player.x).toBeGreaterThan(CORRIDOR_END - 3);
  });
});

describe("what the walk actually shows you", () => {
  it("brings every company within reach of its prompt", async () => {
    const { nearestPoi } = await import("../core/interaction");

    const seen = new Set<string>();
    input.moveX = 1;
    for (let i = 0; i < 60 * 90; i += 1) {
      simulate(FRAME, BUILDING);
      const poi = nearestPoi(player.x, player.y);
      if (poi?.target?.kind === "experience") seen.add(poi.target.id);
    }

    const unreachable = STATIONS.filter((s) => !seen.has(s.id)).map((s) => s.id);
    expect(unreachable).toEqual([]);
  });

  it("never offers two companies at once", async () => {
    const { POIS } = await import("../core/interaction");
    const jobs = POIS.filter((p) => p.target?.kind === "experience");

    for (let i = 0; i < jobs.length; i += 1) {
      for (let j = i + 1; j < jobs.length; j += 1) {
        const dx = Math.abs(jobs[i].x - jobs[j].x);
        const dy = Math.abs(jobs[i].y - jobs[j].y);
        const overlapping = dx < jobs[i].radius + jobs[j].radius && dy < 1;
        expect({ a: jobs[i].id, b: jobs[j].id, overlapping }).toEqual({
          a: jobs[i].id,
          b: jobs[j].id,
          overlapping: false,
        });
      }
    }
  });
});
