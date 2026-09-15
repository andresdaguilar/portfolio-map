import type { Metadata } from "next";
import { Calibrator } from "@/imagemap/Calibrator";

/**
 * A workbench for tracing the walkable ground onto the map image.
 * Not part of the portfolio; it exists so the layout is authored by looking
 * at the map rather than by guessing coordinates.
 */
export const metadata: Metadata = {
  title: "Map calibrator",
  robots: { index: false, follow: false },
};

export default function CalibratePage() {
  return <Calibrator />;
}
