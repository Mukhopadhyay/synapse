import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { CodeXml } from "lucide-react";

import { Button } from "@/components/ui/button";
import { repoUrl } from "@/config/site";
import { Anatomy } from "@/features/contribute/anatomy";
import { CommunityCards } from "@/features/contribute/community-cards";
import { ContributeFigure } from "@/features/contribute/contribute-figure";
import { FlowSteps } from "@/features/contribute/flow-steps";
import { ArrowLink } from "@/features/contribute/section";
import { WaitingList } from "@/features/contribute/waiting-list";
import { WaysToHelp } from "@/features/contribute/ways-to-help";
import { loadGraph } from "@/lib/content/load-note";
import { notePath } from "@/lib/content/note-path";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Every note in Synapse is a Markdown file in a public repo. Finish a stub, write a note nobody has written yet, or fix something that's wrong.",
};

/** The best-connected written note, shown whole as the anatomy example. */
async function exampleNote() {
  const data = await loadGraph();
  const node = data.nodes.filter((entry) => !entry.ghost).sort((a, b) => b.aliases.length - a.aliases.length || b.relationCount - a.relationCount)[0];
  if (!node) return null;
  const file = notePath(node);
  return { file, text: (await readFile(path.join(process.cwd(), file), "utf8")).trim() };
}

/** PDF pages 9–10: how to help, what's waiting, the note format and the path to a merged PR. */
export default async function ContributePage() {
  const data = await loadGraph();
  const example = await exampleNote();
  const domain = data.domains[0]?.id ?? "";

  return (
    <article className="mx-auto w-full max-w-240 pt-29 pb-16">
      <div className="grid items-center gap-12 sm:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <header>
          <p className="text-overline text-faint uppercase">Contribute</p>
          <h1 className="mt-4 font-serif text-note-title text-balance text-foreground max-sm:text-note-title-mobile">Help map how ideas connect</h1>
          <p className="mt-4 max-w-160 text-note-summary text-muted-foreground">
            Every note in Synapse is a Markdown file in a public repo. Finish a stub, write a note nobody has written yet, or fix something that&apos;s wrong —
            no account beyond GitHub, no setup to start.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <a href={repoUrl} target="_blank" rel="noreferrer">
                <CodeXml aria-hidden />
                Open the repo
              </a>
            </Button>
          </div>
        </header>
        <ContributeFigure />
      </div>
      {domain && <WaysToHelp domain={domain} />}
      <WaitingList data={data} />
      {example && <Anatomy examplePath={example.file} example={example.text} />}
      <FlowSteps />
      <CommunityCards />
      <p className="mt-16 text-ui-small font-normal text-faint">
        Stuck on something? <ArrowLink href={`${repoUrl}/issues/new`} external>Open an issue</ArrowLink>
      </p>
    </article>
  );
}
