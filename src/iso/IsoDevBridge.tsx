"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { isoOffset } from "./IsoCamera";
import { placeWalker, simulateWalk, walker } from "./player/walker";
import { BLOCKERS } from "./world/map";
import { input } from "@/game/core/input";

/**
 * Development-only handle for driving and screenshotting the scene without a
 * visible tab — a hidden tab throttles requestAnimationFrame to nothing, so
 * the renderer must be steppable by hand. Stripped from production builds.
 */
export function IsoDevBridge() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    (window as unknown as Record<string, unknown>).__iso = {
      gl,
      scene,
      camera,
      walker,
      input,
      pose(x: number, z: number, settleFrames = 30) {
        placeWalker(x, z);
        for (let i = 0; i < settleFrames; i += 1) simulateWalk(1 / 60, BLOCKERS);
        const offset = isoOffset();
        camera.position.set(walker.x + offset.x, offset.y, walker.z + offset.z);
        camera.lookAt(walker.x, 0, walker.z);
        gl.render(scene, camera);
        return { x: walker.x, z: walker.z };
      },
      /** Frames the whole town rather than following the walker. */
      overview(zoom = 9) {
        const offset = isoOffset();
        camera.position.set(offset.x, offset.y, offset.z);
        camera.lookAt(0, 0, 0);
        (camera as unknown as { zoom: number }).zoom = zoom;
        camera.updateProjectionMatrix();
        gl.render(scene, camera);
        return { zoom };
      },
    };
  }, [gl, scene, camera]);

  return null;
}
