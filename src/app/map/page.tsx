import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PROFILE } from "@/content";

const MapView = dynamic(() => import("@/imagemap/MapView").then((m) => m.MapView));

export const metadata: Metadata = {
  title: `${PROFILE.name} — Map`,
  description: PROFILE.summary,
};

export default function MapPage() {
  return <MapView />;
}
