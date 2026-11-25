"use client";

import { useEffect } from "react";

import { useFilterStore } from "@/features/filters/filter-store";
import { useProgressStore } from "@/features/progress/progress-store";
import { trackRecentNotes } from "@/features/search/recent-notes";
import { useSettingsStore } from "@/features/settings/settings-store";
import { usePrefsStore } from "@/lib/store/prefs-store";

/** Reads every saved store once after hydration (server and first client render use the defaults) and keeps saving changes. */
export function RestoreSaved() {
  useEffect(() => {
    const stops = [useFilterStore.getState().restore(), usePrefsStore.getState().restore(), useSettingsStore.getState().restore(), useProgressStore.getState().restore(), trackRecentNotes()];
    return () => stops.forEach((stop) => stop());
  }, []);
  return null;
}
