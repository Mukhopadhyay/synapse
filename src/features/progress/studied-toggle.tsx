"use client";

import { Check } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { shortDate } from "@/lib/progress/ops";

import { toggleStudiedNote } from "./mark-studied";
import { useProgressStore } from "./progress-store";

/** "Mark as studied" for the note panel; on, it reads "Studied". Waits for saved progress so it never flashes the wrong state. */
export function StudiedToggle({ slug }: { slug: string }) {
  const restored = useProgressStore((state) => state.restored);
  const studied = useProgressStore((state) => state.studiedSet.has(slug));
  const on = restored && studied;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          variant="outline"
          size="sm"
          pressed={on}
          onPressedChange={() => toggleStudiedNote(slug)}
          className="h-6 gap-1.5 rounded-chip px-2 text-ui-small data-[state=on]:border-success data-[state=on]:text-foreground"
        >
          <Check aria-hidden className={on ? "text-success" : undefined} />
          {on ? "Studied" : "Mark as studied"}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        {on ? "Mark as not studied" : "Mark as studied"} <Kbd>S</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

/** "Studied · 24 Nov" once a note is marked. */
export function StudiedDate({ slug }: { slug: string }) {
  const date = useProgressStore((state) => (state.restored ? state.studied[slug] : undefined));
  const label = date ? shortDate(date) : "";
  return label ? <span className="text-ui-small font-normal text-faint">Studied · {label}</span> : null;
}
