/**
 * Content types for the playable portfolio.
 *
 * Everything the visitor can read lives under `src/content/`. The 3D world and
 * the accessible `/cv` page are two different renderers over this same data, so
 * they can never drift apart. Nothing in `src/game/` may hardcode copy.
 */

/** Rooms of the building, in the order the player walks through them. */
export type ZoneId =
  | "entrance"
  | "career"
  | "academy"
  | "library"
  | "studio"
  | "workshop"
  | "rooftop";

export interface Zone {
  id: ZoneId;
  /** Shown in the fast-travel elevator panel. */
  name: string;
  /** One line of flavour under the name. */
  caption: string;
}

/** A job. One station in the career corridor. */
export interface Experience {
  id: string;
  company: string;
  /** `null` when the company has no logo asset; the sign falls back to type. */
  logo: string | null;
  /** Clients are credited as text only, never as a logo. */
  client?: string;
  location?: string;
  /**
   * Some companies hold more than one role (a promotion). They render as
   * adjacent stations sharing one doorway.
   */
  roles: Role[];
  /** Short line shown on the sign, before the panel is opened. */
  tagline: string;
  /** Art direction for this station — read by the zone builder, not shown. */
  set: SetDressing;
}

export interface Role {
  title: string;
  /** ISO `YYYY-MM`. */
  from: string;
  /** ISO `YYYY-MM`, or `null` for the current role. */
  to: string | null;
  highlights: string[];
  stack: string[];
}

/** Props and lighting cues that make a station recognisable at a glance. */
export interface SetDressing {
  /** Prop kit the zone builder instantiates for this station. */
  props: string[];
  /** Hex colour of the practical light in the room. */
  practicalLight: string;
  /** Floor height in world units. The corridor climbs with the career. */
  floorHeight: number;
}

export interface Credential {
  id: string;
  title: string;
  issuer: string;
  year?: number;
  /** Degrees hang larger and centred; certificates flank them. */
  kind: "degree" | "certification";
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  url?: string;
  /** Screenshot looped on the workshop monitor, under `/public/screens/`. */
  screen?: string;
}

export interface PodcastShow {
  id: string;
  /** Display name, e.g. "History in 20 Minutes". */
  name: string;
  /** Original Spanish name of the show. */
  nativeName: string;
  summary: string;
  episodes: number;
  /** Hex colour of this show's backlit wall panel in the studio. */
  color: string;
}

export type AmazonMarketplace = "us" | "uk" | "es" | "de" | "mx" | "br";

/** A book on the library shelf. */
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  /** Spine colour — how one book is told from another at map distance. */
  color: string;
  status: "published" | "in-progress";
  /** Present once it is on sale. */
  asin?: string;
}

/** A collected volume of podcast episodes, shown at the studio. */
export interface Volume {
  id: string;
  title: string;
  /** Matches a `PodcastShow.id`. */
  show: string;
  volume: number;
  /** Cover art under `/public/books/`. */
  cover: string;
  asin?: string;
}

/** A scattered personal detail. Cheap to find, one line of payoff. */
export interface Interest {
  id: string;
  /** The object the player walks up to. */
  prop: string;
  /** Which room it hides in. */
  zone: ZoneId;
  /** The single line shown on interaction. No panel. */
  line: string;
}

export interface Profile {
  name: string;
  title: string;
  summary: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  /** Résumé PDF served from `/public/`. */
  resume: string;
}
