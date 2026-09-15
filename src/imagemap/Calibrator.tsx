"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { isWalkable } from "./geometry";
import type { Hotspot, MapLayout, Point, Shape, ShapeKind } from "./types";
import { EMPTY_LAYOUT } from "./types";

/**
 * A tool for drawing the walkable layout onto the map image.
 *
 * The map is a picture, so the game has no idea where the ground is. Rather
 * than guessing coordinates and iterating blind, this lets the outlines be
 * traced directly over the image and exported as data. Everything it produces
 * is normalised to the image, so the result holds at any display size.
 *
 * Development-only: it is a workbench, not part of the portfolio.
 */

type Mode = "walk" | "block" | "hotspot" | "spawn";

const SECTIONS = [
  "work",
  "education",
  "certifications",
  "podcast",
  "library",
  "hobbies",
  "portfolio",
  "plaza",
] as const;

const COLOURS: Record<Mode, string> = {
  walk: "#38bdf8",
  block: "#f87171",
  hotspot: "#facc15",
  spawn: "#4ade80",
};

const DEFAULT_IMAGE = "/map/map.png";
/** Clicking within this many screen pixels of the first point closes a shape. */
const SNAP = 12;

/**
 * The outline being drawn and the outlines already drawn are one state, not
 * two.
 *
 * Kept apart, two "close the shape" events firing before React re-rendered
 * both read the same unfinished outline and committed it twice. A reducer
 * makes each action see the result of the one before it, so closing an
 * already-closed shape is simply a no-op.
 */
interface EditorState {
  layout: MapLayout;
  draft: Point[];
}

type Action =
  | { type: "image"; width: number; height: number }
  | { type: "point"; at: Point }
  | { type: "close"; kind: ShapeKind; id: string }
  | { type: "undo" }
  | { type: "clearDraft" }
  | { type: "hotspot"; hotspot: Hotspot }
  | { type: "radius"; index: number; radius: number }
  | { type: "spawn"; at: Point }
  | { type: "removeShape"; index: number }
  | { type: "removeHotspot"; index: number }
  | { type: "load"; layout: MapLayout };

function reduce(state: EditorState, action: Action): EditorState {
  const { layout, draft } = state;

  switch (action.type) {
    case "image":
      return {
        ...state,
        layout: { ...layout, image: { width: action.width, height: action.height } },
      };

    case "point":
      return { ...state, draft: [...draft, action.at] };

    case "close": {
      // Fewer than three points is not an outline; and once committed the
      // draft is empty, so a repeated close does nothing.
      if (draft.length < 3) return state;
      const shape: Shape = { id: action.id, kind: action.kind, points: draft };
      return { layout: { ...layout, shapes: [...layout.shapes, shape] }, draft: [] };
    }

    case "undo":
      if (draft.length) return { ...state, draft: draft.slice(0, -1) };
      return { ...state, layout: { ...layout, shapes: layout.shapes.slice(0, -1) } };

    case "clearDraft":
      return { ...state, draft: [] };

    case "hotspot":
      return { ...state, layout: { ...layout, hotspots: [...layout.hotspots, action.hotspot] } };

    case "radius":
      return {
        ...state,
        layout: {
          ...layout,
          hotspots: layout.hotspots.map((h, i) =>
            i === action.index ? { ...h, radius: action.radius } : h,
          ),
        },
      };

    case "spawn":
      return { ...state, layout: { ...layout, spawn: action.at } };

    case "removeShape":
      return {
        ...state,
        layout: { ...layout, shapes: layout.shapes.filter((_, i) => i !== action.index) },
      };

    case "removeHotspot":
      return {
        ...state,
        layout: { ...layout, hotspots: layout.hotspots.filter((_, i) => i !== action.index) },
      };

    case "load":
      return { layout: { ...EMPTY_LAYOUT, ...action.layout }, draft: [] };
  }
}

export function Calibrator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [{ layout, draft }, dispatch] = useReducer(reduce, {
    layout: EMPTY_LAYOUT,
    draft: [],
  });
  const [mode, setMode] = useState<Mode>("walk");
  const [name, setName] = useState<string>(SECTIONS[0]);

  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const panning = useRef<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);

  /* ------------------------------------------------------------- loading */

  const adoptImage = useCallback((img: HTMLImageElement) => {
    setImage(img);
    setImageError(null);
    dispatch({ type: "image", width: img.naturalWidth, height: img.naturalHeight });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => adoptImage(img);
    img.onerror = () =>
      setImageError(
        `No image at ${DEFAULT_IMAGE} — drop the map anywhere on this page, or use Load image.`,
      );
    img.src = DEFAULT_IMAGE;
  }, [adoptImage]);

  const loadFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        adoptImage(img);
        // The bitmap is decoded by now; the object URL has done its job.
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [adoptImage],
  );

  /* ----------------------------------------------------- fitting the view */

  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const zoom = Math.min(
      canvas.clientWidth / image.naturalWidth,
      canvas.clientHeight / image.naturalHeight,
    );
    setView({
      zoom,
      x: (canvas.clientWidth - image.naturalWidth * zoom) / 2,
      y: (canvas.clientHeight - image.naturalHeight * zoom) / 2,
    });
  }, [image]);

  useEffect(() => {
    fit();
  }, [fit]);

  /* ------------------------------------------------------- coordinates */

  /** Screen pixels to normalised image space. */
  const toImage = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return null;
      const rect = canvas.getBoundingClientRect();
      const px = (clientX - rect.left - view.x) / view.zoom;
      const py = (clientY - rect.top - view.y) / view.zoom;
      return { x: px / image.naturalWidth, y: py / image.naturalHeight };
    },
    [image, view],
  );

  /** Normalised image space back to canvas pixels. */
  const toScreen = useCallback(
    (point: Point): Point => ({
      x: point.x * (image?.naturalWidth ?? 0) * view.zoom + view.x,
      y: point.y * (image?.naturalHeight ?? 0) * view.zoom + view.y,
    }),
    [image, view],
  );

  /* ------------------------------------------------------------ drawing */

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0f141a";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    if (image) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        image,
        view.x,
        view.y,
        image.naturalWidth * view.zoom,
        image.naturalHeight * view.zoom,
      );
    }

    const outline = (points: Point[], colour: string, closed: boolean) => {
      if (points.length === 0) return;
      ctx.beginPath();
      points.forEach((p, i) => {
        const s = toScreen(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      if (closed) ctx.closePath();
      ctx.fillStyle = `${colour}22`;
      if (closed) ctx.fill();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.stroke();

      for (const p of points) {
        const s = toScreen(p);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.fill();
      }
    };

    for (const shape of layout.shapes) {
      outline(shape.points, COLOURS[shape.kind], true);
      if (shape.points.length) {
        const s = toScreen(shape.points[0]);
        ctx.fillStyle = COLOURS[shape.kind];
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(shape.id, s.x + 6, s.y - 6);
      }
    }

    for (const hotspot of layout.hotspots) {
      const s = toScreen(hotspot.at);
      const r = hotspot.radius * (image?.naturalWidth ?? 0) * view.zoom;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `${COLOURS.hotspot}22`;
      ctx.fill();
      ctx.strokeStyle = COLOURS.hotspot;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = COLOURS.hotspot;
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(hotspot.id, s.x + r + 4, s.y);
    }

    if (layout.spawn) {
      const s = toScreen(layout.spawn);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = COLOURS.spawn;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // The shape being drawn, with a rubber band to the cursor.
    if (draft.length) {
      const live = cursor ? [...draft, cursor] : draft;
      outline(live, COLOURS[mode === "hotspot" || mode === "spawn" ? "walk" : mode], false);
    }
  }, [image, layout, draft, cursor, view, mode, toScreen]);

  /* ------------------------------------------------------------- editing */

  const closeShape = useCallback(
    (kind: ShapeKind) => {
      dispatch({
        type: "close",
        kind,
        id: name.trim() || `${kind}-${layout.shapes.length + 1}`,
      });
    },
    [name, layout.shapes.length],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    // Middle button, or right button, pans.
    if (event.button === 1 || event.button === 2) {
      panning.current = { x: event.clientX - view.x, y: event.clientY - view.y };
      return;
    }
    if (event.button !== 0) return;

    const point = toImage(event.clientX, event.clientY);
    if (!point) return;

    if (mode === "spawn") {
      dispatch({ type: "spawn", at: point });
      return;
    }

    if (mode === "hotspot") {
      const id = name.trim() || `hotspot-${layout.hotspots.length + 1}`;
      const hotspot: Hotspot = {
        id,
        at: point,
        radius: 0.035,
        label: id.charAt(0).toUpperCase() + id.slice(1),
      };
      dispatch({ type: "hotspot", hotspot });
      return;
    }

    // Clicking the first point again closes the outline.
    if (draft.length >= 3) {
      const first = toScreen(draft[0]);
      const here = toScreen(point);
      if (Math.hypot(first.x - here.x, first.y - here.y) < SNAP) {
        closeShape(mode);
        return;
      }
    }

    dispatch({ type: "point", at: point });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (panning.current) {
      setView((v) => ({
        ...v,
        x: event.clientX - panning.current!.x,
        y: event.clientY - panning.current!.y,
      }));
      return;
    }
    setCursor(toImage(event.clientX, event.clientY));
  };

  const endPan = () => {
    panning.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const factor = event.deltaY > 0 ? 1 / 1.15 : 1.15;

      setView((v) => {
        const zoom = Math.min(12, Math.max(0.05, v.zoom * factor));
        const ratio = zoom / v.zoom;
        // Zoom about the cursor, so the pixel under it stays put.
        return { zoom, x: mx - (mx - v.x) * ratio, y: my - (my - v.y) * ratio };
      });
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;

      if (event.key === "Enter") {
        event.preventDefault();
        if (mode === "walk" || mode === "block") closeShape(mode);
      }
      if (event.key === "Escape") dispatch({ type: "clearDraft" });
      if (event.key === "Backspace") {
        event.preventDefault();
        dispatch({ type: "undo" });
      }
      if (event.key === "f") fit();
      if (event.key === "1") setMode("walk");
      if (event.key === "2") setMode("block");
      if (event.key === "3") setMode("hotspot");
      if (event.key === "4") setMode("spawn");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeShape, fit, mode]);

  /* -------------------------------------------------------------- checks */

  /**
   * Can the character actually get to each hotspot?
   *
   * A hotspot marks the thing, not the standing spot, so its own centre is
   * usually inside a building. What matters is whether any walkable ground
   * falls within its radius — and the first pass produced several that were
   * twice their radius from the nearest path, which would have looked like a
   * bug in the game rather than a gap in the tracing.
   */
  const unreachable = useMemo(() => {
    const out = new Set<string>();
    const rings = 14;
    const steps = 32;

    for (const hotspot of layout.hotspots) {
      let reachable = isWalkable(hotspot.at, layout.shapes);
      for (let r = 1; r <= rings && !reachable; r += 1) {
        const radius = (hotspot.radius * r) / rings;
        for (let s = 0; s < steps; s += 1) {
          const angle = (s / steps) * Math.PI * 2;
          const probe = {
            x: hotspot.at.x + Math.cos(angle) * radius,
            // The image is wider than tall, so a circle on screen is an
            // ellipse in normalised space.
            y: hotspot.at.y + (Math.sin(angle) * radius * layout.image.width) / (layout.image.height || 1),
          };
          if (isWalkable(probe, layout.shapes)) {
            reachable = true;
            break;
          }
        }
      }
      if (!reachable) out.add(hotspot.id);
    }
    return out;
  }, [layout]);

  const duplicateIds = useMemo(() => {
    const seen = new Map<string, number>();
    for (const shape of layout.shapes) seen.set(shape.id, (seen.get(shape.id) ?? 0) + 1);
    return new Set([...seen].filter(([, n]) => n > 1).map(([id]) => id));
  }, [layout.shapes]);

  /* ------------------------------------------------------------- export */

  const json = useMemo(() => JSON.stringify(layout, null, 2), [layout]);

  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "map-layout.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    file.text().then((text) => {
      try {
        dispatch({ type: "load", layout: JSON.parse(text) as MapLayout });
      } catch {
        setImageError("That file is not a layout this tool wrote.");
      }
    });
  };

  return (
    <div
      className="flex h-dvh w-full bg-void text-text"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (file.type === "application/json") importJson(file);
        else loadFile(file);
      }}
    >
      <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-edge p-4">
        <div>
          <h1 className="font-mono text-sm uppercase tracking-widest text-accent">
            Map calibrator
          </h1>
          <p className="mt-1 text-xs text-muted">
            Trace the ground the character can walk on.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(["walk", "block", "hotspot", "spawn"] as Mode[]).map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded border px-2 py-1.5 text-xs ${
                mode === m
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-edge text-muted hover:border-muted"
              }`}
            >
              {i + 1} · {m}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-xs text-muted">Name for the next shape</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            list="sections"
            className="mt-1 w-full rounded border border-edge bg-mid px-2 py-1 font-mono text-sm"
          />
          <datalist id="sections">
            {SECTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        {(mode === "walk" || mode === "block") && (
          <button
            type="button"
            disabled={draft.length < 3}
            onClick={() => closeShape(mode)}
            className="rounded border border-accent/60 bg-accent/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-accent disabled:border-edge disabled:bg-transparent disabled:text-muted"
          >
            Close shape ({draft.length} pts)
          </button>
        )}

        <div className="rounded border border-edge bg-mid p-3 text-xs leading-relaxed text-muted">
          <p><span className="text-text">Click</span> to drop a point.</p>
          <p><span className="text-text">Enter</span> or click the first point to close.</p>
          <p><span className="text-text">Backspace</span> undoes a point, then a shape.</p>
          <p><span className="text-text">Wheel</span> zooms, <span className="text-text">right-drag</span> pans, <span className="text-text">F</span> fits.</p>
        </div>

        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted">
            Shapes ({layout.shapes.length})
          </p>
          <ul className="mt-2 space-y-1">
            {layout.shapes.map((shape, i) => (
              <li key={`${shape.id}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-mono" style={{ color: COLOURS[shape.kind] }}>
                  {shape.id}
                  <span className="text-muted"> · {shape.points.length}</span>
                  {duplicateIds.has(shape.id) && (
                    <span className="ml-1 text-amber-400" title="Another shape has this name">
                      ⚠
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "removeShape", index: i })}
                  className="text-muted hover:text-accent"
                >
                  ×
                </button>
              </li>
            ))}
            {layout.hotspots.map((hotspot, i) => (
              <li key={`h-${hotspot.id}-${i}`} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono" style={{ color: COLOURS.hotspot }}>
                    ◎ {hotspot.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "removeHotspot", index: i })}
                    className="text-muted hover:text-accent"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.14}
                  step={0.005}
                  value={hotspot.radius}
                  onChange={(e) =>
                    dispatch({ type: "radius", index: i, radius: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-amber-400"
                />
                {unreachable.has(hotspot.id) && (
                  <p className="text-[10px] leading-tight text-amber-400">
                    No walkable ground in range — widen it or trace the path closer.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={download}
            className="w-full rounded bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-wider text-void"
          >
            Export layout
          </button>
          <details className="rounded border border-edge">
            <summary className="cursor-pointer px-3 py-2 text-xs text-muted">
              Layout JSON
            </summary>
            <textarea
              readOnly
              value={json}
              onFocus={(e) => e.currentTarget.select()}
              className="h-40 w-full resize-none bg-void p-2 font-mono text-[10px] leading-snug text-muted"
            />
          </details>

          <label className="block cursor-pointer rounded border border-edge px-3 py-2 text-center text-xs text-muted hover:border-muted">
            Load image or layout
            <input
              type="file"
              accept="image/*,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.type === "application/json") importJson(file);
                else loadFile(file);
              }}
            />
          </label>
        </div>
      </aside>

      <main className="relative flex-1">
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerLeave={endPan}
          onContextMenu={(e) => e.preventDefault()}
        />

        {imageError && (
          <p className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded border border-edge bg-mid p-4 text-center text-sm text-muted">
            {imageError}
          </p>
        )}

        {image && cursor && (
          <p className="pointer-events-none absolute bottom-3 right-3 rounded bg-void/80 px-2 py-1 font-mono text-xs text-muted">
            {cursor.x.toFixed(4)}, {cursor.y.toFixed(4)} · {Math.round(view.zoom * 100)}%
          </p>
        )}
      </main>
    </div>
  );
}
