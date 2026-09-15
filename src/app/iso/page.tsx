import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PROFILE } from "@/content";

const IsoRoot = dynamic(() => import("@/iso/IsoRoot").then((m) => m.IsoRoot));

export const metadata: Metadata = {
  title: `${PROFILE.name} — Map`,
  description: PROFILE.summary,
};

export default function IsoPage() {
  return <IsoRoot />;
}
