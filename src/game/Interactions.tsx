"use client";

import { useFrame } from "@react-three/fiber";
import { nearestPoi, type Poi } from "./core/interaction";
import { takeAction } from "./core/input";
import { useGame } from "./core/store";
import { player } from "./player/body";

/**
 * Watches what the player is standing next to.
 *
 * Runs every frame but only touches the store when the answer changes —
 * pushing a proximity check into React state at frame rate would re-render the
 * overlay sixty times a second for no reason.
 */
export function Interactions() {
  useFrame(() => {
    const state = useGame.getState();
    if (state.paused) return;

    const poi = nearestPoi(player.x, player.y);

    // Compared against the store rather than a cache beside it: a cache goes
    // stale the moment anything else writes `nearby`, and it fails silently.
    if ((poi?.id ?? null) !== (state.nearby?.id ?? null)) {
      state.setNearby(
        poi && poi.target
          ? { id: poi.id, label: poi.label, target: poi.target }
          : null,
      );
      // Walking into a secret is enough; it needs no button press.
      if (poi?.secret) state.findSecret(poi.secret.id, poi.secret.line);
    }

    if (takeAction()) act(poi);
  });

  return null;
}

function act(poi: Poi | null) {
  if (poi?.target) useGame.getState().openPanel(poi.target);
}
