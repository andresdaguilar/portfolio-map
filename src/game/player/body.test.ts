import { beforeEach, describe, expect, it } from "vitest";
import { PLAYER } from "../core/constants";
import type { Collider } from "../core/collision";
import { input, resetInput } from "../core/input";
import { now, placePlayer, player, resetClock, simulate } from "./body";

/**
 * The controller is the one part of this project where a silent regression
 * ruins everything — a visitor dropped through the floor has no portfolio at
 * all. It is also pure: no DOM, no renderer, just numbers in and numbers out,
 * so it can be driven with fixed deltas and asserted on directly.
 */

const FRAME = 1 / 60;

/** Advances the simulation by `seconds` worth of 60Hz frames. */
function run(seconds: number, level: Collider[] = LEVEL) {
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i += 1) simulate(FRAME, level);
}

const LEVEL: Collider[] = [
  { x: -50, y: -1, w: 100, h: 1, kind: "solid" },      // ground, top at y=0
  { x: 20, y: 0, w: 2, h: 6, kind: "solid" },          // wall
  { x: 30, y: 0, w: 1, h: 8, kind: "ladder" },
  // The landing has a hatch where the ladder comes through. A solid floor
  // straight over a ladder traps the climber against its underside.
  { x: 24, y: 8, w: 5.5, h: 0.5, kind: "solid" },
  { x: 31.5, y: 8, w: 5.5, h: 0.5, kind: "solid" },
  { x: -14, y: 1.2, w: 6, h: 0.3, kind: "platform" },  // one-way platform
];

beforeEach(() => {
  resetInput();
  resetClock();
  placePlayer(0, 0);
});

describe("gravity and ground", () => {
  it("falls onto the ground and rests there", () => {
    placePlayer(0, 6);
    run(2);
    expect(player.y).toBeCloseTo(0, 2);
    expect(player.grounded).toBe(true);
    expect(player.vy).toBe(0);
  });

  it("does not sink through the floor over a long idle", () => {
    run(10);
    expect(player.y).toBeCloseTo(0, 4);
  });
});

describe("horizontal movement", () => {
  it("ramps up to walk speed rather than snapping to it", () => {
    input.moveX = 1;
    simulate(FRAME, LEVEL);
    const afterOneFrame = player.vx;
    expect(afterOneFrame).toBeGreaterThan(0);
    expect(afterOneFrame).toBeLessThan(PLAYER.walkSpeed * 0.5);
  });

  it("holds walk speed before the run threshold", () => {
    input.moveX = 1;
    run(0.4);
    expect(player.vx).toBeLessThanOrEqual(PLAYER.walkSpeed + 0.01);
    expect(player.state).toBe("walk");
  });

  it("promotes to a run once the direction is held past the threshold", () => {
    input.moveX = 1;
    run(1.5);
    expect(player.vx).toBeCloseTo(PLAYER.runSpeed, 1);
    expect(player.state).toBe("run");
  });

  it("brakes to a stop and reports idle", () => {
    input.moveX = 1;
    run(1);
    input.moveX = 0;
    run(1);
    expect(player.vx).toBe(0);
    expect(player.state).toBe("idle");
  });

  it("faces the direction of travel and keeps facing it once stopped", () => {
    input.moveX = -1;
    run(0.3);
    expect(player.facing).toBe(-1);
    input.moveX = 0;
    run(0.5);
    expect(player.facing).toBe(-1);
  });
});

describe("step-up", () => {
  const steps: Collider[] = [
    { x: -50, y: -1, w: 100, h: 1, kind: "solid" },
    { x: 4, y: 0, w: 4, h: 0.6, kind: "solid" },   // knee height — walkable
    { x: 12, y: 0, w: 4, h: 1.4, kind: "solid" },  // chest height — must jump
  ];

  it("walks up a low ledge without jumping", () => {
    placePlayer(3, 0);
    run(0.1, steps); // settle onto the ground so `grounded` is real
    input.moveX = 1;
    run(0.5, steps); // far enough to mount the ledge, not far enough to walk off it
    expect(player.y).toBeCloseTo(0.6, 2);
    expect(player.x).toBeGreaterThan(4);
    expect(player.x).toBeLessThan(8);
  });

  it("never leaves the ground while stepping up", () => {
    placePlayer(3, 0);
    run(0.1, steps);
    input.moveX = 1;
    let airborne = false;
    for (let i = 0; i < 30; i += 1) {
      simulate(FRAME, steps);
      if (!player.grounded) airborne = true;
    }
    expect(airborne).toBe(false);
  });

  it("is stopped by a ledge taller than the step height", () => {
    placePlayer(9, 0);
    run(0.1, steps);
    input.moveX = 1;
    run(2, steps);
    expect(player.y).toBeCloseTo(0, 2);
    expect(player.x).toBeCloseTo(12 - PLAYER.width / 2, 1);
  });

  it("does not climb a wall by pressing into it mid-air", () => {
    const wall: Collider[] = [
      { x: -50, y: -1, w: 100, h: 1, kind: "solid" },
      { x: 4, y: 0, w: 2, h: 10, kind: "solid" },
    ];
    placePlayer(3, 5); // airborne, alongside the wall
    input.moveX = 1;
    run(1.5, wall);
    expect(player.y).toBeCloseTo(0, 2); // fell to the floor, did not ratchet up
  });
});

describe("walls", () => {
  it("stops at a wall instead of passing through it", () => {
    input.moveX = 1;
    run(6);
    // Wall's left face is x=20; the player's centre stops half a width short.
    expect(player.x).toBeCloseTo(20 - PLAYER.width / 2, 1);
  });
});

describe("jumping", () => {
  it("leaves the ground when jump is pressed", () => {
    input.jumpAt = 0;
    input.jumpHeld = true;
    simulate(FRAME, LEVEL);
    expect(player.vy).toBeGreaterThan(0);
    expect(player.grounded).toBe(false);
  });

  it("returns to the ground", () => {
    input.jumpAt = 0;
    input.jumpHeld = true;
    run(3);
    expect(player.y).toBeCloseTo(0, 2);
    expect(player.grounded).toBe(true);
  });

  it("goes higher when the button is held than when it is tapped", () => {
    const peak = (held: boolean) => {
      resetClock();
      placePlayer(0, 0);
      resetInput();
      run(0.1);
      input.jumpAt = 0.1;
      input.jumpHeld = true;
      let highest = 0;
      for (let i = 0; i < 90; i += 1) {
        // A tap releases after ~80ms; a held jump never releases.
        if (!held && i === 5) input.jumpHeld = false;
        simulate(FRAME, LEVEL);
        highest = Math.max(highest, player.y);
      }
      return highest;
    };
    expect(peak(true)).toBeGreaterThan(peak(false) + 0.3);
  });

  it("still fires just after walking off a ledge (coyote time)", () => {
    const edge: Collider[] = [{ x: 0, y: -1, w: 4, h: 1, kind: "solid" }];
    placePlayer(1, 0);
    input.moveX = 1;

    // Walk until the ground runs out, however many frames that takes.
    let frames = 0;
    while (player.grounded || frames === 0) {
      simulate(FRAME, edge);
      frames += 1;
      if (frames > 300) break;
    }
    expect(player.grounded).toBe(false);

    // Jump on the very next frame — inside the coyote window.
    input.jumpAt = now();
    input.jumpHeld = true;
    simulate(FRAME, edge);
    expect(player.vy).toBeGreaterThan(0);
  });

  it("refuses a jump long after leaving the ground", () => {
    const edge: Collider[] = [{ x: 0, y: -1, w: 4, h: 1, kind: "solid" }];
    placePlayer(6, 4); // already in mid-air, nowhere near the slab
    run(0.5, edge);
    const fallingSpeed = player.vy;
    input.jumpAt = now();
    input.jumpHeld = true;
    simulate(FRAME, edge);
    expect(player.vy).toBeLessThan(fallingSpeed + 0.01);
  });
});

describe("one-way platforms", () => {
  it("lands on a platform when falling onto it", () => {
    placePlayer(-11, 6);
    run(2);
    expect(player.y).toBeCloseTo(1.5, 1);
    expect(player.grounded).toBe(true);
  });

  it("passes up through a platform from below", () => {
    placePlayer(-11, 0);
    input.jumpAt = 0;
    input.jumpHeld = true;
    // Mid-flight, the player should be above the platform's underside without
    // having been stopped by it.
    let passed = false;
    for (let i = 0; i < 40; i += 1) {
      simulate(FRAME, LEVEL);
      if (player.y > 1.6) passed = true;
    }
    expect(passed).toBe(true);
  });
});

describe("ladders", () => {
  it("ignores a ladder until the player pushes into it", () => {
    placePlayer(30.5, 0);
    run(0.2);
    expect(player.onLadder).toBe(false);
  });

  it("climbs when up is held and reaches the landing", () => {
    placePlayer(30.5, 0);
    input.moveY = 1;
    run(4);
    expect(player.y).toBeGreaterThan(7);
  });

  it("does not fall while hanging still on a ladder", () => {
    placePlayer(30.5, 0);
    input.moveY = 1;
    run(1);
    const height = player.y;
    input.moveY = 0;
    run(1);
    expect(player.y).toBeCloseTo(height, 2);
  });
});

describe("robustness", () => {
  it("survives an enormous frame delta without teleporting", () => {
    input.moveX = 1;
    // A backgrounded tab hands back multi-second deltas on return.
    simulate(5, LEVEL);
    expect(Number.isFinite(player.x)).toBe(true);
    expect(player.y).toBeCloseTo(0, 2);
    expect(player.x).toBeLessThan(2);
  });
});

describe("falling out of the world", () => {
  it("puts the player back on solid ground after falling out of the world", () => {
    const pit: Collider[] = [{ x: 0, y: -1, w: 10, h: 1, kind: "solid" }];
    placePlayer(5, 0);
    run(0.3, pit);

    input.moveX = 1;
    run(4, pit); // walks off the edge and falls past the kill plane
    input.moveX = 0;
    run(2, pit); // let them settle wherever they were put back

    expect(player.grounded).toBe(true);
    expect(player.y).toBeCloseTo(0, 2);
    // Back on the ledge, not balanced on its very lip.
    expect(player.x).toBeGreaterThan(0);
    expect(player.x).toBeLessThan(10);
  });

  it("never leaves the player falling forever", () => {
    const pit: Collider[] = [{ x: 0, y: -1, w: 4, h: 1, kind: "solid" }];
    placePlayer(2, 0);
    run(0.2, pit);
    input.moveX = 1;
    run(20, pit);
    expect(player.y).toBeGreaterThan(-30);
  });
});
