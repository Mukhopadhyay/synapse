/**
 * Content schema shared by the build script and the app.
 * Frontmatter and `_domain.yml` are validated here; graph.json types describe the build output.
 */
import { z } from "zod";

import {
  DOMAIN_COLORS,
  LEVELS,
  RELATION_KEYS,
  type DomainColor,
  type EdgeKind,
  type Level,
  type RelationKey,
} from "./relations.ts";

export * from "./relations.ts";

/** `slug` or `domain/slug`, kebab-case. */
export const SLUG_PATTERN = /^([a-z0-9]+(-[a-z0-9]+)*\/)?[a-z0-9]+(-[a-z0-9]+)*$/;

const slugList = z.array(
  z.string().regex(SLUG_PATTERN, { error: "must be a kebab-case slug like attention or ai/attention" }),
);

const relationFields = Object.fromEntries(
  RELATION_KEYS.map((key) => [key, slugList.default([])]),
) as Record<RelationKey, z.ZodDefault<typeof slugList>>;

export const frontmatterSchema = z.strictObject({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1).optional(),
  level: z.enum(LEVELS).optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  aliases: z.array(z.string().trim().min(1)).default([]),
  resources: z.array(z.strictObject({ title: z.string().min(1), url: z.url() })).default([]),
  ...relationFields,
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const FRONTMATTER_KEYS = Object.keys(frontmatterSchema.shape);

export const domainSchema = z.strictObject({
  name: z.string().trim().min(1),
  color: z.enum(DOMAIN_COLORS),
  description: z.string().trim().optional(),
  /** Folder name → display name. Order here is the legend and tint order. */
  clusters: z.record(z.string().regex(SLUG_PATTERN), z.string().trim().min(1)).default({}),
  /** Display titles for notes nobody has written yet ("kv-cache: KV cache"); otherwise the slug is used. */
  ghosts: z.record(z.string().regex(SLUG_PATTERN), z.string().trim().min(1)).default({}),
});

export type DomainFile = z.infer<typeof domainSchema>;

/* graph.json — the build output the app reads */

export type GraphCluster = { id: string; name: string };

export type GraphDomain = {
  id: string;
  name: string;
  color: DomainColor;
  description?: string;
  clusters: GraphCluster[];
};

export type GraphNode = {
  id: string;
  title: string;
  summary?: string;
  level?: Level;
  tags: string[];
  aliases: string[];
  domain: string;
  cluster?: string;
  ghost: boolean;
  stub: boolean;
  /** PageRank over `requires`, normalised to 0–1. */
  importance: number;
  /** Typed relations in either direction (mentions excluded). */
  relationCount: number;
  x: number;
  y: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: EdgeKind;
};

export type GraphData = {
  version: 1;
  /** content/_templates/note.md, for "Write this note" links built in the browser. */
  template: string;
  domains: GraphDomain[];
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/** A note body rendered at build time (.synapse/notes/<slug>.json). `math` says whether KaTeX CSS is needed. */
export type NoteBody = { html: string; math: boolean };
