"use client";

import { useGame } from "../core/store";

/**
 * The only thing resembling a HUD.
 *
 * Inside has no interface at all, and the instinct here was to be similarly
 * discreet — but a whispered prompt over a dark, busy scene simply does not
 * get noticed, and a visitor who never presses the key never sees any of the
 * content. So: it appears only when there is something to read, and while it
 * is there it is unmissable.
 */
export function Prompt() {
  const nearby = useGame((s) => s.nearby);
  const touch = useGame((s) => s.touch);
  const paused = useGame((s) => s.paused);
  const openPanel = useGame((s) => s.openPanel);

  if (!nearby || paused) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-10 flex justify-center px-4">
      <div
        data-prompt
        className="flex items-center gap-4 rounded-lg border border-accent/45 bg-void/90 py-3 pl-5 pr-3 shadow-[0_0_2.5rem_rgba(0,0,0,0.75)] backdrop-blur-sm"
        style={{ animation: "prompt-in 220ms ease-out" }}
      >
        <p className="text-base font-medium text-text sm:text-lg">
          {nearby.label}
        </p>

        {touch ? (
          <button
            type="button"
            className="pointer-events-auto rounded-md bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wider text-void"
            onClick={() => nearby.target && openPanel(nearby.target)}
          >
            Look
          </button>
        ) : (
          <span className="flex items-center gap-2">
            <kbd
              data-prompt-key
              className="grid h-9 w-9 place-items-center rounded-md border border-accent bg-accent/15 font-mono text-base font-semibold text-accent"
              style={{ animation: "key-pulse 2s ease-in-out infinite" }}
            >
              E
            </kbd>
            <span className="pr-2 text-sm uppercase tracking-wider text-accent">
              Look
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
