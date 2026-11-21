"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { noteHref, parseGraphPath, slugFromPath, viewHref } from "@/lib/content/note-url";
import { useGraphStore } from "@/lib/store/graph-store";
import { useMapStore } from "@/lib/store/map-store";

import { cancelCameraWrite, readCamera, writeCameraNow } from "./camera-history";

/** The domain a URL change should land in: the selected note's own, else the one on screen. */
function targetDomain(selectedId: string | null) {
  const data = useGraphStore.getState().data;
  const node = selectedId ? data?.nodes.find((entry) => entry.id === selectedId) : undefined;
  return node?.domain ?? parseGraphPath(window.location.pathname)?.domain ?? data?.domains[0]?.id ?? null;
}

/**
 * Keeps the URL and the selected note in step. The URL is the source of truth: loading, Back and
 * Forward select its note and restore its camera. Selecting or closing a note on the page saves
 * the camera into the current history entry, then pushes /<domain>/<view>/<slug> or /<domain>/<view>,
 * staying in the map or the list.
 */
export function UrlSync() {
  const router = useRouter();
  const urlSlug = slugFromPath(usePathname());

  useLayoutEffect(() => {
    const { selectedId, synced, syncFromUrl } = useMapStore.getState();
    if (synced && selectedId === urlSlug) return;
    cancelCameraWrite();
    syncFromUrl(urlSlug, readCamera());
  }, [urlSlug]);

  useEffect(
    () =>
      useMapStore.subscribe((state, previous) => {
        if (state.selectedId === previous.selectedId || state.selectionSource === "url") return;
        if (state.selectedId === slugFromPath(window.location.pathname)) return;
        const domain = targetDomain(state.selectedId);
        if (!domain) return;
        const camera = state.readCamera?.();
        if (camera) writeCameraNow(camera);
        const query = window.location.search;
        const view = parseGraphPath(window.location.pathname)?.view ?? "graph";
        router.push(`${state.selectedId ? noteHref(domain, state.selectedId, view) : viewHref(domain, view)}${query}`, { scroll: false });
      }),
    [router],
  );

  return null;
}
