"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { PALETTE } from "../fx/palette";
import { PLAYER } from "../core/constants";
import { player } from "./body";

/**
 * The character, built from primitives and animated in code.
 *
 * A rigged model is the eventual answer, but the silhouette carries this look
 * entirely — the visitor never sees a face, a texture or a material, only an
 * outline moving with weight. That outline is cheap to build out of boxes and,
 * unlike an imported rig, it costs nothing to load and cannot fail to fetch.
 *
 * Limbs pivot from their joint: each is a group positioned at the shoulder or
 * hip, with the geometry hanging below it, so rotating the group swings the
 * limb the way a body does.
 */

const H = PLAYER.height;
/** Distance covered per full stride, in units. Keeps the feet from skating. */
const STRIDE = 1.75;

const HEAD_R = 0.135 * H;
const HIP_Y = 0.46 * H;
const SHOULDER_Y = 0.79 * H;
const LEG = HIP_Y;
const ARM = 0.3 * H;

function Limb({
  length,
  width,
  color,
}: {
  length: number;
  width: number;
  color: string;
}) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow>
      <boxGeometry args={[width, length, width]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} />
    </mesh>
  );
}

export function Character() {
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Mesh>(null);

  // Advances with distance travelled, not with time, so the stride matches the
  // ground speed at any velocity.
  const phase = useRef(0);
  const bob = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const speed = Math.abs(player.vx);

    phase.current += (player.vx * dt) / STRIDE * Math.PI * 2;
    bob.current += dt;

    const swing = Math.sin(phase.current);
    const counter = Math.sin(phase.current + Math.PI);

    if (player.state === "climb") {
      // Reaching hand over hand, driven by vertical movement.
      const climb = Math.sin(bob.current * 6);
      if (armL.current) armL.current.rotation.x = -2.4 + climb * 0.5;
      if (armR.current) armR.current.rotation.x = -2.4 - climb * 0.5;
      if (legL.current) legL.current.rotation.x = 0.35 - climb * 0.3;
      if (legR.current) legR.current.rotation.x = 0.35 + climb * 0.3;
      if (torso.current) torso.current.position.y = 0;
      return;
    }

    if (!player.grounded) {
      // Rising: legs gathered, arms trailing. Falling: reaching for the floor.
      const rising = player.vy > 0;
      const tuck = rising ? 0.9 : 0.25;
      if (legL.current) legL.current.rotation.x = -tuck;
      if (legR.current) legR.current.rotation.x = tuck * 0.5;
      if (armL.current) armL.current.rotation.x = rising ? -0.9 : -1.9;
      if (armR.current) armR.current.rotation.x = rising ? -1.2 : -2.1;
      if (torso.current) torso.current.position.y = 0;
      return;
    }

    if (speed < 0.15) {
      // Idle: the limbs settle and the chest rises. Stillness that is fully
      // still reads as a frozen model rather than a person waiting.
      const breath = Math.sin(bob.current * 1.6) * 0.02;
      if (legL.current) legL.current.rotation.x = 0;
      if (legR.current) legR.current.rotation.x = 0;
      if (armL.current) armL.current.rotation.x = 0.06;
      if (armR.current) armR.current.rotation.x = -0.06;
      if (torso.current) torso.current.position.y = breath;
      if (head.current) head.current.position.y = SHOULDER_Y + HEAD_R * 1.1 + breath;
      return;
    }

    // Walking and running share a cycle; the run just swings further and the
    // body leans into it.
    const running = speed > PLAYER.walkSpeed + 0.4;
    const amplitude = running ? 0.95 : 0.55;

    if (legL.current) legL.current.rotation.x = swing * amplitude;
    if (legR.current) legR.current.rotation.x = counter * amplitude;
    if (armL.current) armL.current.rotation.x = counter * amplitude * 0.8;
    if (armR.current) armR.current.rotation.x = swing * amplitude * 0.8;

    // Two footfalls per stride, so the body dips twice per cycle.
    const dip = Math.abs(Math.cos(phase.current)) * (running ? 0.07 : 0.04);
    if (torso.current) torso.current.position.y = -dip;
    if (head.current) head.current.position.y = SHOULDER_Y + HEAD_R * 1.1 - dip;
  });

  const c = PALETTE.silhouette;

  return (
    <group>
      <group ref={torso}>
        <mesh position={[0, (HIP_Y + SHOULDER_Y) / 2, 0]} castShadow>
          <boxGeometry args={[0.26 * H, SHOULDER_Y - HIP_Y + 0.06 * H, 0.17 * H]} />
          <meshStandardMaterial color={c} roughness={1} metalness={0} />
        </mesh>
        <mesh ref={head} position={[0, SHOULDER_Y + HEAD_R * 1.1, 0]} castShadow>
          <sphereGeometry args={[HEAD_R, 14, 12]} />
          <meshStandardMaterial color={c} roughness={1} metalness={0} />
        </mesh>
      </group>

      <group ref={armL} position={[0.085 * H, SHOULDER_Y, 0.05 * H]}>
        <Limb length={ARM} width={0.062 * H} color={c} />
      </group>
      <group ref={armR} position={[-0.085 * H, SHOULDER_Y, -0.05 * H]}>
        <Limb length={ARM} width={0.062 * H} color={c} />
      </group>

      <group ref={legL} position={[0.05 * H, HIP_Y, 0.04 * H]}>
        <Limb length={LEG} width={0.075 * H} color={c} />
      </group>
      <group ref={legR} position={[-0.05 * H, HIP_Y, -0.04 * H]}>
        <Limb length={LEG} width={0.075 * H} color={c} />
      </group>
    </group>
  );
}
