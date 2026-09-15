import type { PodcastShow } from "./types";

/**
 * "En 20 Minutos" — six Spanish-language shows, each episode about twenty
 * minutes. Counts are the highest episode number produced per line.
 * Each show owns one backlit panel on the studio wall.
 */
export const SHOWS: PodcastShow[] = [
  {
    id: "historia",
    name: "History in 20 Minutes",
    nativeName: "Historia en 20 Minutos",
    summary: "One historical event or process per episode, start to finish.",
    episodes: 51,
    color: "#C08A4A",
  },
  {
    id: "filosofia",
    name: "Philosophy in 20 Minutes",
    nativeName: "Filosofía en 20 Minutos",
    summary: "A thinker, an idea, or an argument — made usable in twenty minutes.",
    episodes: 50,
    color: "#7A8CA8",
  },
  {
    id: "libros",
    name: "Books in 20 Minutes",
    nativeName: "Libros en 20 Minutos",
    summary: "What a book actually says, without the airport-bookshop summary.",
    episodes: 53,
    color: "#8FA37A",
  },
  {
    id: "mitologia",
    name: "Mythology in 20 Minutes",
    nativeName: "Mitología en 20 Minutos",
    summary: "Gods, monsters, and the stories cultures told to explain themselves.",
    episodes: 50,
    color: "#A87A9C",
  },
  {
    id: "comics",
    name: "Comics in 20 Minutes",
    nativeName: "Comics en 20 Minutos",
    summary: "Runs, characters, and the people who drew them.",
    episodes: 50,
    color: "#C05A4A",
  },
  {
    id: "whisky",
    name: "Whisky in 20 Minutes",
    nativeName: "Whisky en 20 Minutos",
    summary: "Regions, distilleries, and how the thing in the glass got there.",
    episodes: 50,
    color: "#D19A3C",
  },
];
