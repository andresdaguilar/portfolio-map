"use client";

import { useEffect } from "react";
import { useGame } from "../core/store";

/** One line, shown when a hidden thing is found, then gone. */
export function Toast() {
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-10 flex justify-center px-6">
      <p className="max-w-md rounded border border-accent/30 bg-void/85 px-4 py-2 text-center text-sm text-text backdrop-blur-sm">
        {toast}
      </p>
    </div>
  );
}
