import { Pencil } from "lucide-react";

/** Edit link. Contributors and dates join here once they come from Git. */
export function NoteFooter({ editUrl }: { editUrl: string }) {
  return (
    <footer className="border-t pt-4">
      <a
        href={editUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-control text-ui text-muted-foreground transition-colors duration-instant ease-standard hover:text-foreground"
      >
        <Pencil aria-hidden className="size-icon" />
        Edit on GitHub
      </a>
    </footer>
  );
}
