"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Panel } from "@/game/ui/Panel";
import { useGame } from "@/game/core/store";
import { advance, createCharacter, intentTowards, type Character } from "./character";
import { drawCharacter } from "./drawCharacter";
import { drawSprite, loadSprite, type Sprite } from "./sprite";
import { firstWalkablePoint, hotspotAt } from "./geometry";
import { buildGrid, findPath, smoothPath, type Grid } from "./pathfinding";
import { targetForHotspot } from "./resolve";
import rawLayout from "./layout.json";
import type { MapLayout, Point } from "./types";
import { MAP_IMAGE } from "./config";
import { fitView } from "./view";
import {
  DEAD_ZONE_PX,
  isSteering,
  steerTowards,
  type Screen,
} from "./steer";

/**
 * The map, walked.
 *
 * The world is a picture, so everything here is a thin layer over it: the
 * image is drawn to fill the viewport, the traced outlines say where the
 * ground is, and a small figure walks on it. Nothing is simulated in three
 * dimensions — there is nothing to simulate.
 */

const layout = rawLayout as MapLayout;

/**
 * Character height as a fraction of the image's height.
 *
 * Sized against the scene rather than picked: at 0.08 the figure stands about
 * as tall as the desks on the career terrace, which is what makes the map read
 * as a place with a person in it rather than a board with a token on it.
 */
const CHARACTER_HEIGHT = 0.08;

/** Size of the stick's knob under the thumb, in canvas pixels. */
const KNOB_RADIUS = 18;

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [missing, setMissing] = useState(false);
  const sprite = useRef<Sprite | null>(null);

  const paused = useGame((s) => s.paused);
  const nearby = useGame((s) => s.nearby);
  const openPanel = useGame((s) => s.openPanel);

  const aspect = layout.image.width / layout.image.height;
  /** A layout with no ground in it has not been traced yet. */
  const traced = layout.shapes.some((shape) => shape.kind === "walk");

  /** Hot state, read every frame — deliberately not React state. */
  const character = useRef<Character>(
    createCharacter(firstWalkablePoint(layout) ?? { x: 0.5, y: 0.5 }),
  );
  const keys = useRef(new Set<string>());
  /** Waypoints left to walk, from a click. Empty when steering by hand. */
  const route = useRef<Point[]>([]);
  const grid = useRef<Grid | null>(null);
  /**
   * The pointer currently held down, if any.
   *
   * Mutated in place rather than set through React: it changes on every
   * pointermove and is read on every frame, and a re-render at either rate
   * would be a re-render too many.
   */
  const hold = useRef<{
    id: number;
    /** Where the press started — only used to tell a drag from a tap. */
    from: Screen;
    at: Screen;
    since: number;
    steering: boolean;
  } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setMissing(true);
    img.src = MAP_IMAGE;
  }, []);

  useEffect(() => {
    let live = true;
    // Quietly upgrades the figure if a drawn one has been supplied.
    loadSprite().then((loaded) => {
      if (!live) return;
      sprite.current = loaded;
      if (process.env.NODE_ENV === "development") {
        (window as unknown as Record<string, unknown>).__map = {
          sprite: loaded,
          character,
          route,
          layout,
        };
      }
    });
    return () => {
      live = false;
    };
  }, []);

  /* --------------------------------------------------------------- input */

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (useGame.getState().paused) return;
      const code = e.code;
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"].includes(code)
      ) {
        e.preventDefault();
        keys.current.add(code);
        // Steering by hand overrides wherever the last click was headed.
        route.current = [];
      }
      if (code === "KeyE" || code === "Enter") {
        const near = useGame.getState().nearby;
        if (near?.target) openPanel(near.target);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [openPanel]);

  /**
   * How the image is laid into the canvas — the whole map on a desktop window,
   * filled and following the walker on a phone. See `view.ts`.
   *
   * Worked out on demand rather than cached by the render loop. It used to be
   * a ref the loop filled each frame, which meant a click that landed before
   * the first frame — the map is a couple of megabytes, so there is a window —
   * was converted with the ref's initial values and walked somewhere else
   * entirely. That matters more now: on a phone the transform moves, so a
   * stale one is wrong on every frame rather than only the first.
   */
  const fitFor = useCallback(
    (canvas: HTMLCanvasElement) =>
      fitView(
        { width: canvas.clientWidth, height: canvas.clientHeight },
        layout.image,
        character.current.at,
      ),
    [],
  );

  const pointerToImage = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const { scale, x, y } = fitFor(canvas);
      return {
        x: (clientX - rect.left - x) / (layout.image.width * scale),
        y: (clientY - rect.top - y) / (layout.image.height * scale),
      };
    },
    [fitFor],
  );

  /* --------------------------------------------------------------- frame */

  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { scale, x: ox, y: oy } = fitFor(canvas);

      const state = useGame.getState();
      if (!state.paused) {
        const held = keys.current;
        const manual = {
          x: (held.has("ArrowRight") || held.has("KeyD") ? 1 : 0) -
            (held.has("ArrowLeft") || held.has("KeyA") ? 1 : 0),
          y: (held.has("ArrowDown") || held.has("KeyS") ? 1 : 0) -
            (held.has("ArrowUp") || held.has("KeyW") ? 1 : 0),
        };

        let intent = manual;
        let speed: number | undefined;

        const stick = hold.current;
        if (!manual.x && !manual.y && stick) {
          // Time alone can promote a press to a stick, so this is checked on
          // the frame as well as on pointermove — a finger that goes down and
          // never moves would otherwise wait for an event that never comes.
          stick.steering ||= isSteering(stick.from, stick.at, now - stick.since);
          if (stick.steering) {
            const rect = canvas.getBoundingClientRect();
            const steer = steerTowards(
              {
                x: ox + character.current.at.x * layout.image.width * scale,
                y: oy + character.current.at.y * layout.image.height * scale,
              },
              { x: stick.at.x - rect.left, y: stick.at.y - rect.top },
            );
            intent = steer.intent;
            speed = steer.speed;
          }
        }

        if (!manual.x && !manual.y && !hold.current?.steering && route.current.length) {
          // Waypoints are consumed as they are reached, so the last leg ends
          // exactly where the click was rather than near it.
          const next = route.current[0];
          const towards = intentTowards(character.current.at, next, aspect, 0.006);
          if (towards.x === 0 && towards.y === 0) {
            route.current.shift();
            intent = { x: 0, y: 0 };
          } else {
            intent = towards;
          }
        }

        character.current = advance(
          character.current,
          intent,
          dt,
          layout.shapes,
          aspect,
          speed,
        );

        // Compared against the store rather than a local cache: anything else
        // that writes `nearby` would leave a cache stale, and a stale one is
        // silent — the prompt simply never comes back.
        const hotspot = hotspotAt(character.current.at, layout);
        if ((hotspot?.id ?? null) !== (state.nearby?.id ?? null)) {
          state.setNearby(
            hotspot
              ? {
                  id: hotspot.id,
                  label: hotspot.label,
                  target: targetForHotspot(hotspot.id),
                }
              : null,
          );
        }
      } else {
        // A panel opened over a held finger. Drop the stick rather than let it
        // resume the moment the panel closes, pushing him somewhere nobody
        // asked for.
        hold.current = null;
      }

      ctx.fillStyle = "#0f141a";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, ox, oy, layout.image.width * scale, layout.image.height * scale);

      const toCanvas = (p: Point) => ({
        x: ox + p.x * layout.image.width * scale,
        y: oy + p.y * layout.image.height * scale,
      });

      const feet = toCanvas(character.current.at);
      const shared = {
        x: feet.x,
        y: feet.y,
        height: CHARACTER_HEIGHT * layout.image.height * scale,
        phase: character.current.phase,
        moving: character.current.moving,
      };

      if (sprite.current) {
        drawSprite(ctx, sprite.current, {
          ...shared,
          direction: character.current.direction,
          lastSide: character.current.lastSide,
        });
      } else {
        drawCharacter(ctx, { ...shared, facing: character.current.facing });
      }

      // The stick, drawn last so it sits over everything. Without it the map
      // just starts moving under a finger and nothing says why.
      const stick = hold.current;
      if (stick?.steering) {
        const rect = canvas.getBoundingClientRect();
        drawStick(ctx, feet, {
          x: stick.at.x - rect.left,
          y: stick.at.y - rect.top,
        });
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [image, aspect, fitFor]);

  const hint = useMemo(
    () => (nearby ? nearby.label : "tap to walk · hold to steer"),
    [nearby],
  );

  return (
    <div className="fixed inset-0 bg-[#0f141a]">
      <canvas
        ref={canvasRef}
        // `touch-none` matters: without it a drag across the map scrolls the
        // page instead of steering, and the stick never gets a second event.
        className="h-full w-full cursor-pointer touch-none"
        onPointerDown={(e) => {
          if (useGame.getState().paused) return;
          keys.current.clear();
          route.current = [];
          e.currentTarget.setPointerCapture(e.pointerId);
          hold.current = {
            id: e.pointerId,
            from: { x: e.clientX, y: e.clientY },
            at: { x: e.clientX, y: e.clientY },
            since: performance.now(),
            steering: false,
          };
        }}
        onPointerMove={(e) => {
          const held = hold.current;
          if (held?.id !== e.pointerId) return;
          held.at = { x: e.clientX, y: e.clientY };
          held.steering ||= isSteering(
            held.from,
            held.at,
            performance.now() - held.since,
          );
        }}
        onPointerUp={(e) => {
          const held = hold.current;
          if (held?.id !== e.pointerId) return;
          hold.current = null;

          // A press that never became a stick was a tap, and a tap means "go
          // there" — which is the pathfinder's job, not the stick's.
          if (held.steering || useGame.getState().paused) return;

          // The grid costs about a tenth of a second to sample, so it is built
          // on the first tap rather than on load — by which time the map is
          // already on screen and the player has decided where to go.
          grid.current ??= buildGrid(layout.shapes, aspect);

          const destination = pointerToImage(e.clientX, e.clientY);
          const found = findPath(grid.current, character.current.at, destination);
          route.current = found
            ? smoothPath(found, layout.shapes, aspect).slice(1)
            : [];
        }}
        onPointerCancel={() => {
          hold.current = null;
        }}
      />

      {!traced && !missing && (
        <div className="absolute inset-x-0 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded border border-edge bg-mid p-5 text-center">
          <p className="text-sm text-text">This map has not been traced yet.</p>
          <p className="mt-2 text-sm text-muted">
            Nothing knows where the ground is, so there is nowhere to walk.
            Draw the paths over it, then export the layout to{" "}
            <code className="font-mono text-xs text-text">
              src/imagemap/layout.json
            </code>
            .
          </p>
          <Link
            href="/calibrate"
            className="mt-4 inline-block rounded bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-void"
          >
            Open the calibrator
          </Link>
        </div>
      )}

      {missing && (
        <p className="absolute inset-x-0 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded border border-edge bg-mid p-4 text-center text-sm text-muted">
          No image at {MAP_IMAGE}. Put the map there, then reload.
        </p>
      )}

      {nearby && !paused && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-lg border border-accent/45 bg-void/90 py-3 pl-5 pr-3 backdrop-blur-sm">
            <p className="text-base font-medium text-text">{nearby.label}</p>
            {nearby.target && (
              <button
                type="button"
                className="pointer-events-auto flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-void"
                onClick={() => nearby.target && openPanel(nearby.target)}
              >
                Look · E
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 text-xs text-white/70">
        <span className="font-mono drop-shadow">{hint}</span>
        <Link href="/cv" className="pointer-events-auto font-mono underline underline-offset-4">
          résumé
        </Link>
      </nav>

      <Panel />
    </div>
  );
}

/**
 * The stick, while a finger is on it.
 *
 * Deliberately faint: it is feedback, not furniture, and the map underneath is
 * the reason anyone is here. The line from the character to the thumb is the
 * part that carries the meaning — it says which of the two things on screen is
 * pushing the other.
 */
function drawStick(
  ctx: CanvasRenderingContext2D,
  from: Screen,
  to: Screen,
): void {
  const reach = Math.hypot(to.x - from.x, to.y - from.y);
  if (reach <= DEAD_ZONE_PX) return;

  // Stop the line short of the knob so it does not draw through it.
  const t = Math.max(0, (reach - KNOB_RADIUS) / reach);

  ctx.save();
  ctx.strokeStyle = "rgba(232, 163, 61, 0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(to.x, to.y, KNOB_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(232, 163, 61, 0.2)";
  ctx.fill();
  ctx.strokeStyle = "rgba(232, 163, 61, 0.8)";
  ctx.stroke();
  ctx.restore();
}
