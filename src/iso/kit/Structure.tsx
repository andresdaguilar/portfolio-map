"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
import { walker } from "../player/walker";
import { makeTextTexture } from "@/game/world/kit/textTexture";
import type { Building } from "../world/map";

/**
 * Buildings, from primitives.
 *
 * Same bet as the side-scroller: the style is carried by silhouette, colour
 * and light rather than by modelled detail, so a box with a pyramid on top
 * reads as a house and nobody has to open a 3D package. At this camera the
 * roof is most of what you see, which is why every kind gets a distinct one.
 */

/** How close the walker has to be for a building to name itself. */
const LABEL_RANGE = 11;

/**
 * A sign board over a building, facing the camera.
 *
 * Only shown when the walker is nearby. With every sign lit at once the town
 * reads as a labelled diagram rather than a place — and the labels collide
 * with each other. Visibility is toggled on the object rather than through
 * React so it costs nothing per frame.
 */
function Label({
  text,
  x,
  y,
  z,
  color,
  worldX,
  worldZ,
}: {
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  worldX: number;
  worldZ: number;
}) {
  const group = useRef<Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const distance = Math.hypot(worldX - walker.x, worldZ - walker.z);
    group.current.visible = distance < LABEL_RANGE;
  });
  const { texture, aspect } = useMemo(
    () => makeTextTexture(text, { color: "#1b222b", font: "600 56px ui-sans-serif, system-ui, sans-serif" }),
    [text],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const height = 0.85;
  const width = height * aspect;

  // Counter-rotated so the board faces the fixed isometric camera squarely.
  return (
    <group ref={group} position={[x, y, z]} rotation={[0, Math.PI / 4, 0]}>
      <mesh rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[width + 0.3, height + 0.2]} />
        <meshBasicMaterial color={color} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.01]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent side={DoubleSide} />
      </mesh>
    </group>
  );
}

function PitchedRoof({
  w,
  d,
  h,
  y,
  color,
}: {
  w: number;
  d: number;
  h: number;
  y: number;
  color: string;
}) {
  return (
    <mesh position={[0, y + h / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[Math.max(w, d) * 0.78, h, 4]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

export function Structure({ building }: { building: Building }) {
  const { kind, x, z, w, d, h, color, roof, accent, label, rotation = 0 } = building;

  const body = (() => {
    switch (kind) {
      case "court":
      case "pool":
        return (
          <group>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            {/* The white line down the middle: a net, or the waterline. */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w * 0.9, 0.12]} />
              <meshBasicMaterial color={accent ?? "#ffffff"} />
            </mesh>
          </group>
        );

      case "monument":
        return (
          <group>
            <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
              <boxGeometry args={[w * 1.5, 0.36, d * 1.5]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 0.36 + h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 0.36 + h + 0.22, 0]}>
              <octahedronGeometry args={[0.36]} />
              <meshStandardMaterial
                color={accent}
                emissive={accent}
                emissiveIntensity={0.55}
                roughness={0.5}
              />
            </mesh>
          </group>
        );

      case "stall":
        return (
          <group>
            {/* A hut with a canvas roof and a counter facing the lane. A flat
                awning plane read as a giant tilted card at this camera angle;
                a pitched roof gives the same silhouette language as the rest
                of the town. */}
            <mesh position={[0, h * 0.45, -d * 0.12]} castShadow receiveShadow>
              <boxGeometry args={[w * 0.85, h * 0.9, d * 0.7]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <PitchedRoof
              w={w}
              d={d * 0.9}
              h={h * 0.5}
              y={h * 0.9}
              color={roof ?? color}
            />
            <mesh position={[0, h * 0.34, d * 0.34]} castShadow receiveShadow>
              <boxGeometry args={[w * 0.9, h * 0.06, 0.35]} />
              <meshStandardMaterial color={roof} roughness={1} />
            </mesh>
            <mesh position={[0, h * 0.55, -d * 0.12 + d * 0.35 + 0.02]}>
              <planeGeometry args={[w * 0.45, h * 0.3]} />
              <meshStandardMaterial
                color={accent}
                emissive={accent}
                emissiveIntensity={0.35}
              />
            </mesh>
          </group>
        );

      case "pavilion":
        return (
          <group>
            {[
              [-w / 2 + 0.3, -d / 2 + 0.3],
              [w / 2 - 0.3, -d / 2 + 0.3],
              [-w / 2 + 0.3, d / 2 - 0.3],
              [w / 2 - 0.3, d / 2 - 0.3],
            ].map(([cx, cz], i) => (
              <mesh key={i} position={[cx, h * 0.4, cz]} castShadow>
                <cylinderGeometry args={[0.16, 0.16, h * 0.8, 6]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            ))}
            <mesh position={[0, 0.08, 0]} receiveShadow>
              <boxGeometry args={[w, 0.16, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <PitchedRoof w={w} d={d} h={h * 0.5} y={h * 0.8} color={roof ?? color} />
          </group>
        );

      case "hall":
        return (
          <group>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {/* A colonnade across the front. */}
            {Array.from({ length: 5 }, (_, i) => (
              <mesh
                key={i}
                position={[-w / 2 + 1.2 + i * ((w - 2.4) / 4), h * 0.4, d / 2 + 0.6]}
                castShadow
              >
                <cylinderGeometry args={[0.28, 0.28, h * 0.8, 8]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            ))}
            <PitchedRoof w={w} d={d} h={h * 0.4} y={h} color={roof ?? color} />
          </group>
        );

      case "house":
      default:
        return (
          <group>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <PitchedRoof w={w} d={d} h={h * 0.45} y={h} color={roof ?? color} />
            {/* Door and a lit window, so the scale reads as a building. */}
            <mesh position={[0, 0.85, d / 2 + 0.02]}>
              <planeGeometry args={[0.9, 1.7]} />
              <meshStandardMaterial color="#5a4632" roughness={1} />
            </mesh>
            <mesh position={[w * 0.28, h * 0.62, d / 2 + 0.02]}>
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial
                color={accent}
                emissive={accent}
                emissiveIntensity={0.45}
              />
            </mesh>
          </group>
        );
    }
  })();

  return (
    <group position={[x, 0, z]}>
      <group rotation={[0, rotation, 0]}>{body}</group>
      {label && (
        <Label
          text={label}
          x={0}
          y={h + (kind === "monument" ? 1.5 : h * 0.55) + 0.9}
          z={0}
          color={accent ?? "#e8e3d6"}
          worldX={x}
          worldZ={z}
        />
      )}
    </group>
  );
}
