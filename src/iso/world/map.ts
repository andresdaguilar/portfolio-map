import { BOOKS, CREDENTIALS, EXPERIENCE, PROJECTS, SHOWS } from "@/content";
import type { Footprint } from "../core/nav";
import type { Platform } from "../core/terrain";
import type { PanelTarget } from "@/game/core/store";

/**
 * The town, laid out from the content.
 *
 * Nothing here is a closed building. The career is a wide terrace that climbs
 * in shallow steps, the studio is an open deck, the library is a floor with
 * shelves on it and no roof. In an isometric view a walled building is mostly
 * an obstacle that hides its own contents — an open plan lets the visitor see
 * what a place holds before deciding to walk into it.
 */

export interface District {
  id: string;
  name: string;
  caption: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

export type BuildingKind =
  | "plaque"
  | "columns"
  | "shelf"
  | "table"
  | "mic"
  | "totem"
  | "monument"
  | "stall"
  | "pavilion"
  | "court"
  | "pool";

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
  roof?: string;
  accent?: string;
  label?: string;
  /** Second line on a plaque: the role, the years. */
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

const C = {
  stone: "#cfc4ae",
  stoneDark: "#b3a691",
  timber: "#9c7a54",
  canvas: "#d8c9a8",
  marble: "#e3ddd0",
  slate: "#7a8a94",
  hedge: "#5f7d4a",
  deck: "#c3b391",
  accent: "#e8a33d",
} as const;

/* ---------------------------------------------------------------- terrace */

/**
 * The career terrace.
 *
 * Eight landings turning a corner: five climbing one way, three more after the
 * turn. The rise between them is deliberately small — the point is that you
 * are always going up, not that the climb is hard. An L rather than a straight
 * run so the whole thing sits in frame at an angle instead of running off the
 * side of the screen.
 */
const TERRACE = {
  landing: 8,
  rise: 0.45,
  startX: -4,
  startZ: -4,
  /** Landings before the corner. */
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
}

function terraceLandings(): Landing[] {
  return EXPERIENCE.map((job, i) => {
    const first = job.roles[0];
    const last = job.roles[job.roles.length - 1];
    const beforeCorner = i < TERRACE.firstArm;

    return {
      id: job.id,
      company: job.company,
      role: last.title,
      years: `${first.from.slice(0, 4)} — ${last.to ? last.to.slice(0, 4) : "now"}`,
      // The first arm runs away from the plaza; the second turns left.
      x: beforeCorner
        ? TERRACE.startX
        : TERRACE.startX - (i - TERRACE.firstArm + 1) * TERRACE.landing,
      z: beforeCorner
        ? TERRACE.startZ - i * TERRACE.landing
        : TERRACE.startZ - (TERRACE.firstArm - 1) * TERRACE.landing,
      y: i * TERRACE.rise,
      size: TERRACE.landing,
      accent: job.set.practicalLight,
    };
  });
}

export const LANDINGS: Landing[] = terraceLandings();

/* -------------------------------------------------------------- districts */

export const DISTRICTS: District[] = [
  {
    id: "work",
    name: "The Climb",
    caption: "Twenty years, eight steps.",
    x: -16,
    z: -20,
    w: 18,
    d: 20,
    color: C.stoneDark,
  },
  {
    id: "education",
    name: "The Academy",
    caption: "A degree and five certificates.",
    x: 26,
    z: -20,
    w: 11,
    d: 10,
    color: C.marble,
  },
  {
    id: "library",
    name: "The Library",
    caption: "Four volumes, open to the sky.",
    x: 34,
    z: 8,
    w: 11,
    d: 10,
    color: C.timber,
  },
  {
    id: "studio",
    name: "The Studio",
    caption: "Six shows, recorded outdoors.",
    x: 14,
    z: 30,
    w: 11,
    d: 9,
    color: C.slate,
  },
  {
    id: "yards",
    name: "The Yards",
    caption: "Things built after hours.",
    x: -14,
    z: 30,
    w: 21,
    d: 9,
    color: C.timber,
  },
  {
    id: "commons",
    name: "The Commons",
    caption: "Where the week goes.",
    x: -40,
    z: 6,
    w: 14,
    d: 13,
    color: C.hedge,
  },
];

const district = (id: string) => DISTRICTS.find((d) => d.id === id)!;

/* ------------------------------------------------------------- structures */

/** One low stone per landing, carrying the company, the role and the years. */
function terracePlaques(): Building[] {
  return LANDINGS.map((landing) => ({
    id: landing.id,
    kind: "plaque" as const,
    x: landing.x,
    y: landing.y,
    z: landing.z - 1.6,
    w: 3.4,
    d: 0.5,
    h: 1.25,
    color: C.stone,
    accent: landing.accent,
    label: landing.company,
    sub: `${landing.role} · ${landing.years}`,
  }));
}

/** An open colonnade: columns and a roof, no walls. */
function academy(): Building[] {
  const d = district("education");
  const degree = CREDENTIALS.find((c) => c.kind === "degree")!;
  const certificates = CREDENTIALS.filter((c) => c.kind === "certification");

  return [
    {
      id: degree.id,
      kind: "columns",
      x: d.x,
      y: ACADEMY_DECK.y,
      z: d.z - 2,
      w: 11,
      d: 7,
      h: 5,
      color: C.marble,
      roof: C.stoneDark,
      accent: C.accent,
      label: degree.issuer,
      sub: degree.title,
    },
    ...certificates.map((c, i): Building => ({
      id: c.id,
      kind: "monument",
      x: d.x - 6.4 + i * 3.2,
      y: ACADEMY_DECK.y,
      z: d.z + 5,
      w: 1.5,
      d: 1.5,
      h: 2.4,
      color: C.marble,
      accent: C.accent,
      label: c.title,
    })),
  ];
}

/** A floor, shelves, a reading table. No roof. */
function library(): Building[] {
  const d = district("library");

  const shelves: Building[] = [0, 1, 2].map((i) => ({
    id: `shelf-${i}`,
    kind: "shelf",
    x: d.x - 5.4 + i * 5.4,
    y: LIBRARY_DECK.y,
    z: d.z - 5.5,
    w: 4.2,
    d: 0.9,
    h: 3,
    color: C.timber,
    accent: C.accent,
    label: i === 1 ? "Read" : undefined,
  }));

  const plinths = BOOKS.map((book, i): Building => ({
    id: book.id,
    kind: "monument",
    x: d.x - 4.5 + (i % 2) * 3.4,
    y: LIBRARY_DECK.y,
    z: d.z + 1.5 + Math.floor(i / 2) * 3.4,
    w: 1.4,
    d: 1.1,
    h: 1.1,
    color: C.marble,
    accent: SHOWS.find((s) => s.id === book.show)?.color ?? C.accent,
    label: book.title,
  }));

  return [
    ...shelves,
    ...plinths,
    {
      id: "reading-table",
      kind: "table",
      x: d.x + 4,
      y: LIBRARY_DECK.y,
      z: d.z + 3,
      w: 3.4,
      d: 2,
      h: 0.95,
      color: C.timber,
      accent: C.accent,
      label: "Reading table",
    },
  ];
}

/** An open-air stage: a microphone and six totems, one per show. */
function studio(): Building[] {
  const d = district("studio");

  const totems = SHOWS.map((show, i): Building => {
    // Arranged in an arc facing the microphone.
    const angle = -Math.PI * 0.72 + (i / (SHOWS.length - 1)) * Math.PI * 1.44;
    return {
      id: show.id,
      kind: "totem",
      x: d.x + Math.sin(angle) * 6.6,
      y: STUDIO_DECK.y,
      z: d.z + Math.cos(angle) * 5.2,
      w: 1.1,
      d: 0.5,
      h: 2.8,
      color: C.slate,
      accent: show.color,
      label: show.nativeName,
      sub: `${show.episodes} episodes`,
    };
  });

  return [
    {
      id: "microphone",
      kind: "mic",
      x: d.x,
      y: STUDIO_DECK.y,
      z: d.z,
      w: 0.8,
      d: 0.8,
      h: 2.2,
      color: C.slate,
      accent: C.accent,
      label: "On air",
    },
    ...totems,
  ];
}

function yards(): Building[] {
  const d = district("yards");
  const perRow = 6;
  const spacing = 7;

  return PROJECTS.map((project, i): Building => {
    const row = i < perRow ? 0 : 1;
    const column = i % perRow;
    return {
      id: project.id,
      kind: "stall",
      x: d.x - spacing * 2.5 + column * spacing,
      y: 0,
      z: d.z + (row === 0 ? -4.5 : 5),
      w: 4.4,
      d: 3.6,
      h: 3,
      color: C.timber,
      roof: C.canvas,
      accent: C.accent,
      label: project.name,
    };
  });
}

function commons(): Building[] {
  const d = district("commons");
  return [
    {
      id: "piano",
      kind: "pavilion",
      x: d.x - 4,
      y: 0,
      z: d.z - 4,
      w: 6,
      d: 6,
      h: 4,
      color: C.timber,
      roof: C.slate,
      accent: C.accent,
      label: "Piano",
    },
    {
      id: "tennis",
      kind: "court",
      x: d.x + 5,
      y: 0,
      z: d.z - 3,
      w: 10,
      d: 6,
      h: 0.15,
      color: C.hedge,
      accent: "#e8e3d6",
      label: "Tennis",
    },
    {
      id: "gym",
      kind: "pavilion",
      x: d.x + 5,
      y: 0,
      z: d.z + 6,
      w: 5,
      d: 4,
      h: 3,
      color: C.slate,
      roof: C.slate,
      accent: C.accent,
      label: "Gym",
    },
    {
      id: "surf",
      kind: "pool",
      x: d.x - 5,
      y: 0,
      z: d.z + 6,
      w: 8,
      d: 5,
      h: 0.1,
      color: "#4f7f9e",
      accent: "#e8e3d6",
      label: "Surf",
    },
  ];
}

/* --------------------------------------------------------------- platforms */

/** Low decks under the open districts, so they read as places, not clearings. */
export const ACADEMY_DECK = { y: 0.3 };
export const LIBRARY_DECK = { y: 0.25 };
export const STUDIO_DECK = { y: 0.4 };

function deck(id: string, y: number, pad = 2): Platform {
  const d = district(id);
  return {
    id: `deck-${id}`,
    x: d.x - d.w / 2 - pad,
    z: d.z - d.d / 2 - pad,
    w: d.w + pad * 2,
    d: d.d + pad * 2,
    y,
  };
}

/**
 * Low parapets around the open edges of the terrace.
 *
 * Without them you can walk straight off the top step and drop three units to
 * the grass, which with a smoothed height looks like sinking through the floor
 * rather than stepping down. Generated from the landings themselves: a side
 * with a neighbouring landing is a way through, a side without one is an edge.
 * The first landing's approach from the plaza is left open — that is the way in.
 */
function terraceRailings(): Footprint[] {
  const half = TERRACE.landing / 2;
  const key = (x: number, z: number) => `${Math.round(x)}:${Math.round(z)}`;
  const occupied = new Set(LANDINGS.map((l) => key(l.x, l.z)));
  const thickness = 0.45;
  const out: Footprint[] = [];

  for (const landing of LANDINGS) {
    const sides = [
      { dx: TERRACE.landing, dz: 0 },
      { dx: -TERRACE.landing, dz: 0 },
      { dx: 0, dz: TERRACE.landing },
      { dx: 0, dz: -TERRACE.landing },
    ];

    for (const side of sides) {
      if (occupied.has(key(landing.x + side.dx, landing.z + side.dz))) continue;
      // The way in from the plaza.
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

export const PLATFORMS: Platform[] = [
  ...LANDINGS.map((landing) => ({
    id: `landing-${landing.id}`,
    x: landing.x - landing.size / 2,
    z: landing.z - landing.size / 2,
    w: landing.size,
    d: landing.size,
    y: landing.y,
  })),
  deck("education", ACADEMY_DECK.y),
  deck("library", LIBRARY_DECK.y),
  deck("studio", STUDIO_DECK.y),
];

export const BUILDINGS: Building[] = [
  ...terracePlaques(),
  ...academy(),
  ...library(),
  ...studio(),
  ...yards(),
  ...commons(),
];

/** Flat and low things are walked over, not into. */
const WALKABLE: BuildingKind[] = ["court", "pool", "plaque", "monument"];

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

const jobIds = new Set(EXPERIENCE.map((j) => j.id));
const bookIds = new Set(BOOKS.map((b) => b.id));
const projectIds = new Set(PROJECTS.map((p) => p.id));
const credentialIds = new Set(CREDENTIALS.map((c) => c.id));
const showIds = new Set(SHOWS.map((s) => s.id));

const HOBBY_LINES: Record<string, string> = {
  piano: "Still practising. The left hand is the honest one.",
  tennis: "Backhand down the line. It works maybe one time in four.",
  gym: "Where the deploy anxiety goes.",
  surf: "Buenos Aires is not a surf town. That has never stopped anyone.",
};

function targetFor(id: string): PanelTarget {
  if (jobIds.has(id)) return { kind: "experience", id };
  if (bookIds.has(id)) return { kind: "book", id };
  if (projectIds.has(id)) return { kind: "project", id };
  if (showIds.has(id)) return { kind: "show", id };
  if (credentialIds.has(id)) return { kind: "credentials" };
  if (id === "microphone" || id === "reading-table") return { kind: "contact" };
  return null;
}

export const ISO_POIS: IsoPoi[] = BUILDINGS.filter(
  (b) => b.label && !b.id.startsWith("shelf-"),
).map((b): IsoPoi => {
  const hobby = HOBBY_LINES[b.id];
  return {
    id: b.id,
    x: b.x,
    y: b.y,
    // Stand in front of it rather than inside its footprint.
    z: b.z + b.d / 2 + 1.5,
    radius: Math.max(2.6, b.w * 0.5 + 1.6),
    label: b.label!,
    target: hobby ? null : targetFor(b.id),
    secret: hobby ? { id: b.id, line: hobby } : undefined,
  };
});

/** Where the player starts: the plaza, facing the terrace. */
export const ISO_SPAWN = { x: 0, z: 6 };

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
