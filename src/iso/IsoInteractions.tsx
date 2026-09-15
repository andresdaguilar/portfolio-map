"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { takeAction } from "@/game/core/input";
import { useGame } from "@/game/core/store";
import { walker } from "./player/walker";
import { nearestIsoPoi } from "./world/map";

/** Watches what the walker is standing next to. Same contract as the side-scroller. */
export function IsoInteractions() {
  const current = useRef<string | null>(null);

  useFrame(() => {
    const state = useGame.getState();
    if (state.paused) return;

    const poi = nearestIsoPoi(walker.x, walker.z);
    const id = poi?.id ?? null;

    if (id !== current.current) {
      current.current = id;
      state.setNearby(
        poi && poi.target
          ? { id: poi.id, label: poi.label, target: poi.target }
          : null,
      );
      if (poi?.secret) state.findSecret(poi.secret.id, poi.secret.line);
    }

    if (takeAction() && poi?.target) state.openPanel(poi.target);
  });

  return null;
}
