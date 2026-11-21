import { create } from "zustand";

import type { DomainColor } from "@/lib/content/relations";

/** Each note's group colour (first matching group wins); notes in no group keep their cluster tint. Derived, never saved. */
export const useGroupColors = create<{ colors: Map<string, DomainColor> }>()(() => ({ colors: new Map() }));
