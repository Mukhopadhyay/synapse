import { ContributeSection } from "./section";

const STEPS: { title: string; body: React.ReactNode }[] = [
  { title: "Pick a note", body: "A ghost on the map, a stub from the list, or something search couldn't find." },
  {
    title: "Write it",
    body: (
      <>
        In GitHub&apos;s editor, or locally — <code className="rounded-chip bg-surface-raised px-1.5 font-mono text-code">pnpm dev</code> draws the map from
        your files.
      </>
    ),
  },
  { title: "Open a pull request", body: "Checks confirm the frontmatter is valid, the slug is unique and every link resolves." },
  { title: "Merged and live", body: "The site rebuilds and your note joins the map, with you listed as a contributor." },
];

/** The four steps from picking a note to seeing it on the map. */
export function FlowSteps() {
  return (
    <ContributeSection title="From idea to merged">
      <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2 border-t border-border-strong pt-4">
            <span className="font-mono text-ui-small font-normal text-faint tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="text-ui font-semibold text-foreground">{step.title}</h3>
            <p className="text-ui font-normal text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </ContributeSection>
  );
}
