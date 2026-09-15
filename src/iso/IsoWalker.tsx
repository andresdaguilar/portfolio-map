"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { WALKER } from "./core/constants";
import { walker } from "./player/walker";

/**
 * The figure, seen from above and at a distance.
 *
 * Far less detail is legible here than in the side-scroller — at this camera
 * the whole person is about forty pixels tall — so the readable cues are the
 * silhouette's width, the swing of the limbs, and which way the body points.
 */

const H = WALKER.height;
const STRIDE = 1.9;

export function IsoWalker() {
  const root = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const phase = useRef(0);
  const bob = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const speed = Math.hypot(walker.vx, walker.vz);

    phase.current += (speed * dt) / STRIDE * Math.PI * 2;
    bob.current += dt;

    if (root.current) {
      root.current.position.set(walker.x, 0, walker.z);
      root.current.rotation.y = walker.facing;
    }

    if (speed < 0.2) {
      const breath = Math.sin(bob.current * 1.6) * 0.015;
      if (legL.current) legL.current.rotation.x = 0;
      if (legR.current) legR.current.rotation.x = 0;
      if (armL.current) armL.current.rotation.x = 0.05;
      if (armR.current) armR.current.rotation.x = -0.05;
      if (root.current) root.current.position.y = breath;
      return;
    }

    const swing = Math.sin(phase.current);
    const amplitude = speed > WALKER.walkSpeed + 0.5 ? 0.95 : 0.6;
    if (legL.current) legL.current.rotation.x = swing * amplitude;
    if (legR.current) legR.current.rotation.x = -swing * amplitude;
    if (armL.current) armL.current.rotation.x = -swing * amplitude * 0.75;
    if (armR.current) armR.current.rotation.x = swing * amplitude * 0.75;
    if (root.current) {
      root.current.position.y = Math.abs(Math.cos(phase.current)) * 0.05;
    }
  });

  const skin = "#2c3440";
  const cloth = "#d8603f";

  return (
    <group ref={root}>
      {/* A ring on the ground. At this distance it is the only reliable way to
          tell exactly where the figure is standing. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        renderOrder={998}
      >
        <ringGeometry args={[WALKER.radius * 1.15, WALKER.radius * 1.45, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.45}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* The x-ray silhouette.
          In a fixed isometric view there is no camera to swing around an
          obstacle, so the moment the walker steps behind a roof they vanish and
          the player is steering a guess. Drawing this copy with depth testing
          off keeps a readable ghost on top of whatever is in the way — the same
          trick the strategy games this borrows from use for units behind
          buildings. */}
      <mesh position={[0, 0.62 * H, 0]} renderOrder={999}>
        <capsuleGeometry args={[0.16 * H, 0.72 * H, 4, 10]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.32}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.46 * H + (0.79 - 0.46) * H * 0.5, 0]} castShadow>
        <boxGeometry args={[0.3 * H, 0.38 * H, 0.2 * H]} />
        <meshStandardMaterial color={cloth} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.79 * H + 0.15 * H, 0]} castShadow>
        <sphereGeometry args={[0.14 * H, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={1} />
      </mesh>

      <group ref={armL} position={[0.095 * H, 0.79 * H, 0]}>
        <mesh position={[0, -0.15 * H, 0]} castShadow>
          <boxGeometry args={[0.065 * H, 0.3 * H, 0.065 * H]} />
          <meshStandardMaterial color={cloth} roughness={0.9} />
        </mesh>
      </group>
      <group ref={armR} position={[-0.095 * H, 0.79 * H, 0]}>
        <mesh position={[0, -0.15 * H, 0]} castShadow>
          <boxGeometry args={[0.065 * H, 0.3 * H, 0.065 * H]} />
          <meshStandardMaterial color={cloth} roughness={0.9} />
        </mesh>
      </group>

      <group ref={legL} position={[0.055 * H, 0.46 * H, 0]}>
        <mesh position={[0, -0.23 * H, 0]} castShadow>
          <boxGeometry args={[0.08 * H, 0.46 * H, 0.08 * H]} />
          <meshStandardMaterial color={skin} roughness={1} />
        </mesh>
      </group>
      <group ref={legR} position={[-0.055 * H, 0.46 * H, 0]}>
        <mesh position={[0, -0.23 * H, 0]} castShadow>
          <boxGeometry args={[0.08 * H, 0.46 * H, 0.08 * H]} />
          <meshStandardMaterial color={skin} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
