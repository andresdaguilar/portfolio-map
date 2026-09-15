import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "./store";

/**
 * The bug this covers: pressing the key on a hotspot opened the panel, and
 * after closing it the key did nothing until you walked off the hotspot and
 * back onto it.
 *
 * Opening cleared `nearby`, while the frame loop kept its own note of what it
 * had last reported. On close the loop saw the same hotspot, decided it had
 * already said so, and stayed quiet — leaving the player standing on something
 * they could no longer look at.
 */

const NEARBY = {
  id: "library",
  label: "Library",
  target: { kind: "books" } as const,
};

beforeEach(() => {
  useGame.setState({ nearby: null, panel: null, paused: false });
});

describe("opening and closing a panel", () => {
  it("still knows what you are standing next to afterwards", () => {
    const { setNearby, openPanel, closePanel } = useGame.getState();

    setNearby(NEARBY);
    openPanel({ kind: "books" });
    expect(useGame.getState().paused).toBe(true);

    closePanel();
    expect(useGame.getState().paused).toBe(false);
    expect(useGame.getState().nearby).toEqual(NEARBY);
  });

  it("can be opened again without moving", () => {
    const { setNearby, openPanel, closePanel } = useGame.getState();

    setNearby(NEARBY);
    openPanel({ kind: "books" });
    closePanel();

    // Exactly what the key handler does: read `nearby`, open its target.
    const again = useGame.getState().nearby;
    expect(again?.target).toBeTruthy();
    openPanel(again!.target!);
    expect(useGame.getState().panel).toEqual({ kind: "books" });
  });

  it("forgets it only when the player actually walks away", () => {
    const { setNearby } = useGame.getState();
    setNearby(NEARBY);
    setNearby(null);
    expect(useGame.getState().nearby).toBeNull();
  });
});
