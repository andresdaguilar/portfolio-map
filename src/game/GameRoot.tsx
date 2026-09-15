"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { ACESFilmicToneMapping } from "three";
import { CAMERA } from "./core/constants";
import { attachKeyboard, input, resetInput } from "./core/input";
import { hydrateSecrets, useGame } from "./core/store";
import { now, placePlayer, player } from "./player/body";
import { Scene } from "./Scene";
import { Panel } from "./ui/Panel";
import { Prompt } from "./ui/Prompt";
import { Toast } from "./ui/Toast";
import { TouchControls } from "./ui/TouchControls";
import { SPAWN } from "./world/zones/building";

export function GameRoot() {
  const paused = useGame((s) => s.paused);
  const touch = useGame((s) => s.touch);
  const setTouch = useGame((s) => s.setTouch);

  useEffect(() => {
    hydrateSecrets();
    placePlayer(SPAWN.x, SPAWN.y);
    setTouch(window.matchMedia("(pointer: coarse)").matches);

    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__game = { input, player, useGame };
    }

    const detach = attachKeyboard(now, () => useGame.getState().paused);
    return () => {
      detach();
      resetInput();
    };
  }, [setTouch]);

  return (
    <div className="fixed inset-0 bg-void">
      <Canvas
        data-game
        shadows
        // Retina at full resolution costs 4x the pixels for no visible gain on
        // a fogged, near-monochrome scene.
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          // ACES crushes the low end hard. Without extra exposure the whole frame
          // reads as black on a normal monitor in a normally lit room.
          toneMappingExposure: 1.45,
          powerPreference: "high-performance",
          // A manually rendered frame is only readable afterwards if the
          // drawing buffer is kept. Needed to inspect the scene from a hidden
          // tab, where requestAnimationFrame never fires; off in production
          // because it costs an extra full-screen buffer.
          preserveDrawingBuffer: process.env.NODE_ENV === "development",
        }}
        camera={{ fov: CAMERA.fov, position: [0, 3, CAMERA.distance], near: 0.5, far: 220 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {touch && !paused && <TouchControls />}

      <Prompt />
      <Toast />
      <Panel />

      {/* Escape hatches. Someone who does not want to play should never be
          trapped in a canvas. */}
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-10 flex justify-between p-4 text-xs text-muted">
        <span className="font-mono">
          {touch ? "drag to move · jump" : "← → move · space jump · E look"}
        </span>
        <Link
          href="/cv"
          className="pointer-events-auto font-mono underline underline-offset-4 hover:text-accent"
        >
          read the résumé instead
        </Link>
      </nav>
    </div>
  );
}
