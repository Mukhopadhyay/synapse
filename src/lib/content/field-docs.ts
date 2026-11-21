import type { Frontmatter } from "./schema";
import { RELATION_KEYS, RELATIONS, type RelationKey } from "./relations";

/**
 * Plain-language docs for every frontmatter key, shown on the Contribute page. Typed against the
 * schema, so adding a key without describing it fails the typecheck and the page can't go stale.
 */
type NonRelationKey = Exclude<keyof Frontmatter, RelationKey>;

export const FIELD_DOCS: Record<NonRelationKey, string> = {
  title: "The only required key. How the note is named on the map, in search and at the top of the page.",
  summary: "One sentence. It shows on hover, in search and under the title.",
  level: "How much the note assumes: foundational, intermediate or advanced.",
  tags: "Loose topics for search and filters (tag:rag).",
  aliases: "Other names people search for, like RAG.",
  resources: "Papers and posts worth reading next, as a title and a url.",
};

export const RELATION_DOC = `Each slug becomes a line on the map: ${RELATION_KEYS.map((key) => `“${RELATIONS[key].verb}”`).join(", ")}. A slug that doesn't exist yet appears as a ghost note — that's fine.`;

export const PATH_DOC = "Where the file lives is who it is: the file name is the slug (and the address), the first folder is the field, the second the cluster.";

export const WIKILINK_DOC = "Links in the body become mention lines, hidden on the map until someone turns them on.";

export const LINK_CARD_DOC = "A URL alone on its own line becomes a card with the page's title and description; put ! right before it for a large card with its image.";
