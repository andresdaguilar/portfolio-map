"use client";

import { useEffect, useRef } from "react";
import { EXPERIENCE, formatRange } from "@/content";
import { useGame } from "../core/store";

/**
 * The content, as real HTML.
 *
 * Text drawn into the 3D scene would be blurry, unselectable and invisible to
 * a screen reader. A panel over the canvas keeps the words crisp, copyable and
 * navigable by keyboard — the game is the way in, not a reason to make the
 * substance worse.
 */
export function Panel() {
  const panel = useGame((s) => s.panel);
  const closePanel = useGame((s) => s.closePanel);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!panel) return;
    closeButton.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== "Tab") return;

      // Keep focus inside the dialog while it is open.
      const focusable = dialog.current?.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [panel, closePanel]);

  if (!panel) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-void/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={closePanel}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={panel.kind}
        className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-edge bg-mid px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:rounded-xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {panel.kind === "experience" && <ExperiencePanel id={panel.id} />}

        <button
          ref={closeButton}
          type="button"
          onClick={closePanel}
          className="mt-8 w-full rounded border border-edge py-2 font-mono text-xs uppercase tracking-widest text-muted hover:border-accent hover:text-accent"
        >
          Close · Esc
        </button>
      </div>
    </div>
  );
}

function ExperiencePanel({ id }: { id: string }) {
  const job = EXPERIENCE.find((e) => e.id === id);
  if (!job) return null;

  return (
    <article>
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-text">
          {job.company}
        </h2>
        {job.client && (
          <p className="mt-1 text-sm text-muted">Client: {job.client}</p>
        )}
        <p className="mt-3 text-accent">{job.tagline}</p>
      </header>

      {job.roles.map((role) => (
        <section key={role.title} className="mt-7 border-t border-edge pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="font-medium text-text">{role.title}</h3>
            <p className="font-mono text-sm text-muted">
              {formatRange(role.from, role.to)}
            </p>
          </div>

          <ul className="mt-3 space-y-2">
            {role.highlights.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-text/90">
                <span aria-hidden className="text-edge">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 font-mono text-xs text-muted">
            {role.stack.join(" · ")}
          </p>
        </section>
      ))}
    </article>
  );
}
