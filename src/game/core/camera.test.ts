import { beforeEach, describe, expect, it } from "vitest";
import { CAMERA, PLAYER } from "./constants";
import { followPlayer, framingOffset, visibleHalfHeight } from "./camera";
import { fovForAspect } from "../CameraRig";
import { input, resetInput } from "./input";
import { placePlayer, player, resetClock, simulate } from "../player/body";
import {
  BUILDING,
  CORRIDOR_END,
  SIGN_HEIGHT,
  SPAWN,
  STATIONS,
} from "../world/zones/building";

/**
 * The character must never leave the frame.
 *
 * Soft damping alone does not promise this: walking back down the building the
 * camera trails the descent, and with a loose deadzone the player sinks out of
 * view. These walk the real level in both directions and watch the framing
 * every single frame.
 */

const FRAME = 1 / 60;
const LAPTOP = visibleHalfHeight(fovForAspect(16 / 9));
const PHONE = visibleHalfHeight(fovForAspect(390 / 844));

/** Walks with the camera attached, returning the worst framing seen. */
function walk(direction: -1 | 1, seconds: number, halfHeight: number) {
  let cam = { x: player.x, y: player.y + PLAYER.height / 2 };
  let worst = 0;
  let worstAt = { x: 0, y: 0 };

  input.moveX = direction;
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i += 1) {
    simulate(FRAME, BUILDING);
    cam = followPlayer(
      cam,
      {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        facing: player.facing,
        grounded: player.grounded,
      },
      FRAME,
      halfHeight,
    );
    const offset = framingOffset(cam, player.y, halfHeight);
    if (offset > worst) {
      worst = offset;
      worstAt = { x: Number(player.x.toFixed(1)), y: Number(player.y.toFixed(1)) };
    }
  }
  return { worst, worstAt };
}

beforeEach(() => {
  resetInput();
  resetClock();
  placePlayer(SPAWN.x, SPAWN.y);
});

describe("keeping the character in frame", () => {
  it("holds framing all the way up the building", () => {
    const { worst, worstAt } = walk(1, 90, LAPTOP);
    expect({ worst: Number(worst.toFixed(2)), worstAt }).toMatchObject({
      worst: expect.any(Number),
    });
    expect(worst).toBeLessThan(0.9);
  });

  it("holds framing all the way back down", () => {
    walk(1, 90, LAPTOP); // climb to the top first
    expect(player.x).toBeGreaterThan(CORRIDOR_END - 4);

    const { worst } = walk(-1, 120, LAPTOP);
    expect(worst).toBeLessThan(0.9);
  });

  it("holds framing on a phone held upright", () => {
    const up = walk(1, 90, PHONE);
    const down = walk(-1, 120, PHONE);
    expect(Math.max(up.worst, down.worst)).toBeLessThan(0.9);
  });

  it("keeps up with a long fall", () => {
    const top = STATIONS[STATIONS.length - 1];
    placePlayer(top.x + 2, top.floorY + 20);

    let cam = { x: player.x, y: player.y + PLAYER.height / 2 };
    let worst = 0;
    for (let i = 0; i < 60 * 6; i += 1) {
      simulate(FRAME, BUILDING);
      cam = followPlayer(
        cam,
        {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        facing: player.facing,
        grounded: player.grounded,
      },
        FRAME,
        LAPTOP,
      );
      worst = Math.max(worst, framingOffset(cam, player.y, LAPTOP));
    }
    expect(worst).toBeLessThan(0.95);
  });
});

describe("resting framing", () => {
  it("settles with the character near the middle of the frame", () => {
    placePlayer(STATIONS[0].x + 6, STATIONS[0].floorY);
    let cam = { x: player.x, y: player.y + 8 }; // start badly framed
    for (let i = 0; i < 60 * 4; i += 1) {
      simulate(FRAME, BUILDING);
      cam = followPlayer(
        cam,
        { x: player.x, y: player.y, vx: 0, vy: player.vy, facing: 1, grounded: player.grounded },
        FRAME,
        LAPTOP,
      );
    }
    expect(framingOffset(cam, player.y, LAPTOP)).toBeLessThan(0.45);
  });
});

describe("what is visible in a room", () => {
  it("shows the company sign without the player having to jump", () => {
    // Standing still on the floor must be enough to read whose office it is.
    const cameraY = CAMERA.yOffset;
    const topOfFrame = cameraY + LAPTOP;
    expect(topOfFrame).toBeGreaterThan(SIGN_HEIGHT + 0.8);
  });

  it("shows the sign on a phone held upright too", () => {
    const topOfFrame = CAMERA.yOffset + PHONE;
    expect(topOfFrame).toBeGreaterThan(SIGN_HEIGHT + 0.8);
  });

  it("still shows the floor the player is standing on", () => {
    const bottomOfFrame = CAMERA.yOffset - LAPTOP;
    expect(bottomOfFrame).toBeLessThan(-0.5);
  });
});
