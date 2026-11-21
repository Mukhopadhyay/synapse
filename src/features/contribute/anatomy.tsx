import { EdgeSample } from "@/features/legend/edge-sample";
import { FIELD_DOCS, LINK_CARD_DOC, PATH_DOC, RELATION_DOC, WIKILINK_DOC } from "@/lib/content/field-docs";
import { EDGE_KINDS, edgeDefinition, RELATION_KEYS } from "@/lib/content/relations";

import { CopyButton } from "./copy-button";
import { ContributeSection } from "./section";

function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-code text-foreground">{name}</dt>
      <dd className="text-ui font-normal text-muted-foreground">{children}</dd>
    </div>
  );
}

/**
 * The note format, generated from the real schema (every key documented in field-docs.ts) and a
 * real note from content/, so it can't drift from what the build accepts.
 */
export function Anatomy({ examplePath, example }: { examplePath: string; example: string }) {
  const keys = Object.keys(FIELD_DOCS) as (keyof typeof FIELD_DOCS)[];
  return (
    <ContributeSection title="Anatomy of a note" intro="One file per note. The frontmatter draws the map; the body is what people read.">
      <div className="mt-6 grid gap-9 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <dl className="flex flex-col gap-6">
            <Field name="content/<field>/<cluster>/<slug>.md">{PATH_DOC}</Field>
            {keys.map((key) => (
              <Field key={key} name={key}>
                {FIELD_DOCS[key]}
              </Field>
            ))}
            <Field name={RELATION_KEYS.join(" · ")}>{RELATION_DOC}</Field>
            <Field name="[[wikilinks]]">{WIKILINK_DOC}</Field>
            <Field name="https://… · !https://…">{LINK_CARD_DOC}</Field>
          </dl>
          <ul aria-label="How relations are drawn" className="flex flex-wrap gap-x-4 gap-y-2">
            {EDGE_KINDS.map((kind) => (
              <li key={kind} className="flex items-center gap-2 text-ui-small font-normal text-muted-foreground">
                <EdgeSample kind={kind} />
                {edgeDefinition(kind).label}
              </li>
            ))}
          </ul>
        </div>
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="flex items-center justify-between font-mono text-ui-small font-normal text-faint">
            {examplePath}
            <CopyButton text={example} label="Copy this note" />
          </figcaption>
          <pre className="scroll-quiet overflow-x-auto rounded-control border border-border bg-surface-raised p-4 font-mono text-code whitespace-pre-wrap text-foreground">
            {example}
          </pre>
        </figure>
      </div>
    </ContributeSection>
  );
}
