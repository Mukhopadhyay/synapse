import { readFile, writeFile } from "node:fs/promises";

/** One link's preview, as committed in content/.link-previews.json (keyed by normalised URL). */
export type PreviewEntry = {
  title: string;
  description: string;
  siteName: string;
  domain: string;
  /** The page's og/twitter image: its remote URL and real size once downloaded. */
  image: { src: string; width: number | null; height: number | null } | null;
  /** The remote icon that decoded, if any. */
  favicon: string | null;
  fetchedAt: string;
};

export type PreviewCache = Record<string, PreviewEntry>;

const isString = (value: unknown): value is string => typeof value === "string";

function isEntry(value: unknown): value is PreviewEntry {
  const entry = value as PreviewEntry;
  return (
    typeof entry === "object" &&
    entry !== null &&
    [entry.title, entry.description, entry.siteName, entry.domain, entry.fetchedAt].every(isString) &&
    (entry.favicon === null || isString(entry.favicon)) &&
    (entry.image === null || (typeof entry.image === "object" && isString(entry.image?.src)))
  );
}

/** Reads the cache; a missing file is empty, and malformed entries are dropped (and refetched) with a warning. */
export async function readCache(file: string, warn: (message: string) => void): Promise<PreviewCache> {
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    warn(`${file} isn't valid JSON, so every preview will be fetched again.`);
    return {};
  }
  const cache: PreviewCache = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (isEntry(value)) cache[key] = value;
    else warn(`${file}: the entry for ${key} is malformed and will be fetched again.`);
  }
  return cache;
}

/** Writes the cache with sorted keys and two-space indents, so PR diffs stay small. */
export async function writeCache(file: string, cache: PreviewCache) {
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(file, `${JSON.stringify(sorted, null, 2)}\n`);
}
