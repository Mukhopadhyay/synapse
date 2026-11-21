"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DOMAIN_COLORS, type DomainColor } from "@/lib/content/relations";
import { cn } from "@/lib/utils";

import { SettingsSection } from "../setting-rows";
import { useSettingsStore, type Group } from "../settings-store";

function Swatch({ color, className }: { color: DomainColor; className?: string }) {
  return <span aria-hidden data-node-dot="" data-domain={color} className={cn("inline-block size-3 rounded-full", className)} />;
}

/** Picks a group's colour from the domain hues; the map never uses raw colours. */
function ColorPicker({ group }: { group: Group }) {
  const updateGroup = useSettingsStore((state) => state.updateGroup);
  return (
    <Popover>
      <PopoverTrigger aria-label="Group colour" className="flex size-8 shrink-0 items-center justify-center rounded-chip hover:bg-surface-raised">
        <Swatch color={group.color} />
      </PopoverTrigger>
      <PopoverContent side="left" className="flex w-auto gap-1 p-1.5">
        {DOMAIN_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Colour ${color.replace("domain-", "")}`}
            aria-pressed={group.color === color}
            onClick={() => updateGroup(group.id, { color })}
            className="flex size-7 items-center justify-center rounded-chip hover:bg-surface-raised aria-pressed:bg-surface-raised"
          >
            <Swatch color={color} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Colour groups: notes matching a query take that group's colour; the first matching group wins. */
export function GroupsSection() {
  const { groups, addGroup, updateGroup, removeGroup } = useSettingsStore();
  return (
    <SettingsSection title="Groups">
      {groups.map((group) => (
        <div key={group.id} className="flex items-center gap-1">
          <ColorPicker group={group} />
          <Input
            aria-label="Group query"
            placeholder="tag:rag, cluster:, words"
            value={group.query}
            onChange={(event) => updateGroup(group.id, { query: event.target.value })}
            className="h-8 text-ui-small"
          />
          <Button variant="ghost" size="icon" aria-label="Remove group" onClick={() => removeGroup(group.id)} className="size-8 shrink-0">
            <X aria-hidden />
          </Button>
        </div>
      ))}
      <Button variant="ghost" onClick={addGroup} className="h-8 justify-start gap-2 px-2 text-ui-small">
        <Plus aria-hidden />
        New group
      </Button>
    </SettingsSection>
  );
}
