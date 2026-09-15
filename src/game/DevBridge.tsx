"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PLAYER } from "./core/constants";
import type { Collider } from "./core/collision";
import { placePlayer, player, simulate } from "./player/body";
import { input } from "./core/input";

/**
 * Development-only handle onto the running scene.
 *
 * Browsers throttle `requestAnimationFrame` to nothing in a hidden tab, so a
 * headless harness can hold a fully mounted scene that has never drawn a
 * frame. This exposes a manual step-and-render so the world can be posed and
 * inspected without depending on the tab being visible.
 *
 * Renders nothing and is stripped from production builds.
 */
export function DevBridge({ colliders }: { colliders: readonly Collider[] }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const bridge = {
      gl,
      scene,
      camera,
      player,
      input,
      placePlayer,
      /** Advances the simulation and draws one frame, ignoring rAF. */
      step(seconds = 1 / 60, frames = 1) {
        for (let i = 0; i < frames; i += 1) simulate(seconds, colliders);
        gl.render(scene, camera);
      },
      /** Drops the player somewhere, settles the camera, and draws. */
      pose(x: number, y: number, settleFrames = 90) {
        placePlayer(x, y);
        for (let i = 0; i < settleFrames; i += 1) simulate(1 / 60, colliders);
        camera.position.x = player.x;
        camera.position.y = player.y + PLAYER.height / 2;
        camera.lookAt(camera.position.x, camera.position.y, 0);
        gl.render(scene, camera);
        return { x: player.x, y: player.y, grounded: player.grounded };
      },
    };

    (window as unknown as Record<string, unknown>).__r3f = bridge;
  }, [gl, scene, camera, colliders]);

  return null;
}
