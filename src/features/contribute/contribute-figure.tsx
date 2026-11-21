import { Branches } from "@lucasmarkes/hairline/react";

/** The Contribute header's figure: a branch off main, merged back, playing its tour until a pointer arrives. */
export function ContributeFigure() {
  return (
    <figure className="flex w-full max-w-85 min-w-0 flex-col gap-2">
      <Branches play className="hairline w-full" />
      <figcaption className="font-mono text-meta text-faint">A branch off main, merged back. Point at a commit: its history rises after it.</figcaption>
    </figure>
  );
}
