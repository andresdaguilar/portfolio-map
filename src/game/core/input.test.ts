// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { Collider } from "./collision";
import { attachKeyboard, input, resetInput } from "./input";
import { now, placePlayer, player, resetClock, simulate } from "../player/body";

/**
 * Covers the seam between the browser and the simulation.
 *
 * The physics tests set `input.jumpAt` by hand and pass, so a jump that does
 * not work in the browser can only be failing in the wiring — the listener,
 * the key codes, or the clock the press is stamped with. That is exactly the
 * part unit tests on pure functions cannot see.
 */

const FLOOR: Collider[] = [{ x: -50, y: -1, w: 100, h: 1, kind: "solid" }];
const FRAME = 1 / 60;

function press(code: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
}
function release(code: string) {
  window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
}
function run(seconds: number) {
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i += 1) simulate(FRAME, FLOOR);
}

let detach: () => void;

beforeEach(() => {
  resetInput();
  resetClock();
  placePlayer(0, 0);
  detach?.();
  detach = attachKeyboard(now, () => false);
  run(0.2); // settle on the floor
});

describe("keyboard to movement", () => {
  it("walks right while the arrow is held", () => {
    press("ArrowRight");
    run(0.5);
    expect(player.x).toBeGreaterThan(0.5);
  });

  it("stops when the arrow is released", () => {
    press("ArrowRight");
    run(0.5);
    release("ArrowRight");
    run(0.6);
    expect(player.vx).toBe(0);
  });
});

describe("keyboard to jump", () => {
  it("leaves the ground when Space is pressed", () => {
    press("Space");
    run(0.2);
    expect(player.y).toBeGreaterThan(0.3);
  });

  it("leaves the ground when ArrowUp is pressed", () => {
    press("ArrowUp");
    run(0.2);
    expect(player.y).toBeGreaterThan(0.3);
  });

  it("leaves the ground when W is pressed", () => {
    press("KeyW");
    run(0.2);
    expect(player.y).toBeGreaterThan(0.3);
  });

  it("can jump again after landing", () => {
    press("Space");
    run(0.2);
    release("Space");
    run(1.5); // land
    expect(player.grounded).toBe(true);

    press("Space");
    run(0.2);
    expect(player.y).toBeGreaterThan(0.3);
  });

  it("jumps while walking", () => {
    press("ArrowRight");
    run(0.4);
    press("Space");
    run(0.25);
    expect(player.y).toBeGreaterThan(0.3);
    expect(player.x).toBeGreaterThan(1);
  });
});

describe("jump height through the keyboard", () => {
  /** Highest point reached after pressing, optionally releasing early. */
  function apex(releaseAfter: number | null): number {
    resetClock();
    resetInput();
    placePlayer(0, 0);
    run(0.2);

    press("Space");
    let highest = player.y;
    const frames = Math.round(1.2 / FRAME);
    for (let i = 0; i < frames; i += 1) {
      if (releaseAfter !== null && i === Math.round(releaseAfter / FRAME)) {
        release("Space");
      }
      simulate(FRAME, FLOOR);
      highest = Math.max(highest, player.y);
    }
    return highest;
  }

  it("reaches the designed apex when held, not a token hop", () => {
    // jumpVelocity 10 against gravity 26 puts the apex at v^2/2g = 1.92.
    expect(apex(null)).toBeGreaterThan(1.7);
  });

  it("clears the player's own height", () => {
    expect(apex(null)).toBeGreaterThan(1.7);
  });

  it("a tap is shorter than a hold, but still a real jump", () => {
    const tapped = apex(0.08);
    const held = apex(null);
    expect(tapped).toBeLessThan(held);
    expect(tapped).toBeGreaterThan(0.5);
  });
});
