import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadGraph } from "@/lib/content/load-note";

export const dynamicParams = false;

export async function generateStaticParams() {
  const data = await loadGraph();
  return data.domains.map((domain) => ({ domain: domain.id }));
}

export async function generateMetadata({ params }: PageProps<"/[domain]/graph">): Promise<Metadata> {
  const { domain } = await params;
  const entry = (await loadGraph()).domains.find((candidate) => candidate.id === domain);
  return entry ? { title: `${entry.name} map`, description: entry.description } : {};
}

/** A domain's map. The canvas lives in the shell so it survives opening and closing notes. */
export default async function DomainGraphPage({ params }: PageProps<"/[domain]/graph">) {
  const { domain } = await params;
  if (!(await loadGraph()).domains.some((candidate) => candidate.id === domain)) notFound();
  return null;
}
