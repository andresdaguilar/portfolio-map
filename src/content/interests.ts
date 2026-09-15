import type { Interest } from "./types";

/**
 * The hours that are not work.
 *
 * Written the way they would be said out loud, not the way a CV lists
 * "interests": one concrete fact each, and one line that is allowed to have an
 * opinion. The generic version of this section — hiking, reading, music — tells
 * a reader nothing, which is exactly as much as it deserves.
 */
export const INTERESTS: Interest[] = [
  {
    id: "travel",
    name: "Travel",
    note: "53 countries",
    line: "Fifty-three and counting. The list I actually care about is the much shorter one I would go back to.",
    prop: "pinned-map",
    zone: "library",
  },
  {
    id: "running",
    name: "Running",
    note: "races in several countries",
    line: "Recreational, and I mean it — but I have raced in a handful of countries, and a city at six in the morning tells you things the guidebook will not.",
    prop: "running-shoes",
    zone: "career",
  },
  {
    id: "surf",
    name: "Surf",
    note: "any city with a coast",
    line: "Land somewhere with a coastline and I will find a way into the water. The attempt rate is considerably higher than the success rate.",
    prop: "surfboard",
    zone: "rooftop",
  },
  {
    id: "gym",
    name: "Gym",
    note: "the standing appointment",
    line: "Body and mind — and on the hard days, in that order.",
    prop: "pull-up-bar",
    zone: "workshop",
  },
  {
    id: "tennis",
    name: "Tennis",
    note: "strictly for fun",
    line: "No league, no ranking, no ambitions. The backhand has been a work in progress for about a decade and shows no sign of finishing.",
    prop: "tennis-racket",
    zone: "career",
  },
  {
    id: "piano",
    name: "Piano",
    note: "self-taught",
    line: "Learning slowly, on purpose. Nobody is waiting for the recital, which turns out to be the best part of it.",
    prop: "piano",
    zone: "rooftop",
  },
];
