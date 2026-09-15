"use client";

import { useMemo } from "react";
import { overlapsCircle } from "../core/nav";
import { BLOCKERS, DISTRICTS } from "../world/map";

/**
 * The ground the town sits on.
 *
 * A plateau with water around it, district patches to tell the areas apart,
 * and paths from the central plaza out to each one. The paths are not
 * decoration: in a top-down world with no walls, they are how a visitor knows
 * where they are meant to go next.
 */

const GRASS = "#7d9560";
const GRASS_DARK = "#6d8554";
const SAND = "#cbb894";
const WATER = "#46738f";
const PATH = "#bda57e";
const PLAZA = "#c9b48e";

const ISLAND = { x: -54, z: -50, w: 108, d: 100 };

/** Deterministic scatter, so the trees do not dance between reloads. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Quad({
  x,
  z,
  w,
  d,
  color,
  y = 0.02,
  opacity = 1,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  y?: number;
  opacity?: number;
}) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial
        color={color}
        roughness={1}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function Tree({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.19, 1.1, 6]} />
        <meshStandardMaterial color="#6b513a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[1.05, 2.4, 7]} />
        <meshStandardMaterial color="#4f7040" roughness={1} />
      </mesh>
      <mesh position={[0, 2.65, 0]} castShadow>
        <coneGeometry args={[0.75, 1.6, 7]} />
        <meshStandardMaterial color="#5a7d48" roughness={1} />
      </mesh>
    </group>
  );
}

export function Terrain() {
  const trees = useMemo(() => {
    const random = mulberry(20260915);
    const out: Array<{ x: number; z: number; scale: number }> = [];
    let attempts = 0;

    while (out.length < 90 && attempts < 4000) {
      attempts += 1;
      const x = ISLAND.x + 3 + random() * (ISLAND.w - 6);
      const z = ISLAND.z + 3 + random() * (ISLAND.d - 6);

      // Keep clear of buildings, of the paths radiating from the plaza, and of
      // the district floors themselves.
      if (BLOCKERS.some((b) => overlapsCircle(b, x, z, 3.5))) continue;
      if (Math.hypot(x, z) < 12) continue;
      if (
        DISTRICTS.some(
          (d) => Math.abs(x - d.x) < d.w + 2 && Math.abs(z - d.z) < d.d + 2,
        )
      ) {
        continue;
      }
      if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3.4)) continue;

      out.push({ x, z, scale: 0.75 + random() * 0.6 });
    }
    return out;
  }, []);

  return (
    <group>
      {/* Water, well below the plateau so the island reads as raised land. */}
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color={WATER} roughness={0.35} metalness={0.1} />
      </mesh>

      {/* The plateau: a slab, so its edge catches the light as a cliff. */}
      <mesh
        position={[ISLAND.x + ISLAND.w / 2, -0.75, ISLAND.z + ISLAND.d / 2]}
        receiveShadow
      >
        <boxGeometry args={[ISLAND.w, 1.5, ISLAND.d]} />
        <meshStandardMaterial color={GRASS_DARK} roughness={1} />
      </mesh>
      <Quad
        x={ISLAND.x + ISLAND.w / 2}
        z={ISLAND.z + ISLAND.d / 2}
        w={ISLAND.w}
        d={ISLAND.d}
        color={GRASS}
        y={0.01}
      />

      {/* Beach in the south-west, where the surf district meets the water. */}
      <Quad x={-30} z={38} w={30} d={16} color={SAND} y={0.015} />

      {/* Paths out of the plaza. Drawn as one long quad each, rotated to aim
          at the district it serves. */}
      {DISTRICTS.map((district) => {
        const length = Math.hypot(district.x, district.z);
        const angle = Math.atan2(district.x, district.z);
        return (
          <mesh
            key={`path-${district.id}`}
            position={[district.x / 2, 0.025, district.z / 2]}
            rotation={[-Math.PI / 2, 0, angle]}
            receiveShadow
          >
            <planeGeometry args={[3.2, length]} />
            <meshStandardMaterial color={PATH} roughness={1} />
          </mesh>
        );
      })}

      {/* The plaza itself. */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7, 32]} />
        <meshStandardMaterial color={PLAZA} roughness={1} />
      </mesh>

      {/* District floors, tinted just enough to separate them from the grass. */}
      {DISTRICTS.map((district) => (
        <Quad
          key={district.id}
          x={district.x}
          z={district.z}
          w={district.w * 2}
          d={district.d * 2}
          color={district.color}
          y={0.018}
          opacity={0.22}
        />
      ))}

      {trees.map((tree, i) => (
        <Tree key={i} {...tree} />
      ))}
    </group>
  );
}
