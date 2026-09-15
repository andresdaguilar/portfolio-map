"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
import { makeTextTexture } from "@/game/world/kit/textTexture";
import { ISO_CAMERA } from "../core/constants";
import { walker } from "../player/walker";
import type { Building } from "../world/map";

/**
 * Everything in the town, from primitives.
 *
 * Nothing is enclosed. In a fixed isometric view a walled building hides its
 * own contents and becomes a box you walk around, so the vocabulary here is
 * decks, colonnades, shelves and stones — things you can see into from across
 * the map.
 */

/** How close the walker must be for a place to name itself. */
const LABEL_RANGE = 11;

/** Text printed on a surface in the world, squared up to the fixed camera. */
function Plate({
  text,
  width,
  color = "#1b222b",
}: {
  text: string;
  width: number;
  color?: string;
}) {
  const { texture, aspect } = useMemo(
    () =>
      makeTextTexture(text, {
        color,
        font: "600 56px ui-sans-serif, system-ui, sans-serif",
      }),
    [text, color],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh>
      <planeGeometry args={[width, width / aspect]} />
      <meshBasicMaterial map={texture} transparent side={DoubleSide} />
    </mesh>
  );
}

/**
 * A sign that appears only when the walker is close.
 *
 * With every sign lit at once the map reads as a labelled diagram rather than
 * a place, and the boards collide with each other. Visibility is toggled on
 * the object rather than through React, so it costs nothing per frame.
 */
function ProximityLabel({
  text,
  y,
  color,
  worldX,
  worldZ,
}: {
  text: string;
  y: number;
  color: string;
  worldX: number;
  worldZ: number;
}) {
  const group = useRef<Group>(null);

  useFrame(() => {
    if (!group.current) return;
    group.current.visible =
      Math.hypot(worldX - walker.x, worldZ - walker.z) < LABEL_RANGE;
  });

  const { texture, aspect } = useMemo(
    () =>
      makeTextTexture(text, {
        color: "#1b222b",
        font: "600 56px ui-sans-serif, system-ui, sans-serif",
      }),
    [text],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const height = 0.8;
  const width = height * aspect;

  return (
    <group ref={group} position={[0, y, 0]} rotation={[0, ISO_CAMERA.azimuth, 0]}>
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
      <coneGeometry args={[Math.max(w, d) * 0.72, h, 4]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
}

export function Structure({ building }: { building: Building }) {
  const { kind, x, y, z, w, d, h, color, roof, accent, label, sub } = building;
  const warm = accent ?? "#e8e3d6";

  const body = (() => {
    switch (kind) {
      /**
       * A career step. Low enough to see over from the landing behind it, so
       * the whole terrace reads as one climb rather than a row of obstacles.
       */
      case "plaque":
        return (
          <group rotation={[0, ISO_CAMERA.azimuth, 0]}>
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.24, d + 0.5]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, h / 2, 0]} castShadow>
              <boxGeometry args={[w * 0.9, h, 0.22]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {/* The face, tilted up towards the camera. */}
            <group position={[0, h * 0.62, 0.14]} rotation={[-Math.PI / 9, 0, 0]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[w * 0.82, h * 0.52]} />
                <meshStandardMaterial color={warm} roughness={0.9} />
              </mesh>
              <group position={[0, 0, 0.01]}>
                <Plate text={label ?? ""} width={w * 0.7} />
              </group>
            </group>
          </group>
        );

      /** An open colonnade: columns and a roof, no walls. */
      case "columns": {
        const columns = 6;
        return (
          <group>
            <mesh position={[0, 0.12, 0]} receiveShadow>
              <boxGeometry args={[w + 1.6, 0.24, d + 1.6]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {Array.from({ length: columns }, (_, i) => {
              const t = i / (columns - 1);
              return [-d / 2, d / 2].map((cz, j) => (
                <mesh
                  key={`${i}-${j}`}
                  position={[-w / 2 + t * w, h * 0.45, cz]}
                  castShadow
                >
                  <cylinderGeometry args={[0.24, 0.28, h * 0.9, 9]} />
                  <meshStandardMaterial color={color} roughness={1} />
                </mesh>
              ));
            })}
            <mesh position={[0, h * 0.95, 0]} castShadow>
              <boxGeometry args={[w + 1.2, h * 0.2, d + 1.2]} />
              <meshStandardMaterial color={roof ?? color} roughness={1} />
            </mesh>
            <PitchedRoof w={w + 1} d={d + 1} h={h * 0.4} y={h * 1.05} color={roof ?? color} />
          </group>
        );
      }

      /** Open shelving: a frame with rows of spines, visible from across the map. */
      case "shelf":
        return (
          <group>
            <mesh position={[0, h / 2, -d / 2]} castShadow receiveShadow>
              <boxGeometry args={[w, h, 0.25]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {[0.55, 1.35, 2.15].map((shelfY) => (
              <group key={shelfY}>
                <mesh position={[0, shelfY, 0]} castShadow>
                  <boxGeometry args={[w, 0.12, d]} />
                  <meshStandardMaterial color={color} roughness={1} />
                </mesh>
                {Array.from({ length: 11 }, (_, i) => {
                  const tone = ["#a8503f", "#4f6f84", "#7e8a52", "#8b6a45", "#6a5472"][i % 5];
                  const bookHeight = 0.42 + ((i * 7) % 5) * 0.05;
                  return (
                    <mesh
                      key={i}
                      position={[-w / 2 + 0.35 + i * (w - 0.7) / 10, shelfY + 0.06 + bookHeight / 2, 0]}
                      castShadow
                    >
                      <boxGeometry args={[0.2, bookHeight, d * 0.7]} />
                      <meshStandardMaterial color={tone} roughness={1} />
                    </mesh>
                  );
                })}
              </group>
            ))}
          </group>
        );

      case "table":
        return (
          <group>
            <mesh position={[0, h, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.14, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {[
              [-w / 2 + 0.25, -d / 2 + 0.25],
              [w / 2 - 0.25, -d / 2 + 0.25],
              [-w / 2 + 0.25, d / 2 - 0.25],
              [w / 2 - 0.25, d / 2 - 0.25],
            ].map(([lx, lz], i) => (
              <mesh key={i} position={[lx, h / 2, lz]} castShadow>
                <boxGeometry args={[0.14, h, 0.14]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            ))}
            {/* An open book, left on the table. */}
            <mesh position={[0, h + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
              <planeGeometry args={[1.1, 0.8]} />
              <meshStandardMaterial color="#efe8d8" roughness={1} side={DoubleSide} />
            </mesh>
          </group>
        );

      /** The open-air studio: a stand, a mic, and an on-air lamp. */
      case "mic":
        return (
          <group>
            <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.7, 0.8, 0.12, 20]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, h * 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, h * 0.9, 8]} />
              <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
            </mesh>
            <mesh position={[0, h * 0.95, 0.12]} rotation={[0.35, 0, 0]} castShadow>
              <capsuleGeometry args={[0.17, 0.3, 4, 12]} />
              <meshStandardMaterial color="#2c3440" roughness={0.6} />
            </mesh>
            <mesh position={[0, h * 1.25, 0]} rotation={[0, ISO_CAMERA.azimuth, 0]}>
              <planeGeometry args={[1.5, 0.42]} />
              <meshStandardMaterial
                color={warm}
                emissive={warm}
                emissiveIntensity={0.7}
                side={DoubleSide}
              />
            </mesh>
            <pointLight color={warm} intensity={12} distance={12} decay={2} position={[0, h * 1.3, 0]} />
          </group>
        );

      /** One show: a coloured marker you can read the colour of from far off. */
      case "totem":
        return (
          <group rotation={[0, ISO_CAMERA.azimuth, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[w + 0.5, 0.2, d + 0.5]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, h * 0.72, d / 2 + 0.01]}>
              <planeGeometry args={[w * 0.82, h * 0.44]} />
              <meshStandardMaterial
                color={warm}
                emissive={warm}
                emissiveIntensity={0.45}
              />
            </mesh>
          </group>
        );

      case "monument":
        return (
          <group>
            <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
              <boxGeometry args={[w * 1.6, 0.28, d * 1.6]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 0.28 + h / 2, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 0.28 + h + 0.28, 0]}>
              <octahedronGeometry args={[0.32]} />
              <meshStandardMaterial
                color={warm}
                emissive={warm}
                emissiveIntensity={0.6}
                roughness={0.5}
              />
            </mesh>
          </group>
        );

      case "stall":
        return (
          <group>
            <mesh position={[0, h * 0.45, -d * 0.12]} castShadow receiveShadow>
              <boxGeometry args={[w * 0.85, h * 0.9, d * 0.7]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <PitchedRoof w={w} d={d * 0.9} h={h * 0.5} y={h * 0.9} color={roof ?? color} />
            <mesh position={[0, h * 0.34, d * 0.34]} castShadow receiveShadow>
              <boxGeometry args={[w * 0.9, h * 0.06, 0.35]} />
              <meshStandardMaterial color={roof} roughness={1} />
            </mesh>
            <mesh position={[0, h * 0.55, -d * 0.12 + d * 0.35 + 0.02]}>
              <planeGeometry args={[w * 0.45, h * 0.3]} />
              <meshStandardMaterial color={warm} emissive={warm} emissiveIntensity={0.35} />
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

      case "court":
      case "pool":
      default:
        return (
          <group>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w * 0.9, 0.12]} />
              <meshBasicMaterial color={warm} />
            </mesh>
          </group>
        );
    }
  })();

  // Plaques already carry their name in the world, so their floating sign
  // shows the role and the years instead.
  const signText = kind === "plaque" ? (sub ?? label) : (sub ? `${label} · ${sub}` : label);
  const signY = kind === "plaque" ? h + 1.1 : h + Math.max(1.2, h * 0.4);

  return (
    <group position={[x, y, z]}>
      {body}
      {signText && (
        <ProximityLabel
          text={signText}
          y={signY}
          color={warm}
          worldX={x}
          worldZ={z}
        />
      )}
    </group>
  );
}
