"use client";

import { editUrl } from "@/config/site";
import type { NoteView as NoteViewData } from "@/lib/graph/note-view";

import { FirstDraftChecklist, GhostCallout } from "./ghost-callout";
import { BodySkeleton, NoteBody } from "./note-body";
import { NoteFooter } from "./note-footer";
import { NoteHeader } from "./note-header";
import { RelationList } from "./relation-list";
import { StubCallout } from "./stub-callout";

type Props = {
  view: NoteViewData;
  /** Rendered body HTML, or null while it loads. */
  body: string | null;
  /** GitHub new-file link for a ghost, prefilled from the note template. */
  writeUrl?: string;
};

/** One note as the panel shows it: header, contribution callout, relations, body, edit link. */
export function NoteView({ view, body, writeUrl }: Props) {
  const { node, relations, path } = view;

  if (node.ghost) {
    return (
      <article className="flex flex-col gap-6 p-4 sm:p-6">
        <NoteHeader view={view} />
        <GhostCallout path={path} groups={relations} writeUrl={writeUrl} />
        {relations.length > 0 && <RelationList title="Already linked from" groups={relations} />}
        <FirstDraftChecklist />
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-6 p-4 sm:p-6">
      <NoteHeader view={view} />
      {node.stub && <StubCallout editUrl={editUrl(path)} />}
      {relations.length > 0 && <RelationList title="Relations" groups={relations} />}
      {body === null ? <BodySkeleton /> : body && <NoteBody html={body} />}
      <NoteFooter editUrl={editUrl(path)} />
    </article>
  );
}
