import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { newFileUrl } from "@/config/site";
import { loadBody, loadGraph, loadTemplate } from "@/lib/content/load-note";
import { noteHref } from "@/lib/content/note-url";
import { noteView } from "@/lib/graph/note-view";

import { KatexStylesheet } from "./katex-stylesheet";
import { NoteView } from "./note-view";

/** Every note and ghost, for `generateStaticParams` on the graph and list note routes. */
export async function noteStaticParams() {
  const data = await loadGraph();
  return data.nodes.map((node) => ({ domain: node.domain, slug: node.id }));
}

export async function noteMetadata(domain: string, slug: string): Promise<Metadata> {
  const node = (await loadGraph()).nodes.find((entry) => entry.id === slug && entry.domain === domain);
  if (!node) return {};
  const description = node.ghost ? `${node.title} has a place on the map but nobody has written it yet.` : node.summary;
  return {
    title: node.title,
    description,
    alternates: { canonical: noteHref(domain, slug) },
    openGraph: { title: node.title, description, type: "article" },
  };
}

/**
 * A note's static page content, shown in the shell's panel over the map or the list. Title,
 * summary, relations and body are in the server HTML, so the page is shareable and indexable
 * without JavaScript.
 */
export async function NotePageContent({ domain, slug }: { domain: string; slug: string }) {
  const view = noteView(await loadGraph(), slug);
  if (!view || view.node.domain !== domain) notFound();

  if (view.node.ghost) {
    const writeUrl = newFileUrl(view.path, await loadTemplate(view.node.title));
    return <NoteView view={view} body={null} writeUrl={writeUrl} />;
  }

  const body = await loadBody(slug);
  return (
    <>
      {body?.math && <KatexStylesheet />}
      <NoteView view={view} body={body?.html ?? ""} />
    </>
  );
}

/** Fields, for `generateStaticParams` on `/<domain>/graph` and `/<domain>/list`. */
export async function domainStaticParams() {
  return (await loadGraph()).domains.map((domain) => ({ domain: domain.id }));
}

export async function assertDomain(domain: string) {
  if (!(await loadGraph()).domains.some((candidate) => candidate.id === domain)) notFound();
}

