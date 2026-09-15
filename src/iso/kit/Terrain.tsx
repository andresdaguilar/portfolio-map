"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { Block } from "./Block";
import { Model, type ModelName, preloadKit } from "./Model";
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

// Tuned against the model kit's own foliage greens, so the planting sits on
// the ground rather than floating over a differently-coloured lawn.
const GRASS = "#74a05a";
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

const TREES: ModelName[] = ["tree_default", "tree_oak", "tree_fat", "tree_detailed"];
const BUSHES: ModelName[] = ["plant_bush", "plant_bushDetailed", "plant_bushSmall"];
const ROCKS: ModelName[] = ["rock_smallA", "rock_tallA", "rock_smallA"];

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
      <Block args={[width, 0.24, length]} position={[0, -0.08, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={PLANK} roughness={1} />
      </Block>
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

preloadKit([...TREES, ...BUSHES, ...ROCKS]);

export function Terrain() {
  /**
   * Trees, bushes and boulders around the rim of each island.
   *
   * Scattered deterministically so the planting does not rearrange itself on
   * every reload, and kept to the edges: the middle of an island belongs to
   * whatever the island is for.
   */
  const planting = useMemo(() => {
    const random = mulberry(20260915);
    type Placed = { x: number; z: number; scale: number; seed: number };
    const trees: Placed[] = [];
    const bushes: Placed[] = [];
    const rocks: Placed[] = [];

    const clear = (x: number, z: number, radius: number) =>
      !BLOCKERS.some((b) => overlapsCircle(b, x, z, radius)) &&
      !LANDINGS.some((l) => Math.abs(l.x - x) < 4 && Math.abs(l.z - z) < 4) &&
      !trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.4) &&
      !bushes.some((t) => Math.hypot(t.x - x, t.z - z) < 1.3);

    for (const isle of ISLANDS) {
      let attempts = 0;
      let placed = 0;
      const want = isle.id === "plaza" ? 4 : 13;

      while (placed < want && attempts < 700) {
        attempts += 1;
        const x = isle.x - isle.w / 2 + 1 + random() * (isle.w - 2);
        const z = isle.z - isle.d / 2 + 1 + random() * (isle.d - 2);

        const fromEdge = Math.min(
          Math.abs(x - (isle.x - isle.w / 2)),
          Math.abs(x + 0 - (isle.x + isle.w / 2)),
          Math.abs(z - (isle.z - isle.d / 2)),
          Math.abs(z - (isle.z + isle.d / 2)),
        );
        if (fromEdge > 2.8) continue;
        if (!clear(x, z, 2)) continue;

        const roll = random();
        const placement = { x, z, scale: 0.7 + random() * 0.6, seed: random() };
        if (roll < 0.55) trees.push(placement);
        else if (roll < 0.82) bushes.push(placement);
        else rocks.push(placement);
        placed += 1;
      }
    }

    return { trees, bushes, rocks };
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
          {/* The rock the island is cut from, inset so the turf above it
              overhangs and casts a line of shade around the rim. */}
          <Block
            args={[isle.w - 1.2, ISLAND_DEPTH, isle.d - 1.2]}
            radius={0.5}
            position={[0, -ISLAND_DEPTH / 2 - 0.15, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={ROCK} roughness={1} flatShading />
          </Block>
          {/* The turf slab. */}
          <Block
            args={[isle.w, 0.5, isle.d]}
            radius={0.22}
            position={[0, -0.25, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={GRASS} roughness={1} />
          </Block>
          {/* The keel underneath. This is what makes it float rather than sit. */}
          <mesh
            position={[0, -ISLAND_DEPTH - 3.5, 0]}
            rotation={[Math.PI, Math.PI / 4, 0]}
            castShadow
          >
            <coneGeometry args={[Math.min(isle.w, isle.d) * 0.55, 7, 4]} />
            <meshStandardMaterial color={ROCK_DARK} roughness={1} flatShading />
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
          <Block
            args={[landing.size, Math.max(landing.y, 0.18) + 0.3, landing.size]}
            radius={0.1}
            position={[0, (Math.max(landing.y, 0.18) + 0.3) / 2 - 0.3, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={STONE_EDGE} roughness={1} />
          </Block>
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
          <Block
            key={rail.id}
            args={[rail.w, RAIL_HEIGHT, rail.d]}
            position={[rail.x + rail.w / 2, y + RAIL_HEIGHT / 2, rail.z + rail.d / 2]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={STONE_EDGE} roughness={1} />
          </Block>
        );
      })}

      {/* Planting, from the model kit. Real foliage rather than stacked
          spheres is most of the difference between a diagram and a diorama,
          and at 9KB a model it costs less than the code it replaced. */}
      {planting.trees.map((tree, i) => (
        <Model
          key={`t${i}`}
          name={TREES[i % TREES.length]}
          fit={{ height: 2.4 + tree.scale * 1.1 }}
          position={[tree.x, 0, tree.z]}
          rotation={[0, tree.seed * 6, 0]}
        />
      ))}
      {planting.bushes.map((bush, i) => (
        <Model
          key={`b${i}`}
          name={BUSHES[i % BUSHES.length]}
          fit={{ height: 0.45 + bush.scale * 0.35 }}
          position={[bush.x, 0, bush.z]}
          rotation={[0, bush.seed * 6, 0]}
        />
      ))}
      {planting.rocks.map((rock, i) => (
        <Model
          key={`r${i}`}
          name={ROCKS[i % ROCKS.length]}
          // Rocks are fitted by width, not height: some of them are broad and
          // flat, and matching their height blows them up into slabs wider
          // than the island they sit on.
          fit={{ width: 0.7 + rock.scale * 0.8 }}
          position={[rock.x, 0, rock.z]}
          rotation={[0, rock.seed * 6, 0]}
        />
      ))}
    </group>
  );
}
