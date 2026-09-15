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

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [missing, setMissing] = useState(false);
  const sprite = useRef<Sprite | null>(null);
  const [debug, setDebug] = useState(false);

  const paused = useGame((s) => s.paused);
  const nearby = useGame((s) => s.nearby);
  const setNearby = useGame((s) => s.setNearby);
  const openPanel = useGame((s) => s.openPanel);

  const aspect = layout.image.width / layout.image.height;

  /** Hot state, read every frame — deliberately not React state. */
  const character = useRef<Character>(
    createCharacter(firstWalkablePoint(layout) ?? { x: 0.5, y: 0.5 }),
  );
  const keys = useRef(new Set<string>());
  /** Waypoints left to walk, from a click. Empty when steering by hand. */
  const route = useRef<Point[]>([]);
  const grid = useRef<Grid | null>(null);
  const fit = useRef({ scale: 1, x: 0, y: 0 });

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
      if (code === "KeyG") setDebug((d) => !d);
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

  const pointerToImage = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { scale, x, y } = fit.current;
    return {
      x: (clientX - rect.left - x) / (layout.image.width * scale),
      y: (clientY - rect.top - y) / (layout.image.height * scale),
    };
  }, []);

  /* --------------------------------------------------------------- frame */

  useEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let last = performance.now();
    let lastNearbyId: string | null = null;

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

      // The whole map, always: there is no zoom past the image's own pixels.
      const scale = Math.min(width / layout.image.width, height / layout.image.height);
      const ox = (width - layout.image.width * scale) / 2;
      const oy = (height - layout.image.height * scale) / 2;
      fit.current = { scale, x: ox, y: oy };

      if (!useGame.getState().paused) {
        const held = keys.current;
        const manual = {
          x: (held.has("ArrowRight") || held.has("KeyD") ? 1 : 0) -
            (held.has("ArrowLeft") || held.has("KeyA") ? 1 : 0),
          y: (held.has("ArrowDown") || held.has("KeyS") ? 1 : 0) -
            (held.has("ArrowUp") || held.has("KeyW") ? 1 : 0),
        };

        let intent = manual;
        if (!manual.x && !manual.y && route.current.length) {
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

        character.current = advance(character.current, intent, dt, layout.shapes, aspect);

        const hotspot = hotspotAt(character.current.at, layout);
        const id = hotspot?.id ?? null;
        if (id !== lastNearbyId) {
          lastNearbyId = id;
          setNearby(
            hotspot
              ? {
                  id: hotspot.id,
                  label: hotspot.label,
                  target: targetForHotspot(hotspot.id),
                }
              : null,
          );
        }
      }

      ctx.fillStyle = "#0f141a";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, ox, oy, layout.image.width * scale, layout.image.height * scale);

      const toCanvas = (p: Point) => ({
        x: ox + p.x * layout.image.width * scale,
        y: oy + p.y * layout.image.height * scale,
      });

      if (debug) {
        for (const shape of layout.shapes) {
          ctx.beginPath();
          shape.points.forEach((p, i) => {
            const s = toCanvas(p);
            if (i === 0) ctx.moveTo(s.x, s.y);
            else ctx.lineTo(s.x, s.y);
          });
          ctx.closePath();
          ctx.fillStyle = shape.kind === "walk" ? "#38bdf833" : "#f8717133";
          ctx.fill();
          ctx.strokeStyle = shape.kind === "walk" ? "#38bdf8" : "#f87171";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        for (const spot of layout.hotspots) {
          const s = toCanvas(spot.at);
          ctx.beginPath();
          ctx.arc(s.x, s.y, spot.radius * layout.image.width * scale, 0, Math.PI * 2);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

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
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [image, aspect, debug, setNearby]);

  const hint = useMemo(
    () => (nearby ? nearby.label : "arrows or click to walk · G shows the ground"),
    [nearby],
  );

  return (
    <div className="fixed inset-0 bg-[#0f141a]">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-pointer"
        onPointerDown={(e) => {
          if (useGame.getState().paused) return;
          keys.current.clear();

          // The grid costs about a tenth of a second to sample, so it is built
          // on the first click rather than on load — by which time the map is
          // already on screen and the player has decided where to go.
          grid.current ??= buildGrid(layout.shapes, aspect);

          const destination = pointerToImage(e.clientX, e.clientY);
          const found = findPath(grid.current, character.current.at, destination);
          route.current = found
            ? smoothPath(found, layout.shapes, aspect).slice(1)
            : [];
        }}
      />

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
        <span className="flex gap-4">
          <Link href="/calibrate" className="pointer-events-auto font-mono underline underline-offset-4">
            calibrate
          </Link>
          <Link href="/cv" className="pointer-events-auto font-mono underline underline-offset-4">
            résumé
          </Link>
        </span>
      </nav>

      <Panel />
    </div>
  );
}
