"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { ACESFilmicToneMapping } from "three";
import { attachKeyboard, resetInput } from "@/game/core/input";
import { hydrateSecrets, useGame } from "@/game/core/store";
import { Panel } from "@/game/ui/Panel";
import { Prompt } from "@/game/ui/Prompt";
import { Toast } from "@/game/ui/Toast";
import { ISO_CAMERA } from "./core/constants";
import { isoOffset } from "./IsoCamera";
import { IsoScene } from "./IsoScene";
import { IsoDevBridge } from "./IsoDevBridge";
import { IsoTouchControls } from "./ui/IsoTouchControls";
import { isoNow, placeWalker } from "./player/walker";
import { ISO_SPAWN } from "./world/map";

export function IsoRoot() {
  const paused = useGame((s) => s.paused);
  const touch = useGame((s) => s.touch);
  const setTouch = useGame((s) => s.setTouch);

  useEffect(() => {
    hydrateSecrets();
    placeWalker(ISO_SPAWN.x, ISO_SPAWN.z);
    setTouch(window.matchMedia("(pointer: coarse)").matches);

    const detach = attachKeyboard(isoNow, () => useGame.getState().paused);
    return () => {
      detach();
      resetInput();
    };
  }, [setTouch]);

  const offset = isoOffset();

  return (
    <div className="fixed inset-0 bg-[#a8c4d4]">
      <Canvas
        data-game
        shadows
        dpr={[1, 1.75]}
        orthographic
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1,
          powerPreference: "high-performance",
          preserveDrawingBuffer: process.env.NODE_ENV === "development",
        }}
        camera={{
          position: [offset.x, offset.y, offset.z],
          zoom: 30,
          near: 0.1,
          far: 400,
        }}
      >
        <Suspense fallback={null}>
          <IsoScene />
          <IsoDevBridge />
        </Suspense>
      </Canvas>

      {touch && !paused && <IsoTouchControls />}

      <Prompt />
      <Toast />
      <Panel />

      <nav className="pointer-events-none fixed inset-x-0 top-0 z-10 flex justify-between p-4 text-xs text-[#20313d]">
        <span className="font-mono">
          {touch ? "drag to move" : "← ↑ → ↓ move · E look"}
        </span>
        <span className="flex gap-4">
          <Link
            href="/inside"
            className="pointer-events-auto font-mono underline underline-offset-4"
          >
            side-scroller
          </Link>
          <Link
            href="/cv"
            className="pointer-events-auto font-mono underline underline-offset-4"
          >
            résumé
          </Link>
        </span>
      </nav>
    </div>
  );
}

export { ISO_CAMERA };
