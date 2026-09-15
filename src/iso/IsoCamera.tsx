"use client";

/* eslint-disable react-hooks/immutability -- The camera is three.js renderer
   state, driven by assignment every frame. See the note in game/CameraRig. */

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "three";
import { ISO_CAMERA } from "./core/constants";
import { factorForWheel, zoom, zoomBy } from "./core/zoom";
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
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    // In an orthographic projection zoom is pixels per world unit, so this is
    // what actually decides how much town fits on screen — the camera's
    // distance only affects clipping.
    camera.zoom = size.width / zoom.viewWidth;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useEffect(() => {
    const element = gl.domElement;

    const onWheel = (event: WheelEvent) => {
      // Otherwise the page behind the canvas scrolls on trackpads.
      event.preventDefault();
      zoomBy(factorForWheel(event.deltaY));
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const offset = isoOffset();

    // Follow on the ground plane with a deadzone, so small steps do not shove
    // the whole town around. Height is followed without a deadzone: the
    // terrace risers are small and lagging on them looks like the ground is
    // sliding under the walker.
    const focusX = walker.x;
    const focusZ = walker.z;
    const currentX = camera.position.x - offset.x;
    const currentZ = camera.position.z - offset.z;
    const currentY = camera.position.y - offset.y;

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

    const nextY = damp(currentY, walker.y, ISO_CAMERA.damping, dt);

    // Ease towards the wheel's target rather than snapping, so a fast scroll
    // reads as a move rather than a cut.
    const targetZoom = size.width / zoom.viewWidth;
    if (Math.abs(camera.zoom - targetZoom) > 0.01) {
      camera.zoom = damp(camera.zoom, targetZoom, ISO_CAMERA.zoomEase, dt);
      camera.updateProjectionMatrix();
    }

    camera.position.set(nextX + offset.x, nextY + offset.y, nextZ + offset.z);
    camera.lookAt(nextX, nextY, nextZ);
  });

  return null;
}
