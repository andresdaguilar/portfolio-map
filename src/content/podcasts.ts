import type { PodcastShow } from "./types";

/**
 * "En 20 Minutos" — six Spanish-language shows, each episode about twenty
 * minutes. Each owns one backlit panel on the studio wall.
 *
 * Spotify links are stored bare. The share URLs come with an `si=` token that
 * identifies the session they were copied from; it does nothing for a listener
 * and quietly reports where the link came from, so it is stripped.
 */

/** The YouTube channel that carries every show. */
export const PODCAST_CHANNEL = "https://www.youtube.com/@En20minutos/podcasts";

/**
 * The written half: episode write-ups, and the shelf of collected volumes.
 * Bilingual — it opens at `/es`.
 */
export const PODCAST_BLOG = "https://en20minutos.com/";

/** Every show, in one place. */
export const SHOWS: PodcastShow[] = [
  {
    id: "historia",
    name: "History in 20 Minutes",
    nativeName: "Historia en 20 Minutos",
    summary: "One historical event or process per episode, start to finish.",
    spotify: "https://open.spotify.com/show/0Az9sa6Wc4YlILoRUeNF4G",
    color: "#C08A4A",
  },
  {
    id: "filosofia",
    name: "Philosophy in 20 Minutes",
    nativeName: "Filosofía en 20 Minutos",
    summary: "A thinker, an idea, or an argument — made usable in twenty minutes.",
    spotify: "https://open.spotify.com/show/0AdNqRZ1NhpjdnKtlmf79E",
    color: "#7A8CA8",
  },
  {
    id: "libros",
    name: "Books in 20 Minutes",
    nativeName: "Libros en 20 Minutos",
    summary: "What a book actually says, without the airport-bookshop summary.",
    spotify: "https://open.spotify.com/show/7chcAvj0YFjFECNewB8Txo",
    color: "#8FA37A",
  },
  {
    id: "mitologia",
    name: "Mythology in 20 Minutes",
    nativeName: "Mitología en 20 Minutos",
    summary: "Gods, monsters, and the stories cultures told to explain themselves.",
    spotify: "https://open.spotify.com/show/57FMWjHjt83yxjmnL1JwBE",
    color: "#A87A9C",
  },
  {
    id: "comics",
    name: "Comics in 20 Minutes",
    nativeName: "Comics en 20 Minutos",
    summary: "Runs, characters, and the people who drew them.",
    spotify: "https://open.spotify.com/show/033ognPomoIEFGQHgkxbc6",
    color: "#C05A4A",
  },
  {
    id: "whisky",
    name: "Whisky in 20 Minutes",
    nativeName: "Whisky en 20 Minutos",
    summary: "Regions, distilleries, and how the thing in the glass got there.",
    spotify: "https://open.spotify.com/show/033ow4hvLJ9SY4NwDhOLSr",
    color: "#D19A3C",
  },
];
