/**
 * MiniSearch settings shared by the build (which writes the index) and the browser (which loads it);
 * the two must agree or a loaded index won't match. Kept free of imports so the build can use it as is.
 */

export const SEARCH_FIELDS = ["title", "aliases", "tags", "summary", "body"] as const;
export type SearchField = (typeof SEARCH_FIELDS)[number];
export type SearchDocument = { id: string } & Record<SearchField, string>;

/** Ranking: title, then aliases, tags, summary and body. */
export const SEARCH_BOOST: Record<SearchField, number> = { title: 6, aliases: 4, tags: 3, summary: 2, body: 1 };

/** Words split on spaces and punctuation; CamelCase words also index their parts ("FlashAttention" → flash, attention). */
export function tokenize(text: string): string[] {
  const words = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.flatMap((word) => {
    const parts = word.split(/(?<=\p{Ll})(?=\p{Lu})/u);
    return parts.length > 1 ? [word, ...parts] : [word];
  });
}

export const processTerm = (term: string) => term.toLowerCase();

export const INDEX_OPTIONS = {
  fields: [...SEARCH_FIELDS],
  tokenize,
  processTerm,
};

export const SEARCH_OPTIONS = {
  boost: SEARCH_BOOST,
  prefix: true,
  fuzzy: (term: string) => (term.length > 3 ? 0.2 : false),
};
