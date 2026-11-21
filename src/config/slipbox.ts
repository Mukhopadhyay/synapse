/**
 * The landing page's Fig. 1, a Hairline slipbox: nine notes from one field, filed a–z. Each card's
 * requirements come from the notes' own `requires`, kept to these nine; `pnpm check` fails if a slug
 * stops matching a written note.
 */
export const SLIPBOX = {
  slugs: ["agents", "attention", "embeddings", "fine-tuning", "pretraining", "rag", "softmax", "tokenization", "transformer"],
  /** The card that stands proud at rest: start here. */
  start: "attention",
} as const;

export type SlipboxConfig = { slugs: readonly string[]; start: string };
