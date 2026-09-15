"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Mesh, Vector3 } from "three";
import type { ThreeElements } from "@react-three/fiber";

/**
 * A model from the kit, normalised.
 *
 * The library these come from (Kenney, CC0) models everything on its own grid,
 * so a desk and a tree do not arrive at the same scale as each other or as
 * this world. Rather than hand-tuning a magic number per prop, each model is
 * measured on load and scaled to a requested real-world size, then seated so
 * its base sits on y=0 and its centre on the origin.
 *
 * That way a prop is placed by saying how tall it is, and swapping one model
 * for another needs no re-tuning.
 */

const BASE = "/models/kit";

export type ModelName =
  | "tree_default" | "tree_oak" | "tree_fat" | "tree_detailed" | "tree_palmShort"
  | "plant_bush" | "plant_bushDetailed" | "plant_bushSmall"
  | "rock_largeA" | "rock_smallA" | "rock_tallA"
  | "flower_redA" | "flower_yellowA" | "grass" | "grass_large"
  | "statue_column"
  | "desk" | "chairDesk" | "computerScreen" | "computerKeyboard"
  | "bookcaseOpen" | "bookcaseOpenLow" | "books"
  | "table" | "tableRound" | "loungeChair"
  | "rugRound" | "rugRectangle" | "pottedPlant" | "plantSmall1"
  | "stoolBar" | "speaker" | "radio" | "lampRoundFloor"
  | "bench" | "benchCushion";

export type Fit =
  | { height: number }
  | { width: number }
  | { depth: number }
  | { scale: number };

export function Model({
  name,
  fit,
  ...props
}: { name: ModelName; fit: Fit } & Omit<ThreeElements["group"], "ref">) {
  const { scene } = useGLTF(`${BASE}/${name}.glb`);

  // `fit` arrives as an object literal in JSX, so it is a new reference on
  // every render. Depending on it directly would re-clone every model each
  // frame; depending on its contents keeps the clone for the life of the prop.
  const fitKey = "scale" in fit
    ? `s${fit.scale}`
    : "height" in fit
      ? `h${fit.height}`
      : "width" in fit
        ? `w${fit.width}`
        : `d${fit.depth}`;

  const { object, scale, offset } = useMemo(() => {
    // One clone per instance: the same desk appears eight times and each needs
    // its own transform. Geometry and materials stay shared.
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const centre = new Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const factor =
      "scale" in fit
        ? fit.scale
        : "height" in fit
          ? fit.height / (size.y || 1)
          : "width" in fit
            ? fit.width / (size.x || 1)
            : fit.depth / (size.z || 1);

    return {
      object: clone,
      scale: factor,
      // Seat it on the ground and centre it horizontally.
      offset: [
        -centre.x * factor,
        -box.min.y * factor,
        -centre.z * factor,
      ] as [number, number, number],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fitKey` is the
    // stable stand-in for `fit`; see the note above.
  }, [scene, fitKey]);

  return (
    <group {...props}>
      <group position={offset} scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}

/** Warms the cache so props do not pop in one at a time on first approach. */
export function preloadKit(names: readonly ModelName[]): void {
  for (const name of names) useGLTF.preload(`${BASE}/${name}.glb`);
}
