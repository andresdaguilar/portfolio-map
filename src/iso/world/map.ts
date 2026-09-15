import { BOOKS, CREDENTIALS, EXPERIENCE, PROJECTS, SHOWS } from "@/content";
import type { Footprint } from "../core/nav";
import type { PanelTarget } from "@/game/core/store";

/**
 * The map, laid out from the content.
 *
 * Districts are hand-placed because a map is a composition — but what fills
 * them is generated, so adding a job or a project changes the town rather than
 * requiring someone to nudge coordinates.
 */

export interface District {
  id: string;
  name: string;
  caption: string;
  x: number;
  z: number;
  /** Half-extent used for the ground patch and the banner. */
  w: number;
  d: number;
  color: string;
}

export type BuildingKind =
  | "house"
  | "hall"
  | "monument"
  | "stall"
  | "pavilion"
  | "court"
  | "pool";

export interface Building {
  id: string;
  kind: BuildingKind;
  /** Centre on the ground plane. */
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roof?: string;
  accent?: string;
  label?: string;
  /** Faces the street: rotation around the vertical axis, in radians. */
  rotation?: number;
}

export interface IsoPoi {
  id: string;
  x: number;
  z: number;
  radius: number;
  label: string;
  target: PanelTarget;
  secret?: { id: string; line: string };
}

const PALETTE = {
  stone: "#cfc4ae",
  timber: "#9c7a54",
  roofWarm: "#b2593f",
  roofCool: "#5d6f7a",
  marble: "#e3ddd0",
  slate: "#7a8a94",
  canvas: "#d8c9a8",
  hedge: "#5f7d4a",
  accent: "#e8a33d",
} as const;

export const DISTRICTS: District[] = [
  {
    id: "work",
    name: "The Works",
    caption: "Twenty years, eight companies.",
    x: -26,
    z: -20,
    w: 21,
    d: 13,
    color: PALETTE.roofWarm,
  },
  {
    id: "education",
    name: "The Academy",
    caption: "A degree and five certificates.",
    x: 10,
    z: -28,
    w: 13,
    d: 10,
    color: PALETTE.marble,
  },
  {
    id: "publications",
    name: "The Library",
    caption: "Four volumes, six shows.",
    x: 32,
    z: 2,
    w: 12,
    d: 13,
    color: PALETTE.roofCool,
  },
  {
    id: "portfolio",
    name: "The Yards",
    caption: "Things built after hours.",
    x: 14,
    z: 27,
    w: 18,
    d: 11,
    color: PALETTE.timber,
  },
  {
    id: "recreation",
    name: "The Commons",
    caption: "Where the week goes.",
    x: -24,
    z: 24,
    w: 16,
    d: 13,
    color: PALETTE.hedge,
  },
];

/**
 * Career buildings along a street, in chronological order.
 *
 * Height is taken from the same `floorHeight` that made the side-scrolling
 * corridor climb, so the skyline rises with the career: the first job is a shed
 * and the most recent ones are the tallest things in the district.
 */
function careerBuildings(): Building[] {
  const district = DISTRICTS[0];
  const perRow = 4;
  const spacing = 9;
  const maxFloor = Math.max(...EXPERIENCE.map((job) => job.set.floorHeight));

  return EXPERIENCE.map((job, i) => {
    const row = i < perRow ? 0 : 1;
    const column = i % perRow;
    // Two rows facing each other across a street running east to west.
    const x = district.x - spacing * 1.5 + column * spacing;
    const z = district.z + (row === 0 ? -6.5 : 6.5);

    return {
      id: job.id,
      kind: "house" as const,
      x,
      z,
      w: 6,
      d: 5,
      // Buildings stay close to human scale: much taller and the figure stops
      // reading as a person walking a town and becomes a token on a board.
      h: 3.2 + (job.set.floorHeight / maxFloor) * 4,
      color: PALETTE.stone,
      roof: PALETTE.roofWarm,
      accent: job.set.practicalLight,
      label: job.company,
      rotation: row === 0 ? 0 : Math.PI,
    };
  });
}

/** The degree as a hall, the certificates as monuments in its courtyard. */
function academyBuildings(): Building[] {
  const district = DISTRICTS[1];
  const degree = CREDENTIALS.find((c) => c.kind === "degree")!;
  const certificates = CREDENTIALS.filter((c) => c.kind === "certification");

  const hall: Building = {
    id: degree.id,
    kind: "hall",
    x: district.x,
    z: district.z - 3,
    w: 11,
    d: 7,
    h: 6.5,
    color: PALETTE.marble,
    roof: PALETTE.roofCool,
    accent: PALETTE.accent,
    label: degree.issuer,
  };

  const monuments = certificates.map((c, i): Building => ({
    id: c.id,
    kind: "monument",
    x: district.x - 8 + i * 4,
    z: district.z + 6,
    w: 1.8,
    d: 1.8,
    h: 3.4,
    color: PALETTE.marble,
    accent: PALETTE.accent,
    label: c.title,
  }));

  return [hall, ...monuments];
}

/** The library, with the published volumes on plinths outside it. */
function libraryBuildings(): Building[] {
  const district = DISTRICTS[2];

  const library: Building = {
    id: "library",
    kind: "hall",
    x: district.x,
    z: district.z - 4,
    w: 10,
    d: 8,
    h: 6.8,
    color: PALETTE.stone,
    roof: PALETTE.roofCool,
    accent: PALETTE.accent,
    label: "Library",
  };

  const plinths = BOOKS.map((book, i): Building => ({
    id: book.id,
    kind: "monument",
    x: district.x - 6 + (i % 2) * 5,
    z: district.z + 5 + Math.floor(i / 2) * 4,
    w: 2.2,
    d: 1.6,
    h: 1.5,
    color: PALETTE.marble,
    accent: SHOWS.find((s) => s.id === book.show)?.color ?? PALETTE.accent,
    label: book.title,
  }));

  return [library, ...plinths];
}

/** Project stalls, laid out as a market row. */
function yardBuildings(): Building[] {
  const district = DISTRICTS[3];
  const perRow = 6;
  const spacing = 7;

  return PROJECTS.map((project, i): Building => {
    const row = i < perRow ? 0 : 1;
    const column = i % perRow;
    return {
      id: project.id,
      kind: "stall",
      x: district.x - spacing * 2.5 + column * spacing,
      z: district.z + (row === 0 ? -4.5 : 5),
      w: 4.4,
      d: 3.6,
      h: 3.2,
      color: PALETTE.timber,
      roof: PALETTE.canvas,
      accent: PALETTE.accent,
      label: project.name,
    };
  });
}

/** The park. Four fixed things, because these are hobbies, not a catalogue. */
function commonsBuildings(): Building[] {
  const d = DISTRICTS[4];
  return [
    {
      id: "piano",
      kind: "pavilion",
      x: d.x - 8,
      z: d.z - 3,
      w: 6,
      d: 6,
      h: 4.2,
      color: PALETTE.timber,
      roof: PALETTE.roofCool,
      accent: PALETTE.accent,
      label: "Piano",
    },
    {
      id: "tennis",
      kind: "court",
      x: d.x + 4,
      z: d.z - 3,
      w: 10,
      d: 6,
      h: 0.15,
      color: PALETTE.hedge,
      accent: "#e8e3d6",
      label: "Tennis",
    },
    {
      id: "gym",
      kind: "pavilion",
      x: d.x + 6,
      z: d.z + 6,
      w: 5,
      d: 4,
      h: 3,
      color: PALETTE.slate,
      roof: PALETTE.roofCool,
      accent: PALETTE.accent,
      label: "Gym",
    },
    {
      id: "surf",
      kind: "pool",
      x: d.x - 7,
      z: d.z + 7,
      w: 8,
      d: 5,
      h: 0.1,
      color: "#4f7f9e",
      accent: "#e8e3d6",
      label: "Surf",
    },
  ];
}

export const BUILDINGS: Building[] = [
  ...careerBuildings(),
  ...academyBuildings(),
  ...libraryBuildings(),
  ...yardBuildings(),
  ...commonsBuildings(),
];

/** Flat things are walked over, not into. */
const WALKABLE: BuildingKind[] = ["court", "pool"];

export const BLOCKERS: Footprint[] = BUILDINGS.filter(
  (b) => !WALKABLE.includes(b.kind),
).map((b) => ({
  id: b.id,
  x: b.x - b.w / 2,
  z: b.z - b.d / 2,
  w: b.w,
  d: b.d,
}));

const jobIds = new Set(EXPERIENCE.map((j) => j.id));
const bookIds = new Set(BOOKS.map((b) => b.id));
const projectIds = new Set(PROJECTS.map((p) => p.id));
const credentialIds = new Set(CREDENTIALS.map((c) => c.id));

const HOBBY_LINES: Record<string, string> = {
  piano: "Still practising. The left hand is the honest one.",
  tennis: "Backhand down the line. It works maybe one time in four.",
  gym: "Where the deploy anxiety goes.",
  surf: "Buenos Aires is not a surf town. That has never stopped anyone.",
};

function targetFor(b: Building): PanelTarget {
  if (jobIds.has(b.id)) return { kind: "experience", id: b.id };
  if (bookIds.has(b.id)) return { kind: "book", id: b.id };
  if (projectIds.has(b.id)) return { kind: "project", id: b.id };
  if (credentialIds.has(b.id)) return { kind: "credentials" };
  if (b.id === "library") return { kind: "credentials" };
  return null;
}

export const ISO_POIS: IsoPoi[] = BUILDINGS.map((b): IsoPoi => {
  const hobby = HOBBY_LINES[b.id];
  return {
    id: b.id,
    x: b.x,
    // Stand in front of the building rather than inside its footprint.
    z: b.z + b.d / 2 + 1.4,
    radius: Math.max(2.6, b.w * 0.5 + 1.4),
    label: b.label ?? b.id,
    target: hobby ? null : targetFor(b),
    secret: hobby ? { id: b.id, line: hobby } : undefined,
  };
});

/** Where the player starts: the plaza in the middle of town. */
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
