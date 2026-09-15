import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PROFILE } from "@/content";

/**
 * The portfolio: a map you walk.
 *
 * Never server-rendered — it needs a canvas and `window`, and prerendering one
 * buys nothing. `/cv` carries the same content as plain HTML, and that is what
 * crawlers and screen readers read.
 */
const MapView = dynamic(() => import("@/imagemap/MapView").then((m) => m.MapView));

export const metadata: Metadata = {
  title: `${PROFILE.name} — ${PROFILE.title}`,
  description: PROFILE.summary,
};

export default function Home() {
  return <MapView />;
}
