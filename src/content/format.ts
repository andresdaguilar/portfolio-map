/** Renders an ISO `YYYY-MM` as "Mar 2006". */
export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const month = new Date(Number(y), Number(m) - 1).toLocaleString("en", {
    month: "short",
  });
  return `${month} ${y}`;
}

/** Renders a role's span; an open end reads as "Present". */
export function formatRange(from: string, to: string | null): string {
  return `${formatMonth(from)} — ${to ? formatMonth(to) : "Present"}`;
}

/** "2006 — 2011", or "2025 — now" for a current role. */
export function formatYears(from: string, to: string | null): string {
  const start = from.slice(0, 4);
  return to ? `${start} — ${to.slice(0, 4)}` : `${start} — now`;
}
