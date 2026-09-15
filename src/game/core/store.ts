import { create } from "zustand";
import type { ZoneId } from "@/content";

export type Quality = "low" | "medium" | "high";

/** What an open panel is showing. `null` means the player is walking. */
export type PanelTarget =
  | { kind: "experience"; id: string }
  | { kind: "credentials" }
  | { kind: "project"; id: string }
  | { kind: "show"; id: string }
  | { kind: "book"; id: string }
  | { kind: "volume"; id: string }
  | { kind: "books" }
  | { kind: "shows" }
  | { kind: "interests" }
  | { kind: "contact" }
  | { kind: "travel" }
  | null;

interface GameState {
  ready: boolean;
  /** Set while a panel is open or the pause menu is up — freezes the sim. */
  paused: boolean;
  panel: PanelTarget;
  zone: ZoneId;
  /** The nearest interactable, or null. Drives the on-screen prompt. */
  nearby: { id: string; label: string; target: PanelTarget } | null;
  /** Interest ids the player has walked into. Persisted to localStorage. */
  secrets: string[];
  /** One-line message shown when a secret is found. */
  toast: string | null;
  quality: Quality;
  /** True once a touch is seen — swaps the control hints and shows the stick. */
  touch: boolean;

  setReady: (v: boolean) => void;
  openPanel: (p: NonNullable<PanelTarget>) => void;
  closePanel: () => void;
  setPaused: (v: boolean) => void;
  setZone: (z: ZoneId) => void;
  setNearby: (n: GameState["nearby"]) => void;
  findSecret: (id: string, line: string) => void;
  clearToast: () => void;
  setQuality: (q: Quality) => void;
  setTouch: (v: boolean) => void;
}

const SECRETS_KEY = "portfolio.secrets";

function loadSecrets(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SECRETS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // Private windows and blocked site data both throw. Losing the count is
    // not worth breaking the game over.
    return [];
  }
}

function saveSecrets(ids: string[]): void {
  try {
    window.localStorage.setItem(SECRETS_KEY, JSON.stringify(ids));
  } catch {
    /* see loadSecrets */
  }
}

export const useGame = create<GameState>((set, get) => ({
  ready: false,
  paused: false,
  panel: null,
  zone: "entrance",
  nearby: null,
  secrets: [],
  toast: null,
  quality: "high",
  touch: false,

  setReady: (ready) => set({ ready }),
  /**
   * Opening a panel does not forget what the player is standing next to.
   *
   * It used to clear `nearby`, which read as tidy and was not: the prompts
   * already hide themselves while paused, and clearing it left the frame loop
   * — which caches what it last reported — convinced it had nothing to say.
   * Closing the panel then left you on the hotspot with no way to reopen it
   * short of walking off and back on.
   */
  openPanel: (panel) => set({ panel, paused: true }),
  closePanel: () => set({ panel: null, paused: false }),
  setPaused: (paused) => set({ paused }),
  setZone: (zone) => set({ zone }),
  setNearby: (nearby) => set({ nearby }),

  findSecret: (id, line) => {
    if (get().secrets.includes(id)) return;
    const secrets = [...get().secrets, id];
    saveSecrets(secrets);
    set({ secrets, toast: line });
  },
  clearToast: () => set({ toast: null }),
  setQuality: (quality) => set({ quality }),
  setTouch: (touch) => set({ touch }),
}));

/** Called once on mount — localStorage is not available during SSR. */
export function hydrateSecrets(): void {
  useGame.setState({ secrets: loadSecrets() });
}
