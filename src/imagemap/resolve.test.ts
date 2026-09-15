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

  it("opens something for every hotspot on the real map", () => {
    const map = layout as MapLayout;
    const dead = map.hotspots
      .filter((h) => targetForHotspot(h.id) === null)
      .map((h) => h.id);
    expect(dead).toEqual([]);
  });
});
