/**
 * The relation vocabulary, defined once. Validation, map styles, the legend and panel
 * groups all derive from this table. Kept free of Zod so the map bundle stays small;
 * `schema.ts` builds the frontmatter schema from it.
 */

export type LineStyle = "solid" | "dashed" | "dash-dot" | "dotted";

export type RelationDefinition = {
  label: string;
  /** Group label for incoming edges of a directed relation: "Required by". */
  inverseLabel?: string;
  /** "Attention requires Dot product" */
  verb: string;
  directed: boolean;
  /** Cycles in this relation fail the build. */
  acyclic: boolean;
  line: LineStyle;
  /** Line width in px at rest. */
  width: number;
  /** Off in the legend and filters until someone turns it on. */
  hiddenByDefault?: boolean;
};

export const RELATIONS = {
  requires: { label: "Requires", inverseLabel: "Required by", verb: "requires", directed: true, acyclic: true, line: "solid", width: 1 },
  extends: { label: "Extends", inverseLabel: "Extended by", verb: "extends", directed: true, acyclic: true, line: "solid", width: 1.5 },
  related: { label: "Related", verb: "is related to", directed: false, acyclic: false, line: "dashed", width: 0.75 },
  contrasts: { label: "Contrasts", verb: "contrasts", directed: false, acyclic: false, line: "dash-dot", width: 0.75 },
} as const satisfies Record<string, RelationDefinition>;

export type RelationKey = keyof typeof RELATIONS;

export const RELATION_KEYS = Object.keys(RELATIONS) as RelationKey[];

/** Body [[wikilinks]] become this edge kind; hidden on the map by default. */
export const MENTIONS = {
  label: "Mentions",
  inverseLabel: "Mentioned by",
  verb: "mentions",
  directed: true,
  acyclic: false,
  line: "dotted",
  width: 0.75,
  hiddenByDefault: true,
} as const satisfies RelationDefinition;

export type EdgeKind = RelationKey | "mentions";

/** Every edge kind in legend order: the four relations, then mentions. */
export const EDGE_KINDS: EdgeKind[] = [...RELATION_KEYS, "mentions"];

/** Dash patterns in px for each line style, shared by the Canvas 2D map and legend-style samples. */
export const LINE_DASHES: Record<LineStyle, number[]> = {
  solid: [],
  dashed: [4, 3],
  "dash-dot": [8, 3, 1.5, 3],
  dotted: [1.5, 2.5],
};

export function edgeDefinition(kind: EdgeKind): RelationDefinition {
  return kind === "mentions" ? MENTIONS : RELATIONS[kind];
}

/** A note whose body prose (code blocks and headings excluded) is shorter than this is a stub. */
export const STUB_WORD_LIMIT = 100;

export const LEVELS = ["foundational", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  foundational: "Foundational",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DOMAIN_COLORS = ["domain-1", "domain-2", "domain-3", "domain-4", "domain-5"] as const;
export type DomainColor = (typeof DOMAIN_COLORS)[number];
