"use client";

import { useCallback, useRef, useState } from "react";
import { input } from "@/game/core/input";

const STICK_RADIUS = 58;
const DEADZONE = 0.16;

/**
 * A two-axis stick, and nothing else.
 *
 * The side-scroller needed a jump button; here there is nowhere to jump to, so
 * the whole right half of the screen is free and the interaction button lives
 * in the prompt itself.
 */
export function IsoTouchControls() {
  const [stick, setStick] = useState<{
    originX: number;
    originY: number;
    dx: number;
    dy: number;
  } | null>(null);
  const touchId = useRef<number | null>(null);

  const release = useCallback(() => {
    touchId.current = null;
    setStick(null);
    input.moveX = 0;
    input.moveY = 0;
  }, []);

  return (
    <div
      className="fixed inset-0 z-20 touch-none"
      onTouchStart={(e) => {
        if (touchId.current !== null) return;
        const t = e.changedTouches[0];
        touchId.current = t.identifier;
        setStick({ originX: t.clientX, originY: t.clientY, dx: 0, dy: 0 });
      }}
      onTouchMove={(e) => {
        if (touchId.current === null || !stick) return;
        const t = Array.from(e.changedTouches).find(
          (x) => x.identifier === touchId.current,
        );
        if (!t) return;

        const dx = Math.max(-1, Math.min(1, (t.clientX - stick.originX) / STICK_RADIUS));
        const dy = Math.max(-1, Math.min(1, (stick.originY - t.clientY) / STICK_RADIUS));
        setStick({ ...stick, dx, dy });
        input.moveX = Math.abs(dx) < DEADZONE ? 0 : dx;
        input.moveY = Math.abs(dy) < DEADZONE ? 0 : dy;
      }}
      onTouchEnd={release}
      onTouchCancel={release}
      aria-hidden
    >
      {stick && (
        <>
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30"
            style={{
              left: stick.originX,
              top: stick.originY,
              width: STICK_RADIUS * 2,
              height: STICK_RADIUS * 2,
            }}
          />
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35"
            style={{
              left: stick.originX + stick.dx * STICK_RADIUS,
              top: stick.originY - stick.dy * STICK_RADIUS,
              width: 46,
              height: 46,
            }}
          />
        </>
      )}
    </div>
  );
}
