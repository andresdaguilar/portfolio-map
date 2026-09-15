import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PROFILE } from "@/content";

/**
 * The side-scrolling version, in the visual language of Inside.
 *
 * Kept on its own route rather than deleted: the map at `/` is the portfolio
 * now, but this is a working thing and the engine under it — the controller,
 * the collision, the camera — is still the most tested code here.
 */
const GameRoot = dynamic(() => import("@/game/GameRoot").then((m) => m.GameRoot));

export const metadata: Metadata = {
  title: `${PROFILE.name} — Side-scroller`,
  description: PROFILE.summary,
};

export default function InsidePage() {
  return <GameRoot />;
}
