import { EXPERIENCE, INTERESTS } from "@/content";
import { STATIONS } from "../world/zones/building";
import type { PanelTarget } from "./store";

/**
 * Things the player can walk up to.
 *
 * Positions are derived from the same station layout that builds the level, so
 * a point of interest can never drift away from the room it belongs to.
 */
export interface Poi {
  id: string;
  x: number;
  y: number;
  /** How close the player must be, in units. */
  radius: number;
  /** Shown in the prompt before the panel opens. */
  label: string;
  target: PanelTarget;
  /** Secrets show a single line instead of opening a panel. */
  secret?: { id: string; line: string };
}

const byId = new Map(EXPERIENCE.map((job) => [job.id, job]));

export const POIS: Poi[] = [
  ...STATIONS.map((station): Poi => {
    const job = byId.get(station.id)!;
    const current = job.roles[job.roles.length - 1];
    return {
      id: station.id,
      // At the room's sign, so the prompt appears as you walk in.
      x: station.x + 4,
      y: station.floorY,
      radius: 3.4,
      label: `${job.company} · ${current.title}`,
      target: { kind: "experience", id: station.id },
    };
  }),

  // Interests hidden in the corridor get a line, not a panel.
  ...INTERESTS.filter((i) => i.zone === "career").map((interest, index): Poi => {
    const station = STATIONS[Math.min(index * 3 + 2, STATIONS.length - 1)];
    return {
      id: `secret-${interest.id}`,
      x: station.x + station.width - 3,
      y: station.floorY,
      radius: 2,
      label: interest.prop.replace(/-/g, " "),
      target: null,
      secret: { id: interest.id, line: interest.line },
    };
  }),
];

/**
 * The closest point of interest in range, or null.
 *
 * Distance is weighted so height matters more than horizontal distance —
 * rooms are stacked, and a sign one floor up should never win over the one
 * you are standing in front of.
 */
export function nearestPoi(x: number, y: number): Poi | null {
  let best: Poi | null = null;
  let bestDistance = Infinity;

  for (const poi of POIS) {
    const dx = poi.x - x;
    const dy = (poi.y - y) * 2.5;
    const distance = Math.hypot(dx, dy);
    if (distance > poi.radius) continue;
    if (distance < bestDistance) {
      best = poi;
      bestDistance = distance;
    }
  }

  return best;
}
