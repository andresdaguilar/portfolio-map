"use client";

import { RoundedBox } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

/**
 * A box with its edges taken off.
 *
 * Every hard 90-degree corner in a scene like this reads as "programmer art".
 * A couple of millimetres of bevel catches the light along each edge and is
 * most of the difference between a diagram and a model — for the cost of a
 * few extra triangles on shapes there are not many of.
 *
 * The radius is derived from the smallest dimension, because a fixed one
 * either vanishes on a wall or swallows a table leg.
 */
type BlockProps = {
  args: [number, number, number];
  radius?: number;
  smoothness?: number;
  children?: React.ReactNode;
} & Omit<ThreeElements["mesh"], "args" | "children" | "ref">;

export function Block({
  args,
  radius,
  smoothness = 2,
  children,
  ...props
}: BlockProps) {
  const smallest = Math.min(...args);
  const bevel = radius ?? Math.min(0.09, Math.max(0.012, smallest * 0.2));

  return (
    <RoundedBox args={args} radius={bevel} smoothness={smoothness} {...props}>
      {children}
    </RoundedBox>
  );
}
