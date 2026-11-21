import { Drawer as DrawerFigure } from "@lucasmarkes/hairline/react";

import { Button } from "@/components/ui/button";
import type { RelationGroup } from "@/lib/graph/note-view";

const FIRST_DRAFT = [
  "A one-sentence summary a newcomer can follow",
  "What it requires, linked to notes that exist",
  "How it works, in a few short paragraphs",
  "One example, formula or code snippet",
];

/** "Attention links", "Attention and RAG link", "Attention, RAG and 2 others link". */
function linkedBy(groups: RelationGroup[]) {
  const titles = [...new Set(groups.flatMap((group) => group.notes.filter((note) => !note.ghost).map((note) => note.title)))];
  if (titles.length === 0) return "other notes link";
  if (titles.length === 1) return `${titles[0]} links`;
  if (titles.length === 2) return `${titles[0]} and ${titles[1]} link`;
  const others = titles.length - 2;
  return `${titles[0]}, ${titles[1]} and ${others} ${others === 1 ? "other" : "others"} link`;
}

type Props = { path: string; groups: RelationGroup[]; writeUrl?: string };

/**
 * The ghost note's invitation, with the one signal-filled button in the product.
 * `writeUrl` arrives with the static page; until then a same-sized block holds its place.
 */
export function GhostCallout({ path, groups, writeUrl }: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-control border border-dashed border-border-strong p-4 sm:p-6">
      <DrawerFigure className="hairline hairline-on-surface -mt-2 -mb-1 h-40 w-50 self-center" />
      <h2 className="text-note-heading text-foreground">Nobody has written this note yet</h2>
      <p className="text-ui font-normal text-muted-foreground">
        It already has a place on the map — {linkedBy(groups)} to it — so readers will land here. Know how it works? A
        few clear paragraphs is a great first draft.
      </p>
      {writeUrl ? (
        <Button asChild variant="signal" className="w-full">
          <a href={writeUrl} target="_blank" rel="noreferrer">
            Write this note on GitHub →
          </a>
        </Button>
      ) : (
        <div aria-hidden className="h-control w-full rounded-control bg-surface-raised" />
      )}
      <p className="text-ui-small font-normal text-faint">
        GitHub opens with <code className="rounded-chip bg-surface-raised px-1 font-mono text-code">{path}</code> filled in
        from what the map already knows.
      </p>
    </section>
  );
}

export function FirstDraftChecklist() {
  return (
    <section aria-label="A good first draft has" className="flex flex-col gap-2">
      <h2 className="text-overline text-faint uppercase">A good first draft has</h2>
      <ul className="flex flex-col gap-2">
        {FIRST_DRAFT.map((item) => (
          <li key={item} className="flex items-center gap-3 text-ui font-normal text-muted-foreground">
            <span aria-hidden className="size-3 shrink-0 rounded-full border border-border-strong" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
