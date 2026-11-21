# Synapse

An open-source, Obsidian-style knowledge graph of interconnected concepts, starting with LLMs (System Design and Backend come later as sibling domains). The graph is the product: people explore a map of concepts, open a note to read it, and follow its typed relations. Notes that don't exist yet appear as ghost nodes that invite contribution.

This is v2, a rewrite from scratch. Nothing from v1 is migrated; don't look for or recreate v1 code.

## Reference docs (local only)

`docs/` holds the maintainer's design docs. It is **gitignored**, so search tools that respect `.gitignore` won't find it: open these files by explicit path. Never `git add` anything in `docs/`, and never copy large parts of it into committed files.

| File | Read it before |
| --- | --- |
| `docs/redesign-proposal.md` | any architecture, pipeline or scope decision |
| `docs/content-schema.md` | touching the content format, Zod schema, or build script. **This is the source of truth for the note format**; if it disagrees with the summary below, it wins |
| `docs/design-specs.md` | any UI work. Source of truth for tokens, layout, motion, keyboard, accessibility and the acceptance checklist |
| `docs/Synapse-v2-pages.pdf` | building or changing a screen. Read it page by page with the PDF reader; match the designs, and say so when you deviate |

If `docs/` is missing (a contributor's clone), work from this file alone.

## Principles

- **Static first.** No database, no server, no API routes. Git is the database, a build script is the backend, the graph ships as static JSON.
- **Content is the product.** A new note is one Markdown file a stranger can write in two minutes and review in a PR diff.
- **Author only what a human knows.** Title, summary and relations are authored. Ids, dates, contributors, sizes, colours and layout are derived.
- **Every edge has a meaning you can say out loud.** "Attention requires Dot Product."
- **Unfinished is visible.** Missing link targets become ghost nodes, not build errors.
- **Domain-agnostic.** `ai` is the first folder, never a hardcoded assumption.

## Stack

Next.js (App Router, `output: 'export'`), TypeScript (strict), Tailwind CSS v4, shadcn/ui on Radix, Zustand, a Canvas 2D renderer + d3-force (live physics, shared with the build's layout) + graphology (`graphology-metrics`, `graphology-communities-louvain`, `graphology-shortest-path`), sonner, unified/remark/rehype (GFM, KaTeX, Shiki; hast-util-from-html for link previews), sharp (build-time link-preview images), gray-matter, Zod, cmdk, MiniSearch, lucide-react, pnpm.

Ask before adding a dependency that isn't listed here.

## Repo layout

```
content/
  <domain>/_domain.yml          # display name, colour, description
  <domain>/<cluster>/<slug>.md  # one note per file
  _templates/note.md            # used by `pnpm new` and "Write this note"
scripts/
  build-graph.ts                # parse → validate → enrich → layout → emit
  new-note.ts                   # interactive scaffold
  __fixtures__/                 # tiny graphs for tests (cycle, ghost, duplicate slug, bad key)
src/
  app/page.tsx                  # Map view
  app/page.tsx                  # splash (first visit), then the last domain graph
  app/[domain]/graph/page.tsx   # a domain's map
  app/[domain]/graph/[slug]/page.tsx  # static note page over its domain's map
  features/map/                 # canvas renderer, live layout, camera, gestures
  features/path/                # layered prerequisite view
  features/panel/               # note panel, relations list
  features/search/              # cmdk palette + MiniSearch index
  lib/content/schema.ts         # Zod schema, shared by build script and app
  lib/graph/                    # graphology helpers: prereqs, shortest path
  components/ui/                # shadcn
public/graph.json               # build output (gitignored)
```

Content contributors should never need to open `src/`.

## Content model (summary)

- Path is identity: filename = slug, first folder = domain, second folder = optional cluster.
- Slugs are globally unique, so `[[caching]]` works from any domain. Qualified `[[domain/slug]]` only on a collision.
- Frontmatter: `title` (required), `summary`, the relation keys, `tags`, `level` (`beginner | intermediate | advanced`), optional `aliases` and `resources`. Unknown keys are errors.
- Relations (authors write outgoing only; backlinks are computed):
  - `requires`: directed, must be acyclic, solid line with arrow
  - `extends`: directed ("is a kind of"), must be acyclic, solid line with hollow arrow
  - `related`: undirected, thin line
  - `contrasts`: undirected ("alternative to"), dashed line
  - body `[[wikilinks]]` become `mentions` edges, hidden by default
- The relation vocabulary is **not final** (a fifth, `part_of`, is under consideration). Define relation keys once, in `lib/content/schema.ts`, and derive everything else (validation, styles, legend, panel groups) from that one definition.
- Dates and contributors come from Git. Vercel clones shallowly, so the build must fall back to "unknown" rather than emit wrong dates.

## Build pipeline (`scripts/build-graph.ts`)

1. Parse `content/**/*.md` with gray-matter; validate with the Zod schema.
2. Extract wikilinks with a remark plugin.
3. Resolve targets; unresolved ones become ghost nodes (a warning, not an error).
4. Fail on: bad YAML, unknown keys, duplicate slugs, self-links, cycles in `requires`/`extends`.
5. Enrich: Git dates and authors, link counts for node size, PageRank over `requires` (kept for learning paths), Louvain as a fallback cluster.
6. Lay out once with the shared d3-force setup (`src/lib/graph/forces.ts`) from a **fixed seed**; store `x`, `y` on each node, so the live map starts at rest.
7. Emit `public/graph.json` (no bodies) and render each body to HTML.

Error messages must be readable by a non-developer: `requires: [atention] — no note called "atention". Did you mean "attention"?`

The same script backs `pnpm check`, which CI runs on every PR.

## Rendering rules

- The map is client-only: load it with a dynamic import and `ssr: false`.
- Keep the renderer and the simulation outside React state. React owns the chrome, the canvas renderer owns drawing and input, Zustand is the bridge (selected, hovered, focused, dragged id; settings).
- All hover, selection and filter styling goes through the map model (`nodeStyle` / `edgeStyle`). Never re-create the renderer on a state or theme change; the simulation only wakes for drags and force changes, and stops completely at rest.
- Canvas can't read CSS variables: resolve tokens once with `getComputedStyle`, convert them, and on theme change re-resolve and redraw.
- The URL is the source of truth: `/<domain>/graph/<slug>?view=focus&depth=2`. Selecting a note pushes history; Back restores the note and camera.
- Static export means no API routes, no middleware, no server actions, and `images.unoptimized: true`.

## Design rules (full spec in `docs/design-specs.md`)

- Dark is the default theme; light is a full peer. Every colour is an OKLCH token in `globals.css`, mapped onto shadcn's variables.
- **Never** write raw hex values or Tailwind palette classes (`bg-zinc-900`, `text-red-500`) in components.
- `signal` (amber) is reserved for selection, the active path, focus rings and the one ghost-note CTA.
- Fonts via `next/font`: Geist (UI and body), Geist Mono (code), Newsreader (note titles only).
- lucide icons only, 16px, stroke 1.75. No emoji anywhere, no gradients, no glows, no looping animation, no spinners under 800ms.
- The map is the home screen. No landing page, no header bar, no footer.
- No buttons that do nothing: if a feature isn't built, its control doesn't exist.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Commands

| Command | Does |
| --- | --- |
| `pnpm dev` | build the graph, then run Next in dev |
| `pnpm build` | build the graph, then the static export |
| `pnpm check` | run the build script's validation only |
| `pnpm previews` | refetch every link-card preview (or one with `--url <url>`) into `content/.link-previews.json` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | build-script tests against `scripts/__fixtures__/` |
| `pnpm stress` | write a 500-node test graph; open `/ai/graph?graph=stress` in dev |
| `pnpm new "<Title>"` | scaffold a note |

If a script doesn't exist yet, create it as part of the task that needs it.

## Working agreement

- For anything bigger than a small fix, propose a plan and wait for approval before writing code.
- Work in small, reviewable steps; stop at the end of each milestone for review.
- Before calling a task done: `pnpm typecheck`, `pnpm lint`, `pnpm test` (once it exists) and `pnpm build` all pass. For UI work, also run the acceptance checklist in `docs/design-specs.md` in both themes at 390px and 1440px.
- When the docs disagree with each other or with what's practical, stop and ask rather than picking one silently.
- Don't hand-write Git-derived data (dates, contributors) into content files.

## Must follow rules
* Follow the design system and coding conventions strictly.
* Take a modular, component-based approach to building the UI.
* Don't rewrite existing components unless absolutelt necessary; prefer extending or composing them.
* Don't write to the DOM or manipulate it directly; use React and the component system instead.
* Avoid using raw hex values or Tailwind palette classes directly; use the design system tokens instead.
* Don't write inline styles and comments everywhere, comments should be only at the component level and at very weird code branches.
* Be careful of the state management; ensure that state is updated immutably and consistently across components.
* If you're ever to make any compromises while coding, write them down in the `COMPROMISES.md` file (as a one liner) so that we can pick that up later on.
* Use as much as shadcn components as possible don't write stuff always by yourself, find if theres existing component from shadcn's registry before creating a new one.

## v0.1 scope

Target: ship by Oct 26, 2026. If time runs short, cut scope (Path view first), not the date.

Must ship: the build pipeline and `pnpm check`, the Map view, note panel and static `/<domain>/graph/<slug>` pages, live physics with Obsidian-style graph settings, the local graph, the splash, search and command palette, the legend with relation and domain toggles, URL state, ghost nodes with "Write this note", and at least 40 seed notes (stubs are fine, each with 2–4 real relations).

Follow-ups, not v0.1: Path view, Connect A → B, learning paths, wikilink hover previews.