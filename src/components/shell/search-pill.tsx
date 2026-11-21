"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useSearchStore } from "@/features/search/search-store";

/** "Search notes ⌘K" in the middle of the bar (centred on the viewport from 1280px, between the bar's two sides below that); a search icon on phones. Both open the palette. */
export function SearchPill() {
  const setOpen = useSearchStore((state) => state.setOpen);

  return (
    <>
      <button
        type="button"
        data-search-trigger=""
        onClick={() => setOpen(true)}
        className="@container mx-auto hidden h-8 min-w-0 max-w-search-pill flex-1 items-center gap-2 rounded-full border border-border bg-surface-raised pr-2 pl-3 text-ui font-normal text-faint transition-colors duration-instant hover:border-border-strong hover:text-muted-foreground sm:flex xl:absolute xl:top-1/2 xl:left-1/2 xl:w-search-pill xl:max-w-none xl:flex-none xl:-translate-1/2"
      >
        <Search aria-hidden className="size-icon shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">Search notes</span>
        <Kbd aria-hidden className="h-4 @max-[11rem]:hidden pointer-coarse:hidden">⌘K</Kbd>
      </button>
      <Button variant="ghost" size="icon" aria-label="Search notes" data-search-trigger="" onClick={() => setOpen(true)} className="size-touch sm:hidden">
        <Search aria-hidden />
      </Button>
    </>
  );
}
