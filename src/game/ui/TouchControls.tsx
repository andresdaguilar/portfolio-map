"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { input } from "../core/input";
import { now } from "../player/body";
import { useGame } from "../core/store";

const STICK_RADIUS = 56;
/** Below this the stick is treated as centred, so a resting thumb does not drift. */
const DEADZONE = 0.18;

/**
 * Left half of the screen is a floating analogue stick — it appears wherever
 * the thumb lands rather than at a fixed spot, which is the difference between
 * a control that works on a phone and one that fights the player. The action
 * button on the right only exists when there is something to act on.
 */
export function TouchControls() {
  const nearby = useGame((s) => s.nearby);
  const openPanel = useGame((s) => s.openPanel);
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
    input.jumpHeld = false;
  }, []);

  useEffect(() => release, [release]);

  const onStart = (e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const t = e.changedTouches[0];
    touchId.current = t.identifier;
    setStick({ originX: t.clientX, originY: t.clientY, dx: 0, dy: 0 });
  };

  const onMove = (e: React.TouchEvent) => {
    if (touchId.current === null) return;
    const t = Array.from(e.changedTouches).find(
      (x) => x.identifier === touchId.current,
    );
    if (!t || !stick) return;

    const rawX = (t.clientX - stick.originX) / STICK_RADIUS;
    const rawY = (stick.originY - t.clientY) / STICK_RADIUS;
    const dx = Math.max(-1, Math.min(1, rawX));
    const dy = Math.max(-1, Math.min(1, rawY));

    setStick({ ...stick, dx, dy });
    input.moveX = Math.abs(dx) < DEADZONE ? 0 : dx;
    input.moveY = Math.abs(dy) < DEADZONE ? 0 : dy;
  };

  return (
    <>
      <div
        className="fixed inset-y-0 left-0 z-20 w-1/2 touch-none"
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={release}
        onTouchCancel={release}
        aria-hidden
      >
        {stick && (
          <>
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
              style={{
                left: stick.originX,
                top: stick.originY,
                width: STICK_RADIUS * 2,
                height: STICK_RADIUS * 2,
              }}
            />
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
              style={{
                left: stick.originX + stick.dx * STICK_RADIUS,
                top: stick.originY - stick.dy * STICK_RADIUS,
                width: 44,
                height: 44,
              }}
            />
          </>
        )}
      </div>

      {/* Jump sits bottom-right; it is the only control needed constantly. */}
      <button
        type="button"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-20 h-20 w-20 touch-none rounded-full border border-white/20 bg-white/10 text-xs uppercase tracking-widest text-white/70 active:bg-white/25"
        onTouchStart={(e) => {
          e.preventDefault();
          input.jumpAt = now();
          input.jumpHeld = true;
        }}
        onTouchEnd={() => {
          input.jumpHeld = false;
        }}
      >
        Jump
      </button>

      {nearby && (
        <button
          type="button"
          className="fixed bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+6rem)] right-6 z-20 h-20 w-20 touch-none rounded-full border border-accent/60 bg-accent/20 text-xs uppercase tracking-widest text-accent active:bg-accent/40"
          onTouchStart={(e) => {
            e.preventDefault();
            if (nearby.target) openPanel(nearby.target);
          }}
        >
          Look
        </button>
      )}
    </>
  );
}
