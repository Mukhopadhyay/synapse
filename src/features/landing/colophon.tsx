const ROWS = [
  { key: "Content", value: "Markdown with YAML frontmatter, versioned in git" },
  { key: "Site", value: "Next.js static export on Vercel — no accounts, no tracking" },
  { key: "Graph", value: "Canvas 2D, d3-force and graphology; layout computed at build time" },
  { key: "Type", value: "Newsreader for titles, Geist for everything else" },
  {
    key: "Figures",
    value: (
      <>
        <a href="https://hairline.lucasmarkes.com" target="_blank" rel="noreferrer" className="rounded-chip text-foreground underline-offset-4 hover:underline">
          Hairline
        </a>{" "}
        by Lucas Marques, MIT
      </>
    ),
  },
  { key: "Licence", value: "Code MIT · Notes CC BY-SA 4.0" },
];

export function Colophon() {
  return (
    <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-3.5 sm:grid-cols-[9rem_minmax(0,1fr)]">
      {ROWS.map((row) => (
        <div key={row.key} className="contents">
          <dt className="font-mono text-meta leading-4.5 text-faint">{row.key}</dt>
          <dd className="text-ui-small font-normal text-muted-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
