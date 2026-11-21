import { CodeXml } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { repoUrl } from "@/config/site";

/** The repo on GitHub. lucide has no brand icons, so a source-code glyph stands in for GitHub's mark. */
export function GithubLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild>
          <a href={repoUrl} target="_blank" rel="noreferrer" aria-label="Synapse on GitHub">
            <CodeXml aria-hidden />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Synapse on GitHub</TooltipContent>
    </Tooltip>
  );
}
