import { ISO_CAMERA, ISO_PHYSICS, WALKER } from "../core/constants";
import { type Footprint, resolve, screenToWorld } from "../core/nav";
import { input } from "@/game/core/input";

export type WalkState = "idle" | "walk" | "run";

export interface Walker {
  x: number;
  z: number;
  vx: number;
  vz: number;
  /** Direction the body is facing, in radians around the vertical axis. */
  facing: number;
  holdTime: number;
  state: WalkState;
}

/** Module-level, read every frame by the renderer, the camera and interactions. */
export const walker: Walker = {
  x: 0,
  z: 0,
  vx: 0,
  vz: 0,
  facing: 0,
  holdTime: 0,
  state: "idle",
};

export function placeWalker(x: number, z: number): void {
  walker.x = x;
  walker.z = z;
  walker.vx = 0;
  walker.vz = 0;
  walker.holdTime = 0;
  walker.state = "idle";
}

function approach(current: number, target: number, rate: number, dt: number) {
  const delta = target - current;
  const step = rate * dt;
  return Math.abs(delta) <= step ? target : current + Math.sign(delta) * step;
}

/** Shortest signed angle from `from` to `to`. */
export function angleDelta(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function step(dt: number, blockers: readonly Footprint[]): void {
  const dir = screenToWorld(input.moveX, input.moveY, ISO_CAMERA.azimuth);
  const wants = dir.x !== 0 || dir.z !== 0;

  walker.holdTime = wants ? walker.holdTime + dt : 0;
  const speed =
    walker.holdTime > WALKER.runAfter ? WALKER.runSpeed : WALKER.walkSpeed;

  const rate = wants ? WALKER.accel : WALKER.brake;
  walker.vx = approach(walker.vx, dir.x * speed, rate, dt);
  walker.vz = approach(walker.vz, dir.z * speed, rate, dt);

  const next = resolve(
    walker.x + walker.vx * dt,
    walker.z + walker.vz * dt,
    WALKER.radius,
    blockers,
  );

  // Losing ground to a wall should bleed off speed in that direction, or the
  // walker keeps grinding at full tilt against a building.
  const movedX = next.x - walker.x;
  const movedZ = next.z - walker.z;
  if (Math.abs(movedX) < Math.abs(walker.vx * dt) * 0.5) walker.vx *= 0.4;
  if (Math.abs(movedZ) < Math.abs(walker.vz * dt) * 0.5) walker.vz *= 0.4;

  walker.x = next.x;
  walker.z = next.z;

  if (wants) {
    // Face where the input points, not where collision allowed movement —
    // otherwise sliding along a wall spins the body around.
    const target = Math.atan2(dir.x, dir.z);
    walker.facing += angleDelta(walker.facing, target) *
      Math.min(1, WALKER.turnSpeed * dt);
  }

  const speedNow = Math.hypot(walker.vx, walker.vz);
  walker.state =
    speedNow < 0.2 ? "idle" : speedNow > WALKER.walkSpeed + 0.5 ? "run" : "walk";
}

let accumulator = 0;
let clock = 0;

export function simulateWalk(
  frameDelta: number,
  blockers: readonly Footprint[],
): void {
  accumulator += Math.min(frameDelta, ISO_PHYSICS.step * ISO_PHYSICS.maxSteps);

  let steps = 0;
  while (accumulator >= ISO_PHYSICS.step && steps < ISO_PHYSICS.maxSteps) {
    clock += ISO_PHYSICS.step;
    step(ISO_PHYSICS.step, blockers);
    accumulator -= ISO_PHYSICS.step;
    steps += 1;
  }
}

export const isoNow = () => clock;

export function resetIsoClock(): void {
  accumulator = 0;
  clock = 0;
}
