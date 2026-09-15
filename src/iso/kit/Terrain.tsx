"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { overlapsCircle } from "../core/nav";
import { BRIDGES, ISLANDS, island } from "../world/islands";
import { BLOCKERS, LANDINGS, RAILINGS, RAIL_HEIGHT } from "../world/map";

/**
 * The archipelago itself: islands, the water between them, and the bridges
 * across.
 *
 * Each island is a slab of rock with grass on top and a pyramid hanging
 * beneath it. The underside is what sells "floating" — without it the islands
 * read as holes cut in a green plane rather than as land above water.
 */

const GRASS = "#7d9560";
const ROCK = "#6b6a63";
const ROCK_DARK = "#54544f";
const STONE = "#c2b79f";
const STONE_EDGE = "#a89a80";
const WATER = "#3f6f8c";
const PLANK = "#9c7a54";

const ISLAND_DEPTH = 5;

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

function Tree({ x, z, scale }: { x: number; z: number; scale: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 1, 6]} />
        <meshStandardMaterial color="#6b513a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.95, 2.2, 7]} />
        <meshStandardMaterial color="#4f7040" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <coneGeometry args={[0.68, 1.5, 7]} />
        <meshStandardMaterial color="#5a7d48" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

function Bridge({
  from,
  to,
  width,
}: {
  from: { x: number; z: number };
  to: { x: number; z: number };
  width: number;
}) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);

  return (
    <group
      position={[(from.x + to.x) / 2, 0, (from.z + to.z) / 2]}
      rotation={[0, angle, 0]}
    >
      <mesh position={[0, -0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.24, length]} />
        <meshStandardMaterial color={PLANK} roughness={1} />
      </mesh>
      {/* Handrails down both sides. */}
      {[-width / 2 + 0.12, width / 2 - 0.12].map((side) => (
        <group key={side}>
          <mesh position={[side, 0.55, 0]} castShadow>
            <boxGeometry args={[0.1, 0.1, length]} />
            <meshStandardMaterial color={PLANK} roughness={1} />
          </mesh>
          {(() => {
            const posts = Math.max(2, Math.round(length / 3));
            return Array.from({ length: posts }, (_, i) => (
              <mesh
                key={i}
                position={[side, 0.28, -length / 2 + (i / (posts - 1)) * length]}
                castShadow
              >
                <boxGeometry args={[0.1, 0.62, 0.1]} />
                <meshStandardMaterial color={PLANK} roughness={1} />
              </mesh>
            ));
          })()}
        </group>
      ))}
    </group>
  );
}

export function Terrain() {
  const trees = useMemo(() => {
    const random = mulberry(20260915);
    const out: Array<{ x: number; z: number; scale: number }> = [];

    for (const isle of ISLANDS) {
      if (isle.id === "plaza") continue;
      let attempts = 0;
      let placed = 0;

      while (placed < 16 && attempts < 600) {
        attempts += 1;
        const x = isle.x - isle.w / 2 + 1.5 + random() * (isle.w - 3);
        const z = isle.z - isle.d / 2 + 1.5 + random() * (isle.d - 3);

        // Trees line the edges; the middle belongs to whatever the island is for.
        const edge =
          Math.min(
            Math.abs(x - (isle.x - isle.w / 2)),
            Math.abs(x - (isle.x + isle.w / 2)),
            Math.abs(z - (isle.z - isle.d / 2)),
            Math.abs(z - (isle.z + isle.d / 2)),
          ) < 3.2;
        if (!edge) continue;

        if (BLOCKERS.some((b) => overlapsCircle(b, x, z, 2.6))) continue;
        if (LANDINGS.some((l) => Math.abs(l.x - x) < 5 && Math.abs(l.z - z) < 5)) continue;
        if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3)) continue;

        out.push({ x, z, scale: 0.7 + random() * 0.5 });
        placed += 1;
      }
    }
    return out;
  }, []);

  const plaza = island("plaza");

  return (
    <group>
      {/* Water, far enough below that the islands read as floating over it. */}
      <mesh position={[0, -ISLAND_DEPTH - 3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={WATER} roughness={0.25} metalness={0.15} />
      </mesh>

      {ISLANDS.map((isle) => (
        <group key={isle.id} position={[isle.x, 0, isle.z]}>
          {/* The rock the island is cut from. */}
          <mesh position={[0, -ISLAND_DEPTH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[isle.w, ISLAND_DEPTH, isle.d]} />
            <meshStandardMaterial color={ROCK} roughness={1} flatShading />
          </mesh>
          {/* The keel underneath. This is what makes it float rather than sit. */}
          <mesh
            position={[0, -ISLAND_DEPTH - 3.5, 0]}
            rotation={[Math.PI, Math.PI / 4, 0]}
            castShadow
          >
            <coneGeometry args={[Math.min(isle.w, isle.d) * 0.55, 7, 4]} />
            <meshStandardMaterial color={ROCK_DARK} roughness={1} flatShading />
          </mesh>
          {/* Grass. */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[isle.w, isle.d]} />
            <meshStandardMaterial color={GRASS} roughness={1} />
          </mesh>
        </group>
      ))}

      {BRIDGES.map((bridge) => (
        <Bridge key={bridge.id} {...bridge} />
      ))}

      {/* The plaza: paving, a ring, and a globe at the centre of the world. */}
      <mesh position={[plaza.x, 0.03, plaza.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[9.5, 40]} />
        <meshStandardMaterial color={STONE} roughness={1} />
      </mesh>
      <mesh position={[plaza.x, 0.05, plaza.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.2, 6.6, 48]} />
        <meshBasicMaterial color={STONE_EDGE} side={DoubleSide} />
      </mesh>
      <group position={[plaza.x, 0, plaza.z]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.7, 0.7, 24]} />
          <meshStandardMaterial color={STONE_EDGE} roughness={1} />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[1.15, 20, 16]} />
          <meshStandardMaterial color="#4a6b86" roughness={0.6} metalness={0.2} />
        </mesh>
      </group>

      {/* The career terrace: cut stone, each landing a step above the last. */}
      {LANDINGS.map((landing) => (
        <group key={landing.id} position={[landing.x, 0, landing.z]}>
          <mesh position={[0, landing.y / 2 + 0.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[landing.size, Math.max(landing.y, 0.16), landing.size]} />
            <meshStandardMaterial color={STONE_EDGE} roughness={1} />
          </mesh>
          <mesh
            position={[0, landing.y + 0.06, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[landing.size - 0.3, landing.size - 0.3]} />
            <meshStandardMaterial color={STONE} roughness={1} />
          </mesh>
        </group>
      ))}

      {RAILINGS.map((rail) => {
        const landing = LANDINGS.find((l) => rail.id?.includes(l.id));
        const y = landing?.y ?? 0;
        return (
          <mesh
            key={rail.id}
            position={[rail.x + rail.w / 2, y + RAIL_HEIGHT / 2, rail.z + rail.d / 2]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[rail.w, RAIL_HEIGHT, rail.d]} />
            <meshStandardMaterial color={STONE_EDGE} roughness={1} />
          </mesh>
        );
      })}

      {trees.map((tree, i) => (
        <Tree key={i} {...tree} />
      ))}
    </group>
  );
}
