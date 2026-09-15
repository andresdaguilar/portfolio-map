import { describe, expect, it } from "vitest";
import { targetForHotspot } from "./resolve";
import layout from "./layout.json";
import type { MapLayout } from "./types";

describe("targetForHotspot", () => {
  it("matches a company however it is written on the map", () => {
    expect(targetForHotspot("HP")).toEqual({ kind: "experience", id: "hp" });
    expect(targetForHotspot("Hewlett-Packard")).toEqual({ kind: "experience", id: "hp" });
    expect(targetForHotspot("TG")).toEqual({ kind: "experience", id: "techgenies" });
    expect(targetForHotspot("iMachinary")).toEqual({ kind: "experience", id: "imachinary" });
  });

  it("forgives a typo that was already drawn on the map", () => {
    expect(targetForHotspot("NutricionDek")).toEqual({
      kind: "project",
      id: "nutriciondesk",
    });
  });

  it("maps a section marker to its section", () => {
    expect(targetForHotspot("Books")).toEqual({ kind: "books" });
    expect(targetForHotspot("Podcast")).toEqual({ kind: "shows" });
    expect(targetForHotspot("Hobbies")).toEqual({ kind: "interests" });
    expect(targetForHotspot("UAI")).toEqual({ kind: "credentials" });
    expect(targetForHotspot("Certifications")).toEqual({ kind: "credentials" });
  });

  it("takes whatever the map happens to call a section", () => {
    // Labels are written while looking at the picture, so the same place gets
    // a different name on each render: "Books" became "Published Books" and
    // "Podcast" became "Podcasts" between the first map and the second.
    expect(targetForHotspot("Published Books")).toEqual({ kind: "books" });
    expect(targetForHotspot("Podcasts")).toEqual({ kind: "shows" });
    expect(targetForHotspot("Bachelors Degree")).toEqual({ kind: "credentials" });
  });

  const map = layout as MapLayout;

  it.skipIf(map.hotspots.length === 0)("opens something for every hotspot on the real map", () => {
    const dead = map.hotspots
      .filter((h) => targetForHotspot(h.id) === null)
      .map((h) => h.id);
    expect(dead).toEqual([]);
  });
});
