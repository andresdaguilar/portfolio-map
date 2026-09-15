import { isWalkable } from "./geometry";
import type { Point, Shape } from "./types";

/**
 * Finding a way through the paths.
 *
 * Click-to-move was first written as "point at the target and slide along
 * whatever you bump into". On open ground that is fine; on this map — a thin
 * network of winding walkways — it stalls constantly, because sliding along a
 * wall does not always get you closer and there is nothing to tell the
 * character to go around.
 *
 * So: a grid over the walkable outlines and an A* across it. The grid is built
 * once and reused, since the map never changes shape.
 */

export interface Grid {
  cols: number;
  rows: number;
  /** Row-major, `cols * rows`. */
  open: Uint8Array;
  aspect: number;
}

/**
 * Samples the outlines into a grid.
 *
 * Resolution is a trade: too coarse and the thinner walkways vanish, breaking
 * the network into islands; too fine and building it takes long enough to
 * notice. 260 puts three or four cells across the narrowest path on this map.
 */
export function buildGrid(
  shapes: readonly Shape[],
  aspect: number,
  cols = 260,
): Grid {
  const rows = Math.max(1, Math.round(cols / aspect));
  const open = new Uint8Array(cols * rows);

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const point = { x: (i + 0.5) / cols, y: (j + 0.5) / rows };
      open[j * cols + i] = isWalkable(point, shapes) ? 1 : 0;
    }
  }

  return { cols, rows, open, aspect };
}

const cellCentre = (grid: Grid, index: number): Point => ({
  x: ((index % grid.cols) + 0.5) / grid.cols,
  y: (Math.floor(index / grid.cols) + 0.5) / grid.rows,
});

/** The open cell nearest a point, so a click just off the path still works. */
export function nearestOpenCell(grid: Grid, point: Point): number | null {
  const i = Math.min(grid.cols - 1, Math.max(0, Math.floor(point.x * grid.cols)));
  const j = Math.min(grid.rows - 1, Math.max(0, Math.floor(point.y * grid.rows)));
  if (grid.open[j * grid.cols + i]) return j * grid.cols + i;

  // Spiral outwards. The map is mostly water, so a click will often land off
  // the path entirely and should still mean "walk towards there".
  for (let r = 1; r < Math.max(grid.cols, grid.rows); r += 1) {
    for (let dj = -r; dj <= r; dj += 1) {
      for (let di = -r; di <= r; di += 1) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= grid.cols || nj >= grid.rows) continue;
        const index = nj * grid.cols + ni;
        if (grid.open[index]) return index;
      }
    }
  }
  return null;
}

/** Screen distance between two cells, in units of image width. */
function cost(grid: Grid, a: number, b: number): number {
  const ax = (a % grid.cols) / grid.cols;
  const ay = Math.floor(a / grid.cols) / grid.rows / grid.aspect;
  const bx = (b % grid.cols) / grid.cols;
  const by = Math.floor(b / grid.cols) / grid.rows / grid.aspect;
  return Math.hypot(ax - bx, ay - by);
}

/**
 * A* between two points on the walkable ground.
 *
 * Returns waypoints in image space, or null when there is no way through.
 */
export function findPath(
  grid: Grid,
  from: Point,
  to: Point,
): Point[] | null {
  const start = nearestOpenCell(grid, from);
  const goal = nearestOpenCell(grid, to);
  if (start === null || goal === null) return null;
  if (start === goal) return [cellCentre(grid, goal)];

  const size = grid.cols * grid.rows;
  const cameFrom = new Int32Array(size).fill(-1);
  const gScore = new Float32Array(size).fill(Infinity);
  const closed = new Uint8Array(size);

  gScore[start] = 0;
  // A binary heap would be faster; at this grid size a sorted-insert frontier
  // is well under a frame and much easier to be sure of.
  const frontier: Array<{ index: number; f: number }> = [
    { index: start, f: cost(grid, start, goal) },
  ];

  while (frontier.length) {
    const current = frontier.shift()!;
    if (closed[current.index]) continue;
    closed[current.index] = 1;

    if (current.index === goal) {
      const path: Point[] = [];
      for (let at = goal; at !== -1; at = cameFrom[at]) path.push(cellCentre(grid, at));
      return path.reverse();
    }

    const ci = current.index % grid.cols;
    const cj = Math.floor(current.index / grid.cols);

    for (let dj = -1; dj <= 1; dj += 1) {
      for (let di = -1; di <= 1; di += 1) {
        if (!di && !dj) continue;
        const ni = ci + di;
        const nj = cj + dj;
        if (ni < 0 || nj < 0 || ni >= grid.cols || nj >= grid.rows) continue;

        const neighbour = nj * grid.cols + ni;
        if (!grid.open[neighbour] || closed[neighbour]) continue;

        // No cutting a corner diagonally through a wall.
        if (di && dj) {
          if (!grid.open[cj * grid.cols + ni] || !grid.open[nj * grid.cols + ci]) continue;
        }

        const tentative = gScore[current.index] + cost(grid, current.index, neighbour);
        if (tentative >= gScore[neighbour]) continue;

        cameFrom[neighbour] = current.index;
        gScore[neighbour] = tentative;
        const f = tentative + cost(grid, neighbour, goal);

        let low = 0;
        let high = frontier.length;
        while (low < high) {
          const mid = (low + high) >> 1;
          if (frontier[mid].f < f) low = mid + 1;
          else high = mid;
        }
        frontier.splice(low, 0, { index: neighbour, f });
      }
    }
  }

  return null;
}

/**
 * Drops waypoints the character can see past.
 *
 * A grid path is a staircase of single cells; walked literally it looks like
 * the character is following graph paper. Keeping only the corners that
 * actually turn gives a straight line wherever the ground allows one.
 */
export function smoothPath(
  path: readonly Point[],
  shapes: readonly Shape[],
  aspect: number,
): Point[] {
  if (path.length <= 2) return [...path];

  const clear = (a: Point, b: Point) => {
    const steps = Math.ceil(
      Math.hypot(b.x - a.x, (b.y - a.y) / aspect) * 400,
    );
    for (let s = 1; s < steps; s += 1) {
      const t = s / steps;
      if (!isWalkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, shapes)) {
        return false;
      }
    }
    return true;
  };

  const out: Point[] = [path[0]];
  let anchor = 0;

  while (anchor < path.length - 1) {
    let furthest = anchor + 1;
    for (let candidate = path.length - 1; candidate > anchor; candidate -= 1) {
      if (clear(path[anchor], path[candidate])) {
        furthest = candidate;
        break;
      }
    }
    out.push(path[furthest]);
    anchor = furthest;
  }

  return out;
}
