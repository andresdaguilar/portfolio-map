"use client";

/* eslint-disable react-hooks/immutability -- The camera is a three.js object
   living in the renderer's scene graph, not a React value. Driving it means
   assigning to it every frame; there is no immutable equivalent, and copying it
   into state would re-render the whole tree at frame rate. This is the
   documented way to drive a camera in React Three Fiber. */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { CAMERA } from "./core/constants";
import { followPlayer, visibleHalfHeight } from "./core/camera";
import { player } from "./player/body";

/**
 * Picks the vertical field of view that shows `targetWidth` units across at
 * the current aspect ratio, clamped so the lens never gets absurd.
 *
 * A fixed vertical fov behaves badly on phones: the horizontal slice collapses
 * as the screen gets taller, which is exactly backwards for a side-scroller.
 */
export function fovForAspect(aspect: number): number {
  const toDegrees = (radians: number) => radians * (180 / Math.PI);

  const forWidth = toDegrees(
    2 * Math.atan(CAMERA.targetWidth / 2 / aspect / CAMERA.distance),
  );
  const forHeight = toDegrees(
    2 * Math.atan(CAMERA.maxVisibleHeight / 2 / CAMERA.distance),
  );
  const forMinWidth = toDegrees(
    2 * Math.atan(CAMERA.minVisibleWidth / 2 / aspect / CAMERA.distance),
  );

  // Show the intended width, but do not frame more height than a room can
  // fill — unless honouring that would squeeze the playable width below what a
  // side-scroller needs, which is what happens on a phone held upright.
  const fov = Math.max(Math.min(forWidth, forHeight), forMinWidth);
  return Math.min(CAMERA.fovMax, Math.max(CAMERA.fovMin, fov));
}

/** Follows the player. The maths lives in `core/camera.ts` and is tested there. */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const halfHeight = useRef(visibleHalfHeight(CAMERA.fov));

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const fov = fovForAspect(size.width / size.height);
    halfHeight.current = visibleHalfHeight(fov);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame((_, delta) => {
    // Long frames would make the damping overshoot.
    const dt = Math.min(delta, 1 / 20);

    const next = followPlayer(
      { x: camera.position.x, y: camera.position.y },
      {
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        facing: player.facing,
        grounded: player.grounded,
      },
      dt,
      halfHeight.current,
    );

    camera.position.x = next.x;
    camera.position.y = next.y;
    camera.position.z = CAMERA.distance;
    // Straight-on. Any tilt would break the flat 2.5D read.
    camera.lookAt(next.x, next.y, 0);
  });

  return null;
}
