import { ISO_CAMERA, ISO_PHYSICS, WALKER } from "../core/constants";
import { type Footprint, resolve, screenToWorld } from "../core/nav";
import { groundHeightAt, isWalkable, type Platform } from "../core/terrain";
import { input } from "@/game/core/input";

export type WalkState = "idle" | "walk" | "run";

export interface Walker {
  x: number;
  /** Height of the ground under the walker. Follows the terrace, never jumps. */
  y: number;
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
  y: 0,
  z: 0,
  vx: 0,
  vz: 0,
  facing: 0,
  holdTime: 0,
  state: "idle",
};

export function placeWalker(x: number, z: number, y = 0): void {
  walker.x = x;
  walker.y = y;
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

/** The furthest part of an intended move that still has ground under it. */
function pickFooting(
  wanted: { x: number; z: number },
  platforms: readonly Platform[],
): { x: number; z: number } {
  if (platforms.length === 0) return wanted;
  if (isWalkable(wanted.x, wanted.z, platforms)) return wanted;

  const alongX = { x: wanted.x, z: walker.z };
  if (isWalkable(alongX.x, alongX.z, platforms)) return alongX;

  const alongZ = { x: walker.x, z: wanted.z };
  if (isWalkable(alongZ.x, alongZ.z, platforms)) return alongZ;

  return { x: walker.x, z: walker.z };
}

function step(
  dt: number,
  blockers: readonly Footprint[],
  platforms: readonly Platform[],
): void {
  const dir = screenToWorld(input.moveX, input.moveY, ISO_CAMERA.azimuth);
  const wants = dir.x !== 0 || dir.z !== 0;

  walker.holdTime = wants ? walker.holdTime + dt : 0;
  const speed =
    walker.holdTime > WALKER.runAfter ? WALKER.runSpeed : WALKER.walkSpeed;

  const rate = wants ? WALKER.accel : WALKER.brake;
  walker.vx = approach(walker.vx, dir.x * speed, rate, dt);
  walker.vz = approach(walker.vz, dir.z * speed, rate, dt);

  const wanted = resolve(
    walker.x + walker.vx * dt,
    walker.z + walker.vz * dt,
    WALKER.radius,
    blockers,
  );

  // The world is islands with water between them, so a step that lands on
  // nothing is refused. Each axis is retried on its own first, which turns a
  // blocked diagonal into a slide along the shoreline rather than a dead stop.
  const next = pickFooting(wanted, platforms);

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

  // Settle onto whatever is underfoot. The terrace risers are low by design,
  // so easing up to them reads as walking a wide staircase; a hard snap would
  // make the whole figure jitter one step at a time.
  const target = groundHeightAt(walker.x, walker.z, platforms);
  walker.y += (target - walker.y) * Math.min(1, WALKER.climbEase * dt);

  const speedNow = Math.hypot(walker.vx, walker.vz);
  walker.state =
    speedNow < 0.2 ? "idle" : speedNow > WALKER.walkSpeed + 0.5 ? "run" : "walk";
}

let accumulator = 0;
let clock = 0;

export function simulateWalk(
  frameDelta: number,
  blockers: readonly Footprint[],
  platforms: readonly Platform[] = [],
): void {
  accumulator += Math.min(frameDelta, ISO_PHYSICS.step * ISO_PHYSICS.maxSteps);

  let steps = 0;
  while (accumulator >= ISO_PHYSICS.step && steps < ISO_PHYSICS.maxSteps) {
    clock += ISO_PHYSICS.step;
    step(ISO_PHYSICS.step, blockers, platforms);
    accumulator -= ISO_PHYSICS.step;
    steps += 1;
  }
}

export const isoNow = () => clock;

export function resetIsoClock(): void {
  accumulator = 0;
  clock = 0;
}
