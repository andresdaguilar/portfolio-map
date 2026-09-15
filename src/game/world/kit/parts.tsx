"use client";

import { useEffect, useMemo } from "react";
import { DoubleSide } from "three";
import { PALETTE } from "../../fx/palette";
import { DEPTH } from "../../core/constants";
import { makeTextTexture } from "./textTexture";

/** A plain box. The whole building is made of these. */
export function Box({
  x,
  y,
  z = 0,
  w,
  h,
  d = 4,
  color = PALETTE.geometry,
  receiveShadow = true,
  castShadow = true,
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  h: number;
  d?: number;
  color?: string;
  receiveShadow?: boolean;
  castShadow?: boolean;
}) {
  return (
    <mesh
      position={[x + w / 2, y + h / 2, z]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.95} metalness={0} />
    </mesh>
  );
}

/**
 * The back wall of a room, built as segments with gaps left for windows.
 *
 * The gaps are the point. Solid walls make the frame black on black; an
 * opening lets the haze plane through and gives every silhouette in front of
 * it an edge. Rooms are lit as much by their holes as by their lamps.
 */
export function BackWall({
  x,
  w,
  floorY,
  height,
  windowEvery = 5.5,
  windowWidth = 2.6,
  sillHeight = 1.8,
  windowHeight = 2.6,
}: {
  x: number;
  w: number;
  floorY: number;
  height: number;
  windowEvery?: number;
  windowWidth?: number;
  sillHeight?: number;
  windowHeight?: number;
}) {
  const segments = useMemo(() => {
    const gaps: Array<[number, number]> = [];
    // Centre the run of windows in the wall rather than starting at the edge.
    const count = Math.max(1, Math.floor(w / windowEvery));
    const span = count * windowEvery;
    const start = x + (w - span) / 2 + (windowEvery - windowWidth) / 2;
    for (let i = 0; i < count; i += 1) {
      const left = start + i * windowEvery;
      gaps.push([left, left + windowWidth]);
    }

    const pieces: Array<{ x: number; w: number }> = [];
    let cursor = x;
    for (const [left, right] of gaps) {
      if (left > cursor) pieces.push({ x: cursor, w: left - cursor });
      cursor = right;
    }
    if (cursor < x + w) pieces.push({ x: cursor, w: x + w - cursor });
    return pieces;
  }, [x, w, windowEvery, windowWidth]);

  const top = floorY + sillHeight + windowHeight;

  return (
    <group>
      {/* Below the sills and above the heads: full-width bands. */}
      <Box x={x} y={floorY} w={w} h={sillHeight} z={DEPTH.background} d={1.5} color={PALETTE.far} />
      <Box x={x} y={top} w={w} h={Math.max(0, floorY + height - top)} z={DEPTH.background} d={1.5} color={PALETTE.far} />
      {/* Piers between the windows. */}
      {segments.map((s, i) => (
        <Box
          key={i}
          x={s.x}
          y={floorY + sillHeight}
          w={s.w}
          h={windowHeight}
          z={DEPTH.background}
          d={1.5}
          color={PALETTE.far}
        />
      ))}
    </group>
  );
}

/** Floor slab and ceiling for one room, seen in cut-away. */
export function RoomShell({
  x,
  w,
  floorY,
  height,
}: {
  x: number;
  w: number;
  floorY: number;
  height: number;
}) {
  return (
    <group>
      {/* Mass under the floor, so the building does not look like it floats. */}
      <Box x={x} y={floorY - 14} w={w} h={14} d={9} color={PALETTE.basement} castShadow={false} />
      {/* A lip at the floor line. Without an edge to catch the light the slab
          and the storey below it merge into one dark shape. */}
      <Box
        x={x - 0.15}
        y={floorY - 0.55}
        w={w + 0.3}
        h={0.55}
        d={9.4}
        color={PALETTE.geometry}
        castShadow={false}
      />
      <Box x={x} y={floorY + height} w={w} h={0.9} d={9} color={PALETTE.geometry} />
    </group>
  );
}

/**
 * A practical light: the visible fixture plus the light it actually casts.
 * Keeping them together stops the scene drifting into lights with no source,
 * which is the fastest way to lose the look.
 */
export function Lamp({
  x,
  y,
  color = PALETTE.accent,
  intensity = 115,
  distance = 36,
  radius = 0.45,
}: {
  x: number;
  y: number;
  color?: string;
  intensity?: number;
  distance?: number;
  radius?: number;
}) {
  return (
    <group position={[x, y, 2]}>
      <mesh>
        <sphereGeometry args={[radius, 12, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight color={color} intensity={intensity} distance={distance} decay={2} />
    </group>
  );
}

/** A lit sign with the company name burned into it. */
export function Sign({
  x,
  y,
  z = -3.2,
  text,
  color = PALETTE.accent,
  height = 0.48,
}: {
  x: number;
  y: number;
  /** Signs belong on the back wall. Close to camera they loom like billboards. */
  z?: number;
  text: string;
  color?: string;
  height?: number;
}) {
  const { texture, aspect } = useMemo(
    () => makeTextTexture(text.toUpperCase(), { color: "#0b0e12" }),
    [text],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  const width = height * aspect;

  return (
    <group position={[x + width / 2, y, z]}>
      {/* The lightbox behind the lettering. */}
      <mesh>
        <planeGeometry args={[width + 0.35, height + 0.3]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent side={DoubleSide} />
      </mesh>
      <pointLight color={color} intensity={9} distance={9} decay={2} position={[0, 0, 1.2]} />
    </group>
  );
}

/**
 * Near-black slabs between the camera and the action.
 *
 * They wipe across the frame as the player walks, which is what sells depth in
 * a side-on 3D scene — without them the eye reads the whole thing as a flat
 * diorama.
 */
export function ForegroundPillar({ x, w = 2.4 }: { x: number; w?: number }) {
  return (
    <mesh position={[x, 8, DEPTH.foreground]}>
      <boxGeometry args={[w, 60, 2]} />
      <meshBasicMaterial color="#040608" />
    </mesh>
  );
}

/** Structural column at mid depth. */
export function Pillar({
  x,
  floorY,
  height,
  w = 0.9,
}: {
  x: number;
  floorY: number;
  height: number;
  w?: number;
}) {
  return <Box x={x} y={floorY} w={w} h={height} z={-4.5} d={1.2} color={PALETTE.geometry} />;
}
