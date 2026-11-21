/**
 * localStorage with a version per key: a value saved under another version is ignored, so changing
 * a stored shape or its defaults never loads broken values. Storage can throw (private mode,
 * blocked site data), so every access is guarded and falls back to the defaults.
 */

export function readStored(key: string, version: number): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; data?: unknown };
    return parsed?.v === version ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, version: number, data: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: version, data }));
  } catch {}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Takes each default's key from `stored` when it has the same type (one level of nested objects), else keeps the default. */
export function mergeStored<T extends Record<string, unknown>>(defaults: T, stored: unknown): T {
  if (!isRecord(stored)) return defaults;
  const result: Record<string, unknown> = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = stored[key];
    if (value === undefined) continue;
    if (isRecord(fallback)) result[key] = mergeStored(fallback, value);
    else if (Array.isArray(fallback)) result[key] = Array.isArray(value) ? value : fallback;
    else if (typeof value === typeof fallback) result[key] = value;
  }
  return result as T;
}
