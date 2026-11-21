# Contributing to Synapse

Synapse is a map of how ideas connect. Every note is one Markdown file in `content/`, and the map is built from those files. You don't need to touch any code to add or improve a note.

## Three ways to help

- **Write a ghost note.** Hollow circles on the map are notes that other notes already link to. Open one and press "Write this note on GitHub": the file opens prefilled.
- **Finish a stub.** A stub has a title and summary but under 100 words. Add the explanation, an example, or the relations it's missing.
- **Improve a note.** Every note has an "Edit on GitHub" link.

## Writing a note

A note lives at `content/<field>/<cluster>/<slug>.md`. The file name is the slug and the address, the first folder is the field, and the second is the cluster.

```yaml
---
title: Retrieval-augmented generation
summary: Ground a model's answer in documents fetched at query time.
level: intermediate        # foundational | intermediate | advanced
tags: [rag]
aliases: [RAG]
requires: [vector-database, chunking]
related: [fine-tuning]
---

A few short paragraphs. Link other notes with [[embeddings]].
```

Only `title` is required. The four relations are `requires`, `extends`, `related` and `contrasts`; each slug becomes a line on the map, and a slug nobody has written yet becomes a ghost note. Dates and contributors come from Git, so never type them in.

A URL alone on its own line becomes a link card, and `!` right before it (`!https://…`) makes a large card with the page's image; previews are fetched at build time into `content/.link-previews.json`, which you commit (`pnpm previews` refreshes them).

See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for tone and style.

## Checking your note locally

```sh
pnpm install
pnpm check   # validates every note: unknown keys, typos in links, cycles
pnpm dev     # runs the site with your note on the map
```

The same check runs on every pull request, with the same error messages.
