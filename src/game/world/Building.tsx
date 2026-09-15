"use client";

import type { Collider } from "../core/collision";
import { PALETTE } from "../fx/palette";
import { Prop } from "./kit/Prop";
import {
  BackWall,
  Box,
  ForegroundPillar,
  Lamp,
  Pillar,
  RoomShell,
  Sign,
} from "./kit/parts";
import {
  ENTRANCE_WIDTH,
  ROOM_HEIGHT,
  SIGN_HEIGHT,
  STAIRCASES,
  STATIONS,
  type Station,
} from "./zones/building";

/** One company: a room, its light, its sign, and its props. */
function StationRoom({ station }: { station: Station }) {
  const { x, width, floorY, light, props } = station;

  return (
    <group>
      <RoomShell x={x} w={width} floorY={floorY} height={ROOM_HEIGHT} />
      <BackWall x={x} w={width} floorY={floorY} height={ROOM_HEIGHT} />

      <Pillar x={x + 1} floorY={floorY} height={ROOM_HEIGHT} />
      <Pillar x={x + width - 1.9} floorY={floorY} height={ROOM_HEIGHT} />

      {/* One warm source per room, hung just below the ceiling. */}
      <Lamp x={x + width / 2} y={floorY + ROOM_HEIGHT - 1.1} color={light} />

      <Sign
        x={station.signX}
        y={floorY + SIGN_HEIGHT}
        text={station.company}
        color={light}
        height={0.56}
      />

      {/* Props spread across the second half of the room, so the doorway and
          the sign stay readable as you walk in. */}
      {props.map((name, i) => (
        <Prop
          key={`${name}-${i}`}
          name={name}
          x={x + 5.5 + i * 2.6}
          floorY={floorY}
          accent={light}
        />
      ))}
    </group>
  );
}

/**
 * The street outside, and the way in.
 *
 * Deliberately not a room: no ceiling, and the facade only covers the right of
 * frame, so the left half is open haze. The player starts as a silhouette
 * against the sky under a single street lamp, with exactly one direction to go.
 */
function Entrance() {
  const left = -ENTRANCE_WIDTH - 4;

  return (
    <group>
      {/* Mass under the pavement. */}
      <Box
        x={left}
        y={-14}
        w={ENTRANCE_WIDTH + 4}
        h={14}
        d={9}
        color={PALETTE.fore}
        castShadow={false}
      />

      {/* The building's face, with a doorway left open at the bottom right. */}
      <Box x={-7.5} y={3.4} w={7.5} h={18} d={2} z={-6} color={PALETTE.far} />
      <Box x={-7.5} y={0} w={0.7} h={3.4} d={2} z={-6} color={PALETTE.far} />

      {/* Behind the doorway: a lit interior, not sky. An opening that shows
          haze through it reads as a window and kills the sense of "inside". */}
      <mesh position={[-3.75, 1.7, -8.5]}>
        <planeGeometry args={[7.5, 3.4]} />
        <meshBasicMaterial color="#6b4a22" />
      </mesh>

      {/* Warm light spilling out of the doorway — the thing you walk towards. */}
      <pointLight
        position={[-3.4, 1.9, -4.5]}
        color={PALETTE.accent}
        intensity={26}
        distance={16}
        decay={2}
      />

      {/* A street lamp. The only other light out here. */}
      <Box x={-11.5} y={0} w={0.26} h={5.2} d={0.26} color={PALETTE.fore} />
      <Lamp x={-11.37} y={5.5} color="#cbd8e2" intensity={34} distance={19} radius={0.26} />

      <Sign x={-6.9} y={4.6} z={-4.8} text="Andrés Aguilar" color={PALETTE.accent} height={0.5} />
    </group>
  );
}

/**
 * Draws a flight from the very colliders the player walks on, so the treads
 * seen and the treads stood on can never disagree.
 */
function Staircase({ steps }: { steps: Collider[] }) {
  const top = steps[steps.length - 1];
  const bottom = steps[0];
  const run = top.x + top.w - bottom.x;

  return (
    <group>
      {steps.map((step, i) => (
        <Box
          key={i}
          x={step.x}
          y={step.y}
          w={step.w}
          h={step.h}
          d={7}
          color={PALETTE.geometry}
        />
      ))}

      {/* Mass under the flight, and a handrail running up alongside it. */}
      <Box
        x={bottom.x}
        y={bottom.y - 13}
        w={run}
        h={13}
        d={7}
        color={PALETTE.fore}
        castShadow={false}
      />
      {steps.map((step, i) => (
        <Box
          key={`rail-${i}`}
          x={step.x}
          y={step.y + step.h + 0.95}
          w={step.w}
          h={0.12}
          d={0.12}
          z={2.6}
          color={PALETTE.fore}
        />
      ))}
    </group>
  );
}

export function Building() {
  return (
    <group>
      <Entrance />

      {STAIRCASES.map((steps, i) => (
        <Staircase key={`stairs-${i}`} steps={steps} />
      ))}

      {STATIONS.map((station) => (
        <StationRoom key={station.id} station={station} />
      ))}

      {/* Foreground occluders. They exist to wipe across the frame as the
          player moves, which is what makes a side-on scene read as deep rather
          than flat — so they sit at the lip of a room, never in the middle of
          a stairwell where they would simply park in front of the action. Every
          other room only: used on all of them they stop reading as depth and
          start reading as a fence. */}
      {STATIONS.filter((_, i) => i % 2 === 1).map((station) => (
        <ForegroundPillar key={`fg-${station.id}`} x={station.x - 1.2} w={1.3} />
      ))}
      <ForegroundPillar x={-7.5} w={1.6} />
    </group>
  );
}
