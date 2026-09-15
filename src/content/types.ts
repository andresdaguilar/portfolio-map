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
  /**
   * The project's own brand mark, under `/public/logos/`.
   *
   * Always shown on a white plate. These are marks drawn for their own sites,
   * and several of them are dark artwork that disappears entirely against this
   * palette — the plate is what lets a logo stay its own colours here.
   */
  logo?: string;
  /**
   * Still being built. Said out loud rather than linked to a page that is not
   * there yet; a dead link costs more credibility than an honest "in progress".
   */
  wip?: boolean;
  /**
   * Built, but kept off the résumé.
   *
   * A list of thirteen projects reads as thirteen half-finished things; a list
   * of six reads as six finished ones. These stay in the content layer because
   * they are real and the world still shows them — they just do not earn a line
   * on the page a recruiter skims.
   */
  archived?: boolean;
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
  /**
   * No episode count. It is wrong the week after it is written, and a number
   * that quietly rots is worse than no number.
   */
  spotify: string;
  /** Hex colour of this show's backlit wall panel in the studio. */
  color: string;
}

export type AmazonMarketplace = "us" | "uk" | "es" | "de" | "mx" | "br";

/** A book on the library shelf. */
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  /**
   * A few sentences, in the book's own voice — the hook, not the blurb.
   * A full back cover is more than anyone reads standing in a panel.
   */
  excerpt: string;
  /** Spine colour — how one book is told from another at map distance. */
  color: string;
  asin: string;
  format: "kindle" | "paperback";
  /** Omitted for English. The essay is Spanish and says so. */
  language?: "es";
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

/**
 * Something done away from the keyboard.
 *
 * `note` is the concrete part — a count, a frequency, an admission — kept
 * separate from the line so the panel can set it apart. Facts belong in the
 * note; the line is allowed to have a point of view.
 */
export interface Interest {
  id: string;
  name: string;
  /** The hard detail, if there is one: "53 countries", "self-taught". */
  note?: string;
  /** One sentence. This is the whole of it. */
  line: string;
  /** The object the player walks up to in the side-scrolling world. */
  prop: string;
  /** Which room it hides in there. */
  zone: ZoneId;
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
