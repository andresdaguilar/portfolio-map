import dynamic from "next/dynamic";

/**
 * The game never server-renders: it needs a WebGL context and `window`, and
 * prerendering a canvas buys nothing. `/cv` carries the content for crawlers.
 */
const GameRoot = dynamic(() => import("@/game/GameRoot").then((m) => m.GameRoot));

export default function Home() {
  return <GameRoot />;
}
