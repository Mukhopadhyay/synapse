import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

import type { GraphData, NoteBody } from "./schema";
import { fillTemplate } from "./template";

/** Build-time reads for the static note pages. The build script writes these files first. */

const root = process.cwd();

export const loadGraph = cache(
  async (): Promise<GraphData> => JSON.parse(await readFile(path.join(root, "public/graph.json"), "utf8")),
);

export async function loadBody(slug: string): Promise<NoteBody | null> {
  try {
    return JSON.parse(await readFile(path.join(root, ".synapse/notes", `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

/** content/_templates/note.md with the title filled in, for "Write this note on GitHub". */
export async function loadTemplate(title: string) {
  return fillTemplate(await readFile(path.join(root, "content/_templates/note.md"), "utf8"), title);
}
