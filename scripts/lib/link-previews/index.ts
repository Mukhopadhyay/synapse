import path from "node:path";

import { readCache, writeCache, type PreviewCache, type PreviewEntry } from "./cache.ts";
import { failureReason, fetchHtml, fetchImage } from "./fetch.ts";
import { fileExists, imageFiles, removeImages, writeFavicon, writeImage } from "./images.ts";
import { displayDomain, normalizeUrl, pathTitle, urlHash } from "./normalize.ts";
import { parseMetadata } from "./parse.ts";

/** Everything a card needs, with local image paths only for files that exist. */
export type CardData = {
  href: string;
  title: string;
  description: string;
  domain: string;
  favicon: string | null;
  thumb: string | null;
  image: { src400: string; src800: string } | null;
};

export type PreviewOptions = {
  /** content/.link-previews.json */
  cacheFile: string;
  /** Where generated images go (gitignored, served statically). */
  imageDir: string;
  /** The URL path `imageDir` is served from. */
  publicPath: string;
  /** Refetch these keys (or every one) even if cached. */
  refresh?: "all" | Set<string>;
  /** Drop cache entries for links no longer used (only with refresh "all"). */
  prune?: boolean;
  warn: (message: string) => void;
};

/** A card from the URL alone: its domain, and its path as the title. */
export function plainCard(href: string): CardData {
  return { href, title: pathTitle(href), description: "", domain: displayDomain(href), favicon: null, thumb: null, image: null };
}

/** Tries icon candidates in order and keeps the first one sharp can read. */
async function firstFavicon(candidates: string[], dir: string, hash: string) {
  for (const candidate of candidates) {
    try {
      await writeFavicon(await fetchImage(candidate), dir, hash);
      return candidate;
    } catch {}
  }
  return null;
}

/**
 * Turns card links into card data at build time. Metadata comes from the committed cache; only
 * links missing from it (or being refreshed) are fetched. Images are downloaded and resized when
 * their files are missing. Nothing here ever fails the build: a failed fetch is a warning and a
 * plain card, and without a network the cache alone is used.
 */
export async function resolvePreviews(urls: string[], options: PreviewOptions): Promise<Map<string, CardData>> {
  const { cacheFile, imageDir, publicPath, refresh, warn } = options;
  const cache: PreviewCache = await readCache(cacheFile, warn);
  const keys = [...new Set(urls.map(normalizeUrl).filter((key) => key !== null))];
  let changed = false;
  const publicFile = (file: string) => `${publicPath}/${file}`;

  async function resolve(key: string): Promise<CardData> {
    const hash = urlHash(key);
    const files = imageFiles(hash);
    const onDisk = (file: string) => fileExists(path.join(imageDir, file));
    let entry: PreviewEntry | undefined = cache[key];
    let favicons: string[] | null = null;

    if (!entry || refresh === "all" || refresh?.has(key)) {
      try {
        const { html, finalUrl } = await fetchHtml(key);
        const metadata = parseMetadata(html, finalUrl);
        entry = {
          title: metadata.title || pathTitle(key),
          description: metadata.description,
          siteName: metadata.siteName || displayDomain(finalUrl),
          domain: displayDomain(key),
          image: metadata.image,
          favicon: null,
          fetchedAt: new Date().toISOString(),
        };
        favicons = metadata.favicons;
        cache[key] = entry;
        changed = true;
        await removeImages(imageDir, hash);
      } catch (error) {
        const fallback = entry ? "keeping the cached preview" : "showing a plain card";
        warn(`${key}: couldn't fetch a preview (${failureReason(error)}); ${fallback}.`);
        if (!entry) return plainCard(key);
      }
    }

    if (entry.image && !(await onDisk(files.large400))) {
      try {
        const size = await writeImage(await fetchImage(entry.image.src), imageDir, hash);
        if (size.width !== entry.image.width || size.height !== entry.image.height) {
          entry.image = { ...entry.image, ...size };
          changed = true;
        }
      } catch (error) {
        warn(`${key}: couldn't get its image (${failureReason(error)}); the card shows without one.`);
      }
    }

    if (favicons) {
      entry.favicon = await firstFavicon(favicons, imageDir, hash);
    } else if (entry.favicon && !(await onDisk(files.favicon))) {
      if (!(await firstFavicon([entry.favicon], imageDir, hash))) warn(`${key}: couldn't get its icon; the card shows the domain's first letter.`);
    }

    const [large400, large800, thumb, favicon] = await Promise.all([files.large400, files.large800, files.thumb, files.favicon].map(onDisk));
    return {
      href: key,
      title: entry.title || pathTitle(key),
      description: entry.description,
      domain: entry.domain,
      favicon: favicon ? publicFile(files.favicon) : null,
      thumb: thumb ? publicFile(files.thumb) : null,
      image: large400 && large800 ? { src400: publicFile(files.large400), src800: publicFile(files.large800) } : null,
    };
  }

  const cards = new Map(await Promise.all(keys.map(async (key) => [key, await resolve(key)] as const)));

  if (options.prune && refresh === "all") {
    for (const key of Object.keys(cache)) {
      if (!cards.has(key)) {
        delete cache[key];
        changed = true;
      }
    }
  }
  if (changed) await writeCache(cacheFile, cache);
  return cards;
}
