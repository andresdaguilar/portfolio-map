import { BOOKS, CREDENTIALS, EXPERIENCE, PROJECTS, SHOWS, VOLUMES } from "@/content";
import type { Footprint } from "../core/nav";
import type { Platform } from "../core/terrain";
import type { PanelTarget } from "@/game/core/store";
import { ISLAND_PLATFORMS, island } from "./islands";

/**
 * What stands on the islands.
 *
 * Nothing is enclosed. In a fixed isometric view a walled building hides its
 * own contents and turns into a box you walk around, so the vocabulary is
 * decks, colonnades, shelves, stones and open stages — places you can read
 * from across the water before deciding to cross to them.
 */

export type BuildingKind =
  | "desk"
  | "plaque"
  | "university"
  | "fountain"
  | "monument"
  | "roundtable"
  | "console"
  | "acoustic"
  | "totem"
  | "bookcase"
  | "book-display"
  | "armchair"
  | "billboard"
  | "surfboard"
  | "weights"
  | "bench"
  | "piano"
  | "rackets"
  | "mat";

export interface Building {
  id: string;
  kind: BuildingKind;
  x: number;
  /** Height of the ground it stands on. */
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  accent?: string;
  label?: string;
  /** Second line: the role and years, the episode count, the status. */
  sub?: string;
  rotation?: number;
}

export interface IsoPoi {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  label: string;
  target: PanelTarget;
  secret?: { id: string; line: string };
}

export const C = {
  stone: "#cfc4ae",
  stoneDark: "#a89a80",
  timber: "#9c7a54",
  timberDark: "#6f5334",
  marble: "#e6e0d3",
  slate: "#6f7d88",
  ink: "#2c3440",
  screen: "#4a6b86",
  accent: "#e8a33d",
  hedge: "#5f7d4a",
} as const;

/* ---------------------------------------------------------------- terrace */

/**
 * The career terrace: a wide staircase that turns a corner.
 *
 * Each landing is one job, one shallow step above the last, with a desk on it.
 * The rise is deliberately small — the point is that it never stops going up,
 * not that the climb is hard.
 */
const TERRACE = {
  landing: 7,
  rise: 0.4,
  x: -64,
  z: 20,
  firstArm: 5,
} as const;

export interface Landing {
  id: string;
  company: string;
  role: string;
  years: string;
  x: number;
  z: number;
  y: number;
  size: number;
  accent: string;
  /** Which leg of the L this landing is on. Decides where the desk goes. */
  arm: "first" | "second";
}

export const LANDINGS: Landing[] = EXPERIENCE.map((job, i) => {
  const first = job.roles[0];
  const last = job.roles[job.roles.length - 1];
  const beforeCorner = i < TERRACE.firstArm;

  return {
    id: job.id,
    company: job.company,
    role: last.title,
    years: `${first.from.slice(0, 4)} — ${last.to ? last.to.slice(0, 4) : "now"}`,
    x: beforeCorner ? TERRACE.x : TERRACE.x + (i - TERRACE.firstArm + 1) * TERRACE.landing,
    z: beforeCorner
      ? TERRACE.z - i * TERRACE.landing
      : TERRACE.z - (TERRACE.firstArm - 1) * TERRACE.landing,
    y: i * TERRACE.rise,
    size: TERRACE.landing,
    accent: job.set.practicalLight,
    arm: beforeCorner ? "first" : "second",
  };
});

/**
 * A desk and a plaque on every landing, pushed to one side.
 *
 * The middle of the landing has to stay clear: the first version put the desk
 * dead centre and the walker simply could not get past it to the next step.
 * The first leg of the L runs along Z, so its furniture moves aside in X; the
 * second leg runs along X, so its furniture moves aside in Z.
 */
function terrace(): Building[] {
  /**
   * The desk sits hard against the parapet rather than near it.
   *
   * Leaving a little daylight between them creates a slot narrower than the
   * walker, which is worse than no gap at all — you get wedged instead of
   * walking past. Flush, the whole rest of the landing is one clear lane.
   */
  const aside = 1.85;
  const plaqueAside = 2.0;
  const deskLong = 3;
  const deskShort = 1.6;

  return LANDINGS.flatMap((l): Building[] => {
    // The first leg runs along Z and the second along X, so the furniture
    // turns with the corner to keep the same clearance on both.
    const alongZ = l.arm === "first";
    return [
      {
        id: l.id,
        kind: "desk",
        x: alongZ ? l.x - aside : l.x,
        y: l.y,
        // The second leg puts its desks on the far side: the walker arrives
        // from the first leg pressed against the near edge, and furniture
        // there would meet them head-on at the corner.
        z: alongZ ? l.z : l.z + aside,
        w: alongZ ? deskLong : deskShort,
        d: alongZ ? deskShort : deskLong,
        h: 1.5,
        color: C.timber,
        accent: l.accent,
        label: l.company,
        sub: `${l.role} · ${l.years}`,
        rotation: alongZ ? 0 : Math.PI / 2,
      },
      {
        id: `plaque-${l.id}`,
        kind: "plaque",
        x: alongZ ? l.x + plaqueAside : l.x,
        y: l.y,
        z: alongZ ? l.z : l.z - plaqueAside,
        w: alongZ ? 1.8 : 0.4,
        d: alongZ ? 0.4 : 1.8,
        h: 0.95,
        color: C.stone,
        accent: l.accent,
        label: l.company,
        rotation: alongZ ? 0 : Math.PI / 2,
      },
    ];
  });
}

/* --------------------------------------------------------------- academy */

function academy(): Building[] {
  const i = island("education");
  const degree = CREDENTIALS.find((c) => c.kind === "degree")!;
  const certificates = CREDENTIALS.filter((c) => c.kind === "certification");

  return [
    {
      id: degree.id,
      kind: "university",
      x: i.x,
      y: 0,
      z: i.z - 4,
      w: 18,
      d: 10,
      h: 8,
      color: C.marble,
      accent: C.accent,
      label: degree.title,
      sub: degree.issuer,
    },
    {
      id: "fountain",
      kind: "fountain",
      x: i.x,
      y: 0,
      z: i.z + 6,
      w: 5,
      d: 5,
      h: 1.5,
      color: C.stone,
      accent: "#6fa8c7",
      label: "Fountain",
    },
    ...certificates.map((c, n): Building => ({
      id: c.id,
      kind: "monument",
      x: i.x - 10 + n * 5,
      y: 0,
      z: i.z + 11,
      w: 1.4,
      d: 1.4,
      h: 2.2,
      color: C.marble,
      accent: C.accent,
      label: c.title,
      sub: c.issuer,
    })),
  ];
}

/* ---------------------------------------------------------------- studio */

function studio(): Building[] {
  const i = island("studio");

  return [
    {
      id: "acoustic",
      kind: "acoustic",
      x: i.x,
      y: 0,
      z: i.z - 8,
      w: 16,
      d: 0.6,
      h: 5,
      color: C.timberDark,
      accent: C.accent,
      label: "On air",
      sub: "Six shows, recorded outdoors",
    },
    {
      id: "microphone",
      kind: "roundtable",
      x: i.x,
      y: 0,
      z: i.z - 2,
      w: 5,
      d: 5,
      h: 1.1,
      color: C.timber,
      accent: C.ink,
      label: "The table",
      sub: "Where the six shows get recorded",
    },
    {
      id: "console",
      kind: "console",
      x: i.x + 8,
      y: 0,
      z: i.z - 2,
      w: 3,
      d: 1.6,
      h: 1.1,
      color: C.slate,
      accent: "#7fd4a8",
      label: "The desk",
      sub: "Cut, level, publish",
    },
    ...SHOWS.map((show, n): Building => ({
      id: show.id,
      kind: "totem",
      x: i.x - 10 + n * 4,
      y: 0,
      z: i.z + 8,
      w: 2.4,
      d: 0.5,
      h: 3,
      color: C.slate,
      accent: show.color,
      label: show.nativeName,
      sub: `${show.episodes} episodes`,
    })),
    ...VOLUMES.map((volume, n): Building => ({
      id: volume.id,
      kind: "monument",
      x: i.x - 6 + n * 4,
      y: 0,
      z: i.z + 3,
      w: 1.2,
      d: 0.9,
      h: 0.9,
      color: C.marble,
      accent: SHOWS.find((s) => s.id === volume.show)?.color ?? C.accent,
      label: volume.title,
    })),
  ];
}

/* --------------------------------------------------------------- library */

function library(): Building[] {
  const i = island("library");

  return [
    ...[0, 1, 2].map((n): Building => ({
      id: `bookcase-${n}`,
      kind: "bookcase",
      x: i.x - 9 + n * 9,
      y: 0,
      z: i.z - 8,
      w: 7,
      d: 1.1,
      h: 4.2,
      color: C.timberDark,
      accent: C.accent,
    })),
    {
      id: "shelf",
      kind: "book-display",
      x: i.x,
      y: 0,
      z: i.z + 2,
      w: 11,
      d: 1.6,
      h: 1.1,
      color: C.timber,
      accent: C.accent,
      label: "Written",
      sub: `${BOOKS.length} books`,
    },
    {
      id: "armchair",
      kind: "armchair",
      x: i.x + 8,
      y: 0,
      z: i.z + 5,
      w: 2.2,
      d: 2.2,
      h: 1.5,
      color: "#7a5c52",
      accent: C.accent,
      label: "Read",
      sub: "The other half of writing",
    },
    ...BOOKS.map((book, n): Building => ({
      id: book.id,
      kind: "monument",
      x: i.x - 5 + (n % 3) * 5,
      y: 0,
      z: i.z + 7 + Math.floor(n / 3) * 3.5,
      w: 1,
      d: 0.8,
      h: 0.8,
      color: C.marble,
      accent: book.color,
      label: book.title,
      sub: book.status === "published" ? "Published" : "In progress",
    })),
  ];
}

/* ---------------------------------------------------------------- commons */

function commons(): Building[] {
  const i = island("commons");
  return [
    { id: "surf", kind: "surfboard", x: i.x - 8, y: 0, z: i.z - 5, w: 0.8, d: 0.4, h: 2.8, color: "#e8e3d6", accent: "#4f8fb0", label: "Surf" },
    { id: "gym", kind: "weights", x: i.x - 3, y: 0, z: i.z - 5, w: 2.6, d: 1.2, h: 1.6, color: C.ink, accent: C.accent, label: "Gym" },
    { id: "bench", kind: "bench", x: i.x - 3, y: 0, z: i.z - 1, w: 2.4, d: 1, h: 0.9, color: C.ink, accent: C.accent, label: "Bench" },
    { id: "piano", kind: "piano", x: i.x + 5, y: 0, z: i.z - 4, w: 3.2, d: 1.4, h: 1.3, color: "#23282f", accent: C.marble, label: "Piano" },
    { id: "tennis", kind: "rackets", x: i.x + 6, y: 0, z: i.z + 3, w: 1.6, d: 1, h: 1.2, color: C.timber, accent: "#d8e05a", label: "Tennis" },
    { id: "mat", kind: "mat", x: i.x - 4, y: 0, z: i.z + 5, w: 3.4, d: 1.6, h: 0.1, color: "#5f8fa8", accent: "#e8e3d6", label: "Mat" },
  ];
}

/* ----------------------------------------------------------------- yards */

function yards(): Building[] {
  const i = island("yards");
  const perRow = 5;
  const spacing = 5.4;

  return PROJECTS.map((project, n): Building => {
    const row = Math.floor(n / perRow);
    const column = n % perRow;
    return {
      id: project.id,
      kind: "billboard",
      x: i.x - spacing * 2 + column * spacing,
      y: 0,
      z: i.z - 9 + row * 8,
      w: 3.6,
      d: 0.4,
      h: 4.4,
      color: C.slate,
      accent: C.screen,
      label: project.name,
      sub: project.stack[0],
    };
  });
}

/* ------------------------------------------------------------- assembled */

export const BUILDINGS: Building[] = [
  ...terrace(),
  ...academy(),
  ...studio(),
  ...library(),
  ...commons(),
  ...yards(),
];

/** Low or flat things are walked over, not into. */
const WALKABLE: BuildingKind[] = ["plaque", "monument", "mat"];

const RAILING_HEIGHT = 0.55;

/**
 * Parapets around the open edges of the terrace.
 *
 * Without them you walk off the top step and drop nearly three units, which
 * with a smoothed height reads as sinking rather than stepping down. Generated
 * from the landings: a side with a neighbour is a way through, a side without
 * one is an edge. The approach from the island is left open.
 */
function terraceRailings(): Footprint[] {
  const half = TERRACE.landing / 2;
  const key = (x: number, z: number) => `${Math.round(x)}:${Math.round(z)}`;
  const occupied = new Set(LANDINGS.map((l) => key(l.x, l.z)));
  const thickness = 0.4;
  const out: Footprint[] = [];

  for (const landing of LANDINGS) {
    for (const side of [
      { dx: TERRACE.landing, dz: 0 },
      { dx: -TERRACE.landing, dz: 0 },
      { dx: 0, dz: TERRACE.landing },
      { dx: 0, dz: -TERRACE.landing },
    ]) {
      if (occupied.has(key(landing.x + side.dx, landing.z + side.dz))) continue;
      if (landing.id === LANDINGS[0].id && side.dz > 0) continue;

      const horizontal = side.dx !== 0;
      out.push({
        id: `rail-${landing.id}-${side.dx}-${side.dz}`,
        x: landing.x + (horizontal ? Math.sign(side.dx) * half - thickness / 2 : -half),
        z: landing.z + (horizontal ? -half : Math.sign(side.dz) * half - thickness / 2),
        w: horizontal ? thickness : TERRACE.landing,
        d: horizontal ? TERRACE.landing : thickness,
      });
    }
  }
  return out;
}

export const RAILINGS: Footprint[] = terraceRailings();
export const RAIL_HEIGHT = RAILING_HEIGHT;

export const PLATFORMS: Platform[] = [
  ...ISLAND_PLATFORMS,
  ...LANDINGS.map((l) => ({
    id: `landing-${l.id}`,
    x: l.x - l.size / 2,
    z: l.z - l.size / 2,
    w: l.size,
    d: l.size,
    y: l.y,
  })),
];

export const BLOCKERS: Footprint[] = [
  ...BUILDINGS.filter((b) => !WALKABLE.includes(b.kind)).map((b) => ({
    id: b.id,
    x: b.x - b.w / 2,
    z: b.z - b.d / 2,
    w: b.w,
    d: b.d,
  })),
  ...RAILINGS,
];

/* ------------------------------------------------------------------- pois */

const ids = {
  jobs: new Set(EXPERIENCE.map((e) => e.id)),
  books: new Set(BOOKS.map((b) => b.id)),
  volumes: new Set(VOLUMES.map((v) => v.id)),
  projects: new Set(PROJECTS.map((p) => p.id)),
  credentials: new Set(CREDENTIALS.map((c) => c.id)),
  shows: new Set(SHOWS.map((s) => s.id)),
};

const HOBBY_LINES: Record<string, string> = {
  piano: "Still practising. The left hand is the honest one.",
  tennis: "Backhand down the line. It works maybe one time in four.",
  gym: "Where the deploy anxiety goes.",
  bench: "Three sets, and then the rest of the day is easier.",
  surf: "Buenos Aires is not a surf town. That has never stopped anyone.",
  mat: "Ten minutes that decide how the other fourteen hours go.",
};

function targetFor(id: string): PanelTarget {
  if (ids.jobs.has(id)) return { kind: "experience", id };
  if (ids.books.has(id)) return { kind: "book", id };
  if (ids.volumes.has(id)) return { kind: "volume", id };
  if (ids.projects.has(id)) return { kind: "project", id };
  if (ids.shows.has(id)) return { kind: "show", id };
  if (ids.credentials.has(id)) return { kind: "credentials" };
  if (id === "shelf" || id === "armchair") return { kind: "contact" };
  return null;
}

export const ISO_POIS: IsoPoi[] = BUILDINGS.filter(
  (b) => b.label && !b.id.startsWith("plaque-") && !b.id.startsWith("bookcase-"),
).map((b): IsoPoi => {
  const hobby = HOBBY_LINES[b.id];
  return {
    id: b.id,
    x: b.x,
    y: b.y,
    z: b.z + b.d / 2 + 1.5,
    radius: Math.max(2.4, b.w * 0.5 + 1.5),
    label: b.label!,
    target: hobby ? null : targetFor(b.id),
    secret: hobby ? { id: b.id, line: hobby } : undefined,
  };
});

/** Where the player starts: the middle of the plaza. */
export const ISO_SPAWN = { x: 0, z: 4 };

export function nearestIsoPoi(x: number, z: number): IsoPoi | null {
  let best: IsoPoi | null = null;
  let bestDistance = Infinity;

  for (const poi of ISO_POIS) {
    const distance = Math.hypot(poi.x - x, poi.z - z);
    if (distance > poi.radius) continue;
    if (distance < bestDistance) {
      best = poi;
      bestDistance = distance;
    }
  }
  return best;
}
