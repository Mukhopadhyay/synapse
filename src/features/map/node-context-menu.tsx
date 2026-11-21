"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Link2, PanelRightOpen, Pencil } from "lucide-react";
import { toast } from "sonner";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { contributeUrl } from "@/lib/content/contribute-url";
import { noteHref } from "@/lib/content/note-url";
import { useGraphStore } from "@/lib/store/graph-store";
import { useMapStore } from "@/lib/store/map-store";

import type { MapController } from "./map-controller";

async function copyLink(href: string) {
  try {
    await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
    toast("Link copied");
  } catch {
    toast("Couldn't copy the link");
  }
}

/**
 * Right-click (or long-press on touch) a node for its actions. The trigger wraps the map; a press
 * on empty canvas is let through so it never opens an empty menu.
 */
export function NodeContextMenu({ controller, children }: { controller: MapController; children: ReactNode }) {
  const [target, setTarget] = useState<string | null>(null);
  const template = useGraphStore((state) => state.data?.template ?? "");
  const node = target ? controller.node(target) : undefined;

  function onContextMenu(event: React.MouseEvent) {
    const hit = controller.pickAt(event.clientX, event.clientY, "mouse");
    if (!hit) event.preventDefault();
    setTarget(hit);
  }

  function onPointerDown(event: React.PointerEvent) {
    if (event.pointerType === "mouse") return;
    const hit = controller.pickAt(event.clientX, event.clientY, "touch");
    if (!hit) event.preventDefault();
    setTarget(hit);
  }

  function onOpenChange(open: boolean) {
    if (!open) return;
    controller.cancelGesture();
    useMapStore.getState().setHovered(null);
  }

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild onContextMenu={onContextMenu} onPointerDown={onPointerDown}>
        {children}
      </ContextMenuTrigger>
      {node && (
        <ContextMenuContent>
          <ContextMenuLabel>{node.title}</ContextMenuLabel>
          <ContextMenuItem onSelect={() => useMapStore.getState().open(node.id)}>
            <PanelRightOpen aria-hidden />
            Open note
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => void copyLink(noteHref(node.domain, node.id))}>
            <Link2 aria-hidden />
            Copy link
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem asChild>
            <a href={contributeUrl(node, template)} target="_blank" rel="noreferrer">
              {node.ghost ? <ExternalLink aria-hidden /> : <Pencil aria-hidden />}
              {node.ghost ? "Write this note" : "Edit on GitHub"}
            </a>
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
