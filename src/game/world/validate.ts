import { PLAYER } from "../core/constants";
import type { Collider } from "../core/collision";

export interface LevelProblem {
  kind: "ladder-trap" | "unreachable-gap";
  detail: string;
}

/**
 * Catches level-authoring mistakes that are invisible until someone walks into
 * them.
 *
 * The one that bit first: a ladder running up into a solid floor. The climber
 * reaches exactly `floorY - playerHeight` and sticks there with no way up and
 * no feedback about why. Every ladder needs a hatch in whatever it passes
 * through, and with six zones to build this needs to be checked by machine.
 */
export function findLadderTraps(colliders: readonly Collider[]): LevelProblem[] {
  const ladders = colliders.filter((c) => c.kind === "ladder");
  const blockers = colliders.filter(
    (c) => c.kind === "solid" || c.kind === "platform",
  );
  const problems: LevelProblem[] = [];

  for (const ladder of ladders) {
    const top = ladder.y + ladder.h;

    for (const floor of blockers) {
      // Only floors the ladder actually passes through, not the one it lands on.
      const passesThrough = floor.y > ladder.y && floor.y + floor.h < top;
      if (!passesThrough) continue;

      const overlapsColumn =
        floor.x < ladder.x + ladder.w && floor.x + floor.w > ladder.x;
      if (!overlapsColumn) continue;

      problems.push({
        kind: "ladder-trap",
        detail: `Ladder at x=${ladder.x} runs through a floor at y=${floor.y} with no hatch; a climber jams at y=${(floor.y - PLAYER.height).toFixed(2)}.`,
      });
    }

    // The ladder must also reach high enough to step off at the top.
    const landing = blockers.find(
      (f) =>
        Math.abs(f.y + f.h - top) < PLAYER.height &&
        f.y + f.h <= top + 0.6 &&
        f.y + f.h > ladder.y + 1 &&
        (f.x < ladder.x + ladder.w + 1.5 && f.x + f.w > ladder.x - 1.5),
    );
    if (landing && top < landing.y + landing.h) {
      problems.push({
        kind: "ladder-trap",
        detail: `Ladder at x=${ladder.x} stops at y=${top} but its landing is at y=${landing.y + landing.h}; extend the ladder past the floor so the player can step off.`,
      });
    }
  }

  return problems;
}
