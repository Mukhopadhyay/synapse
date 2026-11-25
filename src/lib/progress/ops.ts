import type { Focus, Progress } from "./types.ts";

/** Pure progress changes: each returns new state and never mutates its input. */

export function setStudied(studied: Progress["studied"], slug: string, on: boolean, now: Date = new Date()): Progress["studied"] {
  if (on) return studied[slug] ? studied : { ...studied, [slug]: now.toISOString() };
  if (!(slug in studied)) return studied;
  return Object.fromEntries(Object.entries(studied).filter(([key]) => key !== slug));
}

export const toggleStudied = (studied: Progress["studied"], slug: string, now: Date = new Date()) => setStudied(studied, slug, !studied[slug], now);

/** Slugs that count on this map: studied, present in the graph and not a ghost. Unknown slugs stay stored but are skipped. */
export function countedStudied(studied: Progress["studied"], studyable: ReadonlySet<string>) {
  return Object.keys(studied).filter((slug) => studyable.has(slug));
}

const KINDS = ["field", "cluster", "note"] as const;

/** A saved focus, or null when it isn't one (hand-edited storage). */
export function readFocus(value: unknown): Focus | null {
  const focus = value as Focus | null;
  return focus && KINDS.includes(focus.kind) && typeof focus.id === "string" && focus.id ? { kind: focus.kind, id: focus.id } : null;
}

/** A saved `studied` record, keeping only string dates. */
export function readStudied(value: unknown): Progress["studied"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

/** "24 Nov" for the panel's meta line; empty for an unreadable date. */
export function shortDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
