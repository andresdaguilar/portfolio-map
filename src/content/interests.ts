import type { Interest } from "./types";

/**
 * Seven objects hidden around the building. No panel, no fanfare — walk up,
 * get one line, move on. The pause menu counts how many have been found, which
 * is the only reason anyone pokes at the scenery twice.
 */
export const INTERESTS: Interest[] = [
  {
    id: "piano",
    prop: "piano",
    zone: "rooftop",
    line: "Still practising. The left hand is the honest one.",
  },
  {
    id: "surf",
    prop: "surfboard",
    zone: "rooftop",
    line: "Buenos Aires is not a surf town. That has never stopped anyone.",
  },
  {
    id: "tennis",
    prop: "tennis-racket",
    zone: "career",
    line: "Backhand down the line. It works maybe one time in four.",
  },
  {
    id: "gym",
    prop: "pull-up-bar",
    zone: "workshop",
    line: "Where the deploy anxiety goes.",
  },
  {
    id: "travel",
    prop: "pinned-map",
    zone: "library",
    line: "Every pin is a place where the coffee order had to be mimed.",
  },
  {
    id: "comics",
    prop: "comics-rack",
    zone: "library",
    line: "Fifty episodes in and the pull list is still growing.",
  },
  {
    id: "whisky",
    prop: "whisky-shelf",
    zone: "studio",
    line: "Islay, usually. The podcast was an excuse and it worked.",
  },
];
