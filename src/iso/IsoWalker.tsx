"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { WALKER } from "./core/constants";
import { simulateWalk, walker } from "./player/walker";
import { useGame } from "@/game/core/store";
import { BLOCKERS, PLATFORMS } from "./world/map";

/**
 * The figure, seen from above and at a distance.
 *
 * At this camera the whole person is about forty pixels tall, so the cues that
 * survive are the outline, the swing of the limbs and which way the body
 * points. Everything here serves one of those three: rounded capsules read
 * better than boxes at small size, the body leans into a run, and a shadow
 * plus a ring pin the feet to a precise spot on the ground.
 */

const H = WALKER.height;
/** Distance covered per full stride. Keeps the feet from skating. */
const STRIDE = 1.9;

const SKIN = "#c98d63";
const HAIR = "#2a2320";
const SHIRT = "#c4543a";
const TROUSERS = "#37414f";
const SHOE = "#22282f";

function Limb({
  radius,
  length,
  color,
}: {
  radius: number;
  length: number;
  color: string;
}) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow>
      <capsuleGeometry args={[radius, length - radius * 2, 4, 10]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

export function IsoWalker() {
  const paused = useGame((s) => s.paused);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const head = useRef<Mesh>(null);
  const shadow = useRef<Mesh>(null);

  const phase = useRef(0);
  const clock = useRef(0);
  const lean = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    // Drives the simulation as well as drawing it. Splitting the two would
    // mean a component whose only job is to tick, and one more place for the
    // wiring to be forgotten.
    if (!paused) simulateWalk(delta, BLOCKERS, PLATFORMS);

    const speed = Math.hypot(walker.vx, walker.vz);
    const running = speed > WALKER.walkSpeed + 0.5;

    phase.current += ((speed * dt) / STRIDE) * Math.PI * 2;
    clock.current += dt;

    if (root.current) {
      root.current.position.set(walker.x, walker.y, walker.z);
      root.current.rotation.y = walker.facing;
    }

    // Two footfalls per stride, so the body dips twice per cycle.
    const dip = speed < 0.2 ? 0 : Math.abs(Math.cos(phase.current)) * (running ? 0.07 : 0.04);
    const breath = speed < 0.2 ? Math.sin(clock.current * 1.7) * 0.012 : 0;

    // Leaning into the run, and easing back out of it, is most of what makes
    // the movement read as effort rather than sliding.
    const targetLean = Math.min(speed / WALKER.runSpeed, 1) * 0.17;
    lean.current += (targetLean - lean.current) * Math.min(1, 6 * dt);

    if (body.current) {
      body.current.position.y = breath - dip;
      body.current.rotation.x = lean.current;
    }
    if (head.current) {
      // The head counter-rotates a little, so it stays level while the body tips.
      head.current.rotation.x = -lean.current * 0.55;
    }
    if (shadow.current) {
      // The shadow stays on the ground and shrinks as the body rises.
      shadow.current.scale.setScalar(1 - dip * 1.4);
    }

    if (speed < 0.2) {
      const sway = Math.sin(clock.current * 1.7) * 0.04;
      if (legL.current) legL.current.rotation.x = 0;
      if (legR.current) legR.current.rotation.x = 0;
      if (armL.current) armL.current.rotation.x = 0.07 + sway;
      if (armR.current) armR.current.rotation.x = -0.07 - sway;
      return;
    }

    const swing = Math.sin(phase.current);
    const amplitude = running ? 0.95 : 0.62;
    if (legL.current) legL.current.rotation.x = swing * amplitude;
    if (legR.current) legR.current.rotation.x = -swing * amplitude;
    if (armL.current) armL.current.rotation.x = -swing * amplitude * 0.8;
    if (armR.current) armR.current.rotation.x = swing * amplitude * 0.8;
  });

  const hip = 0.44 * H;
  const shoulder = 0.78 * H;
  const armLength = 0.31 * H;

  return (
    <group ref={root}>
      {/* A soft contact shadow and a ring. In a top-down view with no horizon
          these are the only precise cue for where the feet actually are. */}
      <mesh
        ref={shadow}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        renderOrder={997}
      >
        <circleGeometry args={[WALKER.radius * 1.15, 20]} />
        <meshBasicMaterial color="#1d2a1c" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        renderOrder={998}
      >
        <ringGeometry args={[WALKER.radius * 1.2, WALKER.radius * 1.45, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* The x-ray silhouette. In a fixed isometric view there is no camera to
          swing around an obstacle, so the moment the walker steps behind
          something they vanish and the player is steering a guess. */}
      <mesh position={[0, 0.62 * H, 0]} renderOrder={999}>
        <capsuleGeometry args={[0.17 * H, 0.7 * H, 4, 10]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.26}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <group ref={body}>
        {/* Torso, rounded rather than boxy — it holds its shape at this size. */}
        <mesh position={[0, (hip + shoulder) / 2, 0]} castShadow>
          <capsuleGeometry args={[0.15 * H, shoulder - hip - 0.06 * H, 4, 12]} />
          <meshStandardMaterial color={SHIRT} roughness={0.95} />
        </mesh>

        <group position={[0, shoulder + 0.15 * H, 0]}>
          <mesh ref={head} castShadow>
            <sphereGeometry args={[0.135 * H, 16, 14]} />
            <meshStandardMaterial color={SKIN} roughness={1} />
          </mesh>
          {/* Hair, as a cap over the crown. */}
          <mesh position={[0, 0.03 * H, -0.01 * H]} castShadow>
            <sphereGeometry args={[0.142 * H, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={HAIR} roughness={1} />
          </mesh>
        </group>

        <group ref={armL} position={[0.16 * H, shoulder, 0]}>
          <Limb radius={0.042 * H} length={armLength} color={SHIRT} />
          <mesh position={[0, -armLength, 0]} castShadow>
            <sphereGeometry args={[0.045 * H, 10, 8]} />
            <meshStandardMaterial color={SKIN} roughness={1} />
          </mesh>
        </group>
        <group ref={armR} position={[-0.16 * H, shoulder, 0]}>
          <Limb radius={0.042 * H} length={armLength} color={SHIRT} />
          <mesh position={[0, -armLength, 0]} castShadow>
            <sphereGeometry args={[0.045 * H, 10, 8]} />
            <meshStandardMaterial color={SKIN} roughness={1} />
          </mesh>
        </group>
      </group>

      <group ref={legL} position={[0.07 * H, hip, 0]}>
        <Limb radius={0.055 * H} length={hip} color={TROUSERS} />
        <mesh position={[0, -hip + 0.02 * H, 0.03 * H]} castShadow>
          <boxGeometry args={[0.1 * H, 0.05 * H, 0.16 * H]} />
          <meshStandardMaterial color={SHOE} roughness={1} />
        </mesh>
      </group>
      <group ref={legR} position={[-0.07 * H, hip, 0]}>
        <Limb radius={0.055 * H} length={hip} color={TROUSERS} />
        <mesh position={[0, -hip + 0.02 * H, 0.03 * H]} castShadow>
          <boxGeometry args={[0.1 * H, 0.05 * H, 0.16 * H]} />
          <meshStandardMaterial color={SHOE} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
