"use client";

/* eslint-disable react-hooks/immutability -- The camera is three.js renderer
   state, driven by assignment every frame. See the note in game/CameraRig. */

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "three";
import { ISO_CAMERA } from "./core/constants";
import { walker } from "./player/walker";

/**
 * Where the camera sits relative to whatever it is looking at.
 *
 * Fixed for the whole game: an isometric view that rotates stops being
 * isometric, and the controls stop making sense with it.
 */
export function isoOffset(distance = ISO_CAMERA.distance) {
  const { azimuth, elevation } = ISO_CAMERA;
  const horizontal = Math.cos(elevation) * distance;
  return {
    x: horizontal * Math.sin(azimuth),
    y: Math.sin(elevation) * distance,
    z: horizontal * Math.cos(azimuth),
  };
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function IsoCamera() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    // In an orthographic projection zoom is pixels per world unit, so this is
    // what actually decides how much town fits on screen — the camera's
    // distance only affects clipping.
    camera.zoom = size.width / ISO_CAMERA.viewWidth;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const offset = isoOffset();

    // Follow on the ground plane with a deadzone, so small steps do not shove
    // the whole town around.
    const focusX = walker.x;
    const focusZ = walker.z;
    const currentX = camera.position.x - offset.x;
    const currentZ = camera.position.z - offset.z;

    const dx = focusX - currentX;
    const dz = focusZ - currentZ;
    const distance = Math.hypot(dx, dz);

    let targetX = currentX;
    let targetZ = currentZ;
    if (distance > ISO_CAMERA.deadzone) {
      const pull = (distance - ISO_CAMERA.deadzone) / distance;
      targetX = currentX + dx * pull;
      targetZ = currentZ + dz * pull;
    }

    const nextX = damp(currentX, targetX, ISO_CAMERA.damping, dt);
    const nextZ = damp(currentZ, targetZ, ISO_CAMERA.damping, dt);

    camera.position.set(nextX + offset.x, offset.y, nextZ + offset.z);
    camera.lookAt(nextX, 0, nextZ);
  });

  return null;
}
