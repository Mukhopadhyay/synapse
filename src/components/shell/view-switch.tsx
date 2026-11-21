"use client";

import { usePathname } from "next/navigation";

import { SegmentedLinks } from "@/components/ui/segmented";
import { graphHref, isAllFieldsPath, listHref, parseGraphPath } from "@/lib/content/note-url";

/** Map · List for the current field (the first field on the all-fields map); neither is current on document pages. */
export function ViewSwitch({ fallbackDomain, className }: { fallbackDomain: string; className?: string }) {
  const pathname = usePathname();
  const route = parseGraphPath(pathname);
  const domain = route?.domain ?? fallbackDomain;
  const list = route?.view === "list";
  const map = route ? route.view === "graph" : isAllFieldsPath(pathname);
  return (
    <SegmentedLinks
      label="View"
      className={className}
      links={[
        { href: graphHref(domain), label: "Map", current: map },
        { href: listHref(domain), label: "List", current: list },
      ]}
    />
  );
}
