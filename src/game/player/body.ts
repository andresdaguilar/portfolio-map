import { PHYSICS, PLAYER } from "../core/constants";
import {
  type Box,
  type Collider,
  isGrounded,
  ladderAt,
  moveAndCollide,
} from "../core/collision";
import { input } from "../core/input";

export type MotionState = "idle" | "walk" | "run" | "jump" | "fall" | "climb";

export interface PlayerBody {
  /** Horizontal centre. */
  x: number;
  /** Bottom edge — feet. */
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  onLadder: boolean;
  /** 1 facing right, -1 facing left. Never 0, so the model never snaps flat. */
  facing: 1 | -1;
  /** How long the current direction has been held, for the walk→run ramp. */
  holdTime: number;
  /** Last moment the player was on the ground, for coyote time. */
  lastGrounded: number;
  state: MotionState;
}

/**
 * Module-level, like `input`. The camera, the interaction system and the
 * renderer all read the player's position every frame; putting it in React
 * state would re-render the world tree at simulation rate.
 */
export const player: PlayerBody = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  grounded: false,
  onLadder: false,
  facing: 1,
  holdTime: 0,
  lastGrounded: -Infinity,
  state: "idle",
};

/**
 * Where the player returns to if they fall out of the world. Set whenever the
 * player lands somewhere safe, so a fall drops them back at the last solid
 * ground rather than at the very start of the building.
 */
const checkpoint = { x: 0, y: 0 };

/** Anything below this is out of bounds. No level floor sits near it. */
const KILL_Y = -30;

export function setCheckpoint(x: number, y: number): void {
  checkpoint.x = x;
  checkpoint.y = y;
}

export function placePlayer(x: number, y: number): void {
  player.x = x;
  player.y = y;
  player.vx = 0;
  player.vy = 0;
  player.holdTime = 0;
  player.onLadder = false;
  setCheckpoint(x, y);
}

export function playerBox(): Box {
  return {
    x: player.x - PLAYER.width / 2,
    y: player.y,
    w: PLAYER.width,
    h: PLAYER.height,
  };
}

/** True when there is floor under the player a stride to either side. */
function hasRoomEitherSide(colliders: readonly Collider[]): boolean {
  const probe = (offset: number) =>
    isGrounded(
      {
        x: player.x + offset - PLAYER.width / 2,
        y: player.y,
        w: PLAYER.width,
        h: PLAYER.height,
      },
      colliders,
    );
  return probe(-1) && probe(1);
}

function approach(current: number, target: number, rate: number, dt: number) {
  const delta = target - current;
  const step = rate * dt;
  return Math.abs(delta) <= step ? target : current + Math.sign(delta) * step;
}

/** One fixed simulation step. `time` is seconds since the game started. */
function step(dt: number, time: number, colliders: readonly Collider[]): void {
  const box = playerBox();
  const ladder = ladderAt(box, colliders);

  // --- Ladders ---
  // Grabbing needs intent: standing in front of one does nothing until the
  // player pushes up or down, otherwise walking past a ladder snags you.
  if (ladder && input.moveY !== 0) player.onLadder = true;
  if (!ladder) player.onLadder = false;

  if (player.onLadder && ladder) {
    // Jumping off a ladder pushes away from it rather than straight up.
    if (time - input.jumpAt < PLAYER.jumpBuffer) {
      player.onLadder = false;
      player.vy = PLAYER.jumpVelocity * 0.75;
      player.vx = input.moveX * PLAYER.walkSpeed;
      input.jumpAt = -Infinity;
    } else {
      player.vy = input.moveY * PLAYER.climbSpeed;
      // Centre the player on the ladder so the climb does not look drunk.
      const centre = ladder.x + ladder.w / 2;
      player.x = approach(player.x, centre, 6, dt);
      player.vx = 0;
    }
  }

  if (!player.onLadder) {
    // --- Horizontal ---
    const wantsMove = input.moveX !== 0;
    player.holdTime = wantsMove ? player.holdTime + dt : 0;

    const speed =
      player.holdTime > PLAYER.runAfter ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const target = input.moveX * speed;
    const rate = !player.grounded
      ? PLAYER.airAccel
      : wantsMove
        ? PLAYER.accel
        : PLAYER.brake;
    player.vx = approach(player.vx, target, rate, dt);

    // --- Vertical ---
    const canCoyote = time - player.lastGrounded < PLAYER.coyoteTime;
    const bufferedJump = time - input.jumpAt < PLAYER.jumpBuffer;
    if (bufferedJump && (player.grounded || canCoyote)) {
      player.vy = PLAYER.jumpVelocity;
      player.grounded = false;
      player.lastGrounded = -Infinity;
      input.jumpAt = -Infinity;
    }

    player.vy -= PHYSICS.gravity * dt;

    // Releasing the jump key early cuts the arc — the standard variable-height
    // jump. Without it every jump is the same height and feels robotic.
    if (player.vy > 0 && !input.jumpHeld) player.vy -= PHYSICS.gravity * 1.6 * dt;

    player.vy = Math.max(player.vy, -PHYSICS.maxFall);
  }

  const moved = moveAndCollide(
    playerBox(),
    player.vx * dt,
    player.vy * dt,
    player.vx,
    player.vy,
    colliders,
    // Only walk up ledges while on foot: stepping mid-air would let the player
    // climb a wall by pressing into it, and stepping on a ladder fights the climb.
    player.grounded && !player.onLadder ? PLAYER.stepHeight : 0,
  );

  player.x = moved.x + PLAYER.width / 2;
  player.y = moved.y;
  player.vx = moved.vx;
  player.vy = moved.vy;
  player.grounded = player.onLadder
    ? false
    : moved.grounded || isGrounded(playerBox(), colliders);

  if (player.grounded) {
    player.lastGrounded = time;
    // Only remember ground with room on both sides. Checkpointing on the lip of
    // a drop means respawning onto the same lip and falling straight back in.
    if (Math.abs(player.vy) < 0.01 && hasRoomEitherSide(colliders)) {
      setCheckpoint(player.x, player.y);
    }
  }
  if (input.moveX !== 0) player.facing = input.moveX > 0 ? 1 : -1;

  // Falling out of the world is the one failure state that must never strand
  // the visitor. Put them back on the last ground they stood on.
  if (player.y < KILL_Y) {
    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.onLadder = false;
  }

  // --- Animation state ---
  if (player.onLadder) {
    player.state = "climb";
  } else if (!player.grounded) {
    player.state = player.vy > 0 ? "jump" : "fall";
  } else if (Math.abs(player.vx) < 0.15) {
    player.state = "idle";
  } else {
    player.state =
      Math.abs(player.vx) > PLAYER.walkSpeed + 0.4 ? "run" : "walk";
  }
}

let accumulator = 0;
let clock = 0;

/**
 * Advances the simulation by a frame's worth of time in fixed steps.
 *
 * Fixed steps keep the feel identical on a 60Hz laptop and a 120Hz phone; the
 * leftover time stays in the accumulator rather than stretching a step.
 */
export function simulate(frameDelta: number, colliders: readonly Collider[]): void {
  // A backgrounded tab returns one enormous delta. Clamp rather than teleport.
  accumulator += Math.min(frameDelta, PHYSICS.step * PHYSICS.maxSteps);

  let steps = 0;
  while (accumulator >= PHYSICS.step && steps < PHYSICS.maxSteps) {
    clock += PHYSICS.step;
    step(PHYSICS.step, clock, colliders);
    accumulator -= PHYSICS.step;
    steps += 1;
  }
}

export const now = () => clock;

export function resetClock(): void {
  accumulator = 0;
  clock = 0;
}
