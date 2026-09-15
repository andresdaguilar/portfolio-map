"use client";

import { PALETTE } from "../../fx/palette";
import { Box } from "./parts";

/**
 * Set dressing, drawn from primitives.
 *
 * Every prop is a silhouette: at this palette and lighting the visitor reads
 * outlines, not surfaces, so a server rack is a tall slotted box and a desk is
 * an L. That is also why none of this needs a modeller — the look does the
 * work that geometry usually has to.
 *
 * Names come from `set.props` in the content layer. Anything unrecognised
 * falls back to a crate rather than vanishing, so a typo is visible.
 *
 * Everything is pushed behind the play plane. Props sharing z=0 with the
 * player swallow the character whole — the one silhouette that must always
 * read is the one the visitor is steering.
 */
const PROP_Z = -2.6;

export function Prop({
  name,
  x,
  floorY,
  accent,
}: {
  name: string;
  x: number;
  floorY: number;
  accent: string;
}) {
  return (
    <group position={[0, 0, PROP_Z]}>
      <PropShape name={name} x={x} floorY={floorY} accent={accent} />
    </group>
  );
}

function PropShape({
  name,
  x,
  floorY,
  accent,
}: {
  name: string;
  x: number;
  floorY: number;
  accent: string;
}) {
  const g = PALETTE.geometry;

  switch (name) {
    case "server-rack":
    case "mainframe":
      return (
        <group>
          <Box x={x} y={floorY} w={1.5} h={3.4} d={2} color={g} />
          {[0.5, 1.2, 1.9, 2.6].map((dy) => (
            <mesh key={dy} position={[x + 0.75, floorY + dy, 1.05]}>
              <planeGeometry args={[1.1, 0.12]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          ))}
        </group>
      );

    case "crt-terminal":
    case "amber-screen":
    case "kanban-screen":
    case "revenue-chart":
    case "payment-terminal":
      return (
        <group>
          <Box x={x} y={floorY} w={1.4} h={0.9} d={1.6} color={g} />
          <Box x={x + 0.2} y={floorY + 0.9} w={1} h={0.85} d={1.2} color={g} />
          <mesh position={[x + 0.7, floorY + 1.32, 0.65]}>
            <planeGeometry args={[0.72, 0.52]} />
            <meshBasicMaterial color={accent} />
          </mesh>
        </group>
      );

    case "desk":
    case "standing-desk":
    case "open-space-desks":
    case "monitor-row":
      return (
        <group>
          <Box x={x} y={floorY + 0.85} w={3} h={0.14} d={2} color={g} />
          <Box x={x + 0.1} y={floorY} w={0.16} h={0.85} d={2} color={g} />
          <Box x={x + 2.75} y={floorY} w={0.16} h={0.85} d={2} color={g} />
          <mesh position={[x + 1.5, floorY + 1.4, 0.4]}>
            <planeGeometry args={[0.9, 0.6]} />
            <meshBasicMaterial color={accent} />
          </mesh>
        </group>
      );

    case "whiteboard":
    case "safe-board":
    case "founder-plaque":
    case "gps-map-wall":
    case "world-map":
      return (
        <mesh position={[x + 1.4, floorY + 2.4, -1.1]}>
          <planeGeometry args={[2.8, 1.8]} />
          <meshStandardMaterial color={PALETTE.far} emissive={accent} emissiveIntensity={0.12} roughness={1} />
        </mesh>
      );

    case "conveyor":
      return (
        <group>
          <Box x={x} y={floorY + 0.7} w={5} h={0.2} d={2.4} color={g} />
          {[0.4, 1.6, 2.8, 4].map((dx) => (
            <Box key={dx} x={x + dx} y={floorY} w={0.18} h={0.7} d={2.4} color={g} />
          ))}
        </group>
      );

    case "industrial-pipe":
    case "ceiling-grid":
      return (
        <mesh position={[x + 3, floorY + 5.4, -2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 6, 10]} />
          <meshStandardMaterial color={g} roughness={0.9} />
        </mesh>
      );

    case "fuel-dispenser":
      return (
        <group>
          <Box x={x} y={floorY} w={1.2} h={2.2} d={1.6} color={g} />
          <mesh position={[x + 0.6, floorY + 1.7, 0.85]}>
            <planeGeometry args={[0.7, 0.4]} />
            <meshBasicMaterial color={accent} />
          </mesh>
          <Box x={x + 1.2} y={floorY + 1.2} w={0.6} h={0.12} d={0.4} color={g} />
        </group>
      );

    case "chair-grid-25":
      return (
        <group>
          {Array.from({ length: 6 }, (_, i) => (
            <group key={i}>
              <Box x={x + i * 1.6} y={floorY} w={0.5} h={0.45} d={1} color={g} />
              <Box x={x + i * 1.6} y={floorY + 0.45} w={0.12} h={0.7} d={1} color={g} />
            </group>
          ))}
        </group>
      );

    case "pin-cluster":
    case "moving-dots":
      return (
        <group>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={i}
              position={[x + (i % 4) * 0.7, floorY + 2.2 + Math.floor(i / 4) * 0.6, -0.9]}
            >
              <circleGeometry args={[0.07, 8]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          ))}
        </group>
      );

    case "glass-wall":
    case "bright-office":
    case "open-door":
    case "big-room":
    case "canopy-light":
    case "warm-lamp":
    case "flickering-tube":
      // Handled by the room's own lighting rather than by an object.
      return null;

    case "paper-stack":
    case "crate-stack":
    default:
      return (
        <group>
          <Box x={x} y={floorY} w={1.1} h={0.9} d={1.6} color={g} />
          <Box x={x + 0.2} y={floorY + 0.9} w={0.8} h={0.7} d={1.3} color={g} />
        </group>
      );
  }
}
