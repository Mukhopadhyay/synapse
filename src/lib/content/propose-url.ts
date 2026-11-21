import { newFileUrl } from "@/config/site";

import { notePath } from "./note-path";
import { fillTemplate } from "./template";

/** "Flash Attn!" → "flash-attn". Empty when nothing usable is left. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GitHub's new-file page for a note nobody has linked to yet, prefilled from what someone searched for. */
export function proposeUrl(query: string, domain: string, template: string) {
  const title = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
  return newFileUrl(notePath({ id: slugify(query), domain }), fillTemplate(template, title));
}
