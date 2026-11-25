import { toast } from "sonner";

import { useGraphStore } from "@/lib/store/graph-store";

import { useProgressStore } from "./progress-store";

/** Marks or unmarks a note and confirms with a toast whose Undo puts it back. Ghosts are ignored. */
export function markStudied(slug: string, on: boolean) {
  const node = useGraphStore.getState().data?.nodes.find((entry) => entry.id === slug);
  if (!node || node.ghost) return;
  const { setStudied } = useProgressStore.getState();
  setStudied(slug, on);
  toast(on ? `Marked ${node.title} as studied` : `Marked ${node.title} as not studied`, {
    action: { label: "Undo", onClick: () => setStudied(slug, !on) },
  });
}

export function toggleStudiedNote(slug: string) {
  markStudied(slug, !useProgressStore.getState().studiedSet.has(slug));
}
