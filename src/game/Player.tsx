"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PHYSICS, PLAYER } from "./core/constants";
import { placePlayer, player, simulate } from "./player/body";
import { Character } from "./player/Character";
import type { Collider } from "./core/collision";
import { useGame } from "./core/store";
import { input } from "./core/input";

/**
 * Drives the simulation and draws the character.
 *
 * The capsule is a stand-in for the rigged model that lands in Phase 2 — but
 * it is already the right size and the right colour, because the silhouette is
 * what the whole look rests on and it should be judged from the start.
 */
export function Player({ colliders }: { colliders: readonly Collider[] }) {
  const group = useRef<Group>(null);
  const paused = useGame((s) => s.paused);

  // The simulation is pure: given a delta and a collider list it advances the
  // body and nothing else. Exposing it in dev lets the controller be driven
  // with fixed deltas and asserted on, without depending on a visible tab —
  // a hidden tab throttles requestAnimationFrame to nothing.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const w = window as unknown as Record<string, unknown>;
    w.__sim = { player, simulate, colliders, input, placePlayer, PLAYER, PHYSICS };
  }, [colliders]);

  useFrame((_, delta) => {
    if (!paused) simulate(delta, colliders);
    if (!group.current) return;
    group.current.position.set(player.x, player.y, 0);
    // Turning is instant. Inside's boy pivots on the spot; easing it reads as ice.
    group.current.scale.x = player.facing;
  });

  return (
    <group ref={group}>
      <Character />
    </group>
  );
}
