"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Hash } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useActiveDomain } from "@/features/navigation/use-active-domain";
import { proposeUrl } from "@/lib/content/propose-url";
import type { GraphData, GraphNode } from "@/lib/content/schema";
import { parseQuery } from "@/lib/search/query";
import { loadSearchEngine, type SearchEngine } from "@/lib/search/search-engine";
import { useGraphStore } from "@/lib/store/graph-store";
import { useMapStore } from "@/lib/store/map-store";

import { NoteResult } from "./note-result";
import { useRecentNotes } from "./recent-notes";
import { returnFocusAfterPalette, useSearchStore } from "./search-store";
import { useSearchHotkeys } from "./use-search-hotkeys";

const RESULT_LIMIT = 8;
const STARTING_POINTS = 4;

type Mode = "notes" | "tags";

function PaletteFooter({ mode }: { mode: Mode }) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-4 border-t border-border px-4 text-ui-small font-normal text-faint max-sm:hidden pointer-coarse:hidden">
      <span className="flex items-center gap-1.5">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        {mode === "notes" ? "Preview on map" : "Move"}
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>↵</Kbd>
        {mode === "notes" ? "Open" : "Search this tag"}
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <Kbd>Tab</Kbd>
        {mode === "notes" ? "Search tags" : "Search notes"}
      </span>
    </div>
  );
}

/** Recently opened notes, then a few well-connected starting points. */
function emptyGroups(data: GraphData, recent: string[]) {
  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const recentNodes = recent.map((id) => byId.get(id)).filter((node): node is GraphNode => !!node);
  const starts = data.nodes
    .filter((node) => !node.ghost && !recent.includes(node.id))
    .sort((a, b) => b.relationCount - a.relationCount || a.title.localeCompare(b.title))
    .slice(0, STARTING_POINTS);
  return { recentNodes, starts };
}

/**
 * The search palette (⌘K, /, or the nav pill). Results come from the MiniSearch index, loaded the
 * first time the palette opens. Moving through results previews each note on the map behind a
 * light scrim; Enter opens it exactly as a click on its node would. Tab switches to tag search.
 * Full screen on phones.
 */
export function SearchPalette() {
  const { open, setOpen, query: input, setQuery: setInput } = useSearchStore();
  const data = useGraphStore((state) => state.data);
  const domain = useActiveDomain(data) ?? data?.domains[0]?.id ?? null;
  const recent = useRecentNotes((state) => state.ids);
  const [engine, setEngine] = useState<SearchEngine | null>(null);
  const [mode, setMode] = useState<Mode>("notes");
  const [active, setActive] = useState("");
  useSearchHotkeys();

  useEffect(() => {
    if (!open || !data || engine) return;
    let cancelled = false;
    void loadSearchEngine(data).then((loaded) => !cancelled && setEngine(loaded));
    return () => {
      cancelled = true;
    };
  }, [open, data, engine]);

  const parsed = useMemo(() => parseQuery(input), [input]);
  const results = useMemo(() => (engine && mode === "notes" ? engine.search(parsed).slice(0, RESULT_LIMIT) : []), [engine, mode, parsed]);
  const tags = useMemo(() => (engine && mode === "tags" ? engine.tags(input) : []), [engine, mode, input]);

  useEffect(() => {
    const id = open && active.startsWith("note:") ? active.slice(5) : null;
    useMapStore.getState().setHovered(id, "panel");
  }, [open, active]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setMode("notes");
  }

  function openNote(id: string) {
    onOpenChange(false);
    useMapStore.getState().setHovered(null);
    useMapStore.getState().open(id);
  }

  function pickTag(tag: string) {
    setMode("notes");
    setInput(`tag:${tag} `);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    setMode(mode === "notes" ? "tags" : "notes");
    setInput("");
  }

  if (!data) return null;
  const text = parsed.text.trim();
  const { recentNodes, starts } = emptyGroups(data, recent);
  const showEmptyState = mode === "notes" && !input.trim();
  const exactMatch = results.some((node) => node.title.toLowerCase() === text.toLowerCase());
  const propose = mode === "notes" && text && !exactMatch && domain ? proposeUrl(text, domain, data.template) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusAfterPalette();
        }}
        className="top-[20%] flex w-palette max-w-[calc(100%-2rem)] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-0 max-sm:rounded-none max-sm:border-0"
      >
        <DialogTitle className="sr-only">Search notes</DialogTitle>
        <DialogDescription className="sr-only">Type to search every note. Arrow keys preview a note on the map, Enter opens it, Tab searches tags.</DialogDescription>
        <Command shouldFilter={false} value={active} onValueChange={setActive} loop className="flex min-h-0 flex-1 flex-col bg-transparent [&_[cmdk-group]+[cmdk-group]]:pt-1">
          <div className="relative">
            <CommandInput
              value={input}
              onValueChange={setInput}
              placeholder={mode === "notes" ? "Search notes" : "Search tags"}
              className="text-base"
            />
            <Kbd aria-hidden className="absolute top-1/2 right-4 -translate-y-1/2 max-sm:hidden pointer-coarse:hidden">Esc</Kbd>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="absolute top-1/2 right-2 h-8 -translate-y-1/2 px-2 text-ui-small sm:hidden">
              Close
            </Button>
          </div>
          <CommandList className="scroll-quiet max-h-[min(60vh,420px)] flex-1 pb-1 max-sm:max-h-none">
            {mode === "notes" && (
              <>
                {showEmptyState && recentNodes.length > 0 && (
                  <CommandGroup heading="Recent">
                    {recentNodes.map((node) => <NoteResult key={node.id} data={data} node={node} query="" onSelect={openNote} />)}
                  </CommandGroup>
                )}
                {showEmptyState && (
                  <CommandGroup heading="Starting points">
                    {starts.map((node) => <NoteResult key={node.id} data={data} node={node} query="" onSelect={openNote} />)}
                  </CommandGroup>
                )}
                {results.length > 0 && (
                  <CommandGroup heading="Notes">
                    {results.map((node) => <NoteResult key={node.id} data={data} node={node} query={text} onSelect={openNote} />)}
                  </CommandGroup>
                )}
                {!showEmptyState && engine && results.length === 0 && (
                  <p className="px-5 pt-5 pb-2 text-ui font-normal text-muted-foreground">No notes match ‘{input.trim()}’.</p>
                )}
                {propose && (
                  <CommandGroup heading={results.length ? "Can’t find it?" : undefined}>
                    <CommandItem value="propose" onSelect={() => window.open(propose, "_blank", "noopener")} className="h-11 py-0">
                      <FilePlus2 aria-hidden />
                      <span className="font-normal text-muted-foreground">
                        {results.length ? `Propose “${text}” as a new note →` : "Propose it →"}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
            {mode === "tags" && (
              <>
                <CommandEmpty>{engine ? `No tags start with ‘${input.trim()}’.` : null}</CommandEmpty>
                {tags.length > 0 && (
                  <CommandGroup heading="Tags">
                    {tags.map(({ tag, count }) => (
                      <CommandItem key={tag} value={`tag:${tag}`} onSelect={() => pickTag(tag)} className="h-11 py-0">
                        <Hash aria-hidden />
                        <span className="font-normal text-foreground">{tag}</span>
                        <span className="ml-auto text-ui-small font-normal text-faint tabular-nums">
                          {count} {count === 1 ? "note" : "notes"}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
          <PaletteFooter mode={mode} />
        </Command>
      </DialogContent>
    </Dialog>
  );
}

