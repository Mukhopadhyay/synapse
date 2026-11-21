import { editUrl, newFileUrl } from "@/config/site";

import { notePath } from "./note-path";
import type { GraphNode } from "./schema";
import { fillTemplate } from "./template";

/** "Edit on GitHub" for a written note; "Write this note" (a prefilled new file) for a ghost. */
export function contributeUrl(node: GraphNode, template: string) {
  const path = notePath(node);
  return node.ghost ? newFileUrl(path, fillTemplate(template, node.title)) : editUrl(path);
}
