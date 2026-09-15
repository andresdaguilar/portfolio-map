import { BOOKS, CREDENTIALS, EXPERIENCE, PROJECTS, SHOWS } from "@/content";
import type { PanelTarget } from "@/game/core/store";

/**
 * Turns a hotspot's id into something the content panels understand.
 *
 * Hotspots are named while looking at the picture — "ATSio", "Library",
 * "Hewlett Packard" — not while looking at the data, so the match is made
 * loosely rather than demanding the author type an exact id.
 */
const normalise = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const SECTIONS: Record<string, PanelTarget> = {
  education: { kind: "credentials" },
  certifications: { kind: "credentials" },
  uai: { kind: "credentials" },
  bachelorsdegree: { kind: "credentials" },
  bachelordegree: { kind: "credentials" },
  library: { kind: "books" },
  books: { kind: "books" },
  publishedbooks: { kind: "books" },
  written: { kind: "books" },
  podcast: { kind: "shows" },
  podcasts: { kind: "shows" },
  studio: { kind: "shows" },
  hobbies: { kind: "interests" },
  contact: { kind: "contact" },
  plaza: { kind: "contact" },
  work: { kind: "contact" },
};

/**
 * Shorthand used on the map that does not match anything in the content.
 *
 * Hotspots are named while looking at the picture, where space is tight and a
 * company is "TG" — and where a typo in a label is invisible. Rather than
 * making the map wrong, the few that drift are mapped here.
 */
const ALIASES: Record<string, string> = {
  tg: "techgenies",
  hp: "hp",
  nutriciondek: "nutriciondesk",
  ubisat: "ubisat",
  imachinary: "imachinary",
};

export function targetForHotspot(id: string): PanelTarget {
  const raw = normalise(id);
  const key = ALIASES[raw] ?? raw;

  const job = EXPERIENCE.find(
    (e) => normalise(e.id) === key || normalise(e.company) === key,
  );
  if (job) return { kind: "experience", id: job.id };

  const project = PROJECTS.find(
    (p) => normalise(p.id) === key || normalise(p.name) === key,
  );
  if (project) return { kind: "project", id: project.id };

  const book = BOOKS.find(
    (b) => normalise(b.id) === key || normalise(b.title) === key,
  );
  if (book) return { kind: "book", id: book.id };

  const show = SHOWS.find(
    (s) =>
      normalise(s.id) === key ||
      normalise(s.name) === key ||
      normalise(s.nativeName) === key,
  );
  if (show) return { kind: "show", id: show.id };

  const credential = CREDENTIALS.find(
    (c) => normalise(c.id) === key || normalise(c.title) === key,
  );
  if (credential) return { kind: "credentials" };

  return SECTIONS[key] ?? null;
}
