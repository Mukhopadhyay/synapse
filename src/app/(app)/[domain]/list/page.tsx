import type { Metadata } from "next";

import { assertDomain, domainStaticParams } from "@/features/panel/note-page";
import { loadGraph } from "@/lib/content/load-note";

export const dynamicParams = false;

export const generateStaticParams = domainStaticParams;

export async function generateMetadata({ params }: PageProps<"/[domain]/list">): Promise<Metadata> {
  const { domain } = await params;
  const entry = (await loadGraph()).domains.find((candidate) => candidate.id === domain);
  return entry ? { title: `${entry.name} notes`, description: entry.description } : {};
}

/** A field's notes as a sortable list. The list lives in the shell, like the map, so it survives opening notes. */
export default async function DomainListPage({ params }: PageProps<"/[domain]/list">) {
  await assertDomain((await params).domain);
  return null;
}
