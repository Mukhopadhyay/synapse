import { create } from "zustand";

/** Whether the search palette is open and what's typed in it. Closing clears the box. */
type SearchState = {
  open: boolean;
  query: string;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  /** Opens with a query already typed, e.g. a tag node's `tag:rag `. */
  openWith: (query: string) => void;
};

/** Whatever had focus when the palette opened, so closing it can hand focus back. */
let opener: Element | null = null;
const rememberOpener = () => {
  opener = typeof document === "undefined" ? null : document.activeElement;
};

/** Where focus goes when the palette closes: back to its opener, else the visible search button. */
export function returnFocusAfterPalette() {
  const target = opener instanceof HTMLElement && opener.isConnected && opener !== document.body ? opener : null;
  opener = null;
  const fallback = [...document.querySelectorAll<HTMLElement>("[data-search-trigger]")].find((element) => element.offsetParent !== null);
  (target ?? fallback)?.focus({ preventScroll: true });
}

export const useSearchStore = create<SearchState>()((set, get) => ({
  open: false,
  query: "",
  setOpen: (open) => {
    if (open && !get().open) rememberOpener();
    set(open ? { open } : { open, query: "" });
  },
  setQuery: (query) => set({ query }),
  openWith: (query) => {
    if (!get().open) rememberOpener();
    set({ open: true, query });
  },
}));
