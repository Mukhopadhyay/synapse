/** A numbered landing section: mono number and title on the left, content on the right; one column below `split`. */
export function LandingSection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid gap-5 border-t border-border py-12 split:grid-cols-[15.5rem_minmax(0,1fr)] split:gap-0">
      <div>
        <p className="font-mono text-meta text-faint">{number}</p>
        <h2 id={`${id}-title`} className="mt-3 text-note-summary font-semibold text-foreground">
          {title}
        </h2>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Body copy in a landing section. */
export function LandingProse({ children }: { children: React.ReactNode }) {
  return <div className="flex max-w-180 flex-col gap-4 text-note-body text-muted-foreground">{children}</div>;
}
