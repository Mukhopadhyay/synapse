import { repoUrl, REPO } from "@/config/site";

import { ArrowLink } from "./section";

function Card({ title, children, link }: { title: string; children: React.ReactNode; link: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-surface border border-border bg-surface p-6">
      <h3 className="text-ui font-semibold text-foreground">{title}</h3>
      <p className="text-ui font-normal text-muted-foreground">{children}</p>
      {link}
    </div>
  );
}

/** Hacktoberfest and the style guide. The licence block waits until the repo has licence files. */
export function CommunityCards() {
  return (
    <div className="mt-16 grid gap-4 md:grid-cols-2">
      <Card title="Hacktoberfest 2026" link={<ArrowLink href={`${repoUrl}/issues?q=is%3Aopen+label%3Ahacktoberfest`} external>Browse issues</ArrowLink>}>
        Merged notes and fixes count. Issues labelled <code className="rounded-chip bg-surface-raised px-1.5 font-mono text-code">hacktoberfest</code> point to the
        notes we&apos;d most like written.
      </Card>
      <Card title="Style guide" link={<ArrowLink href={`${repoUrl}/blob/${REPO.branch}/CONTENT_GUIDE.md`} external>Read the style guide</ArrowLink>}>
        Plain, short, sentence case. One idea per note, one sentence of summary, and only the relations you can say out loud.
      </Card>
    </div>
  );
}
