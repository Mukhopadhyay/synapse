import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know the design system's type scale; otherwise it reads `text-ui`
 * as a colour and drops it when a colour class like `text-foreground` follows.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "display-mobile",
            "display-small",
            "meta",
            "lead",
            "note-title",
            "note-title-mobile",
            "note-heading",
            "note-body",
            "note-summary",
            "ui",
            "ui-small",
            "overline",
            "map-label",
            "cluster-label",
            "code",
            "kbd",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
