import { Pencil } from "lucide-react";

/** Shown on notes under the stub word limit, linking straight to GitHub's editor. */
export function StubCallout({ editUrl }: { editUrl: string }) {
  return (
    <aside className="flex gap-3 rounded-control border border-border-strong bg-surface-raised p-4">
      <Pencil aria-hidden className="mt-0.5 size-icon shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-ui text-foreground">This note is a stub.</p>
        <a
          href={editUrl}
          target="_blank"
          rel="noreferrer"
          className="text-ui font-normal text-muted-foreground transition-colors duration-instant ease-standard hover:text-foreground"
        >
          Know this topic? Help write it →
        </a>
      </div>
    </aside>
  );
}
