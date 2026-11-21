import { NotePageContent, noteMetadata, noteStaticParams } from "@/features/panel/note-page";

export const dynamicParams = false;

export const generateStaticParams = noteStaticParams;

export async function generateMetadata({ params }: PageProps<"/[domain]/graph/[slug]">) {
  const { domain, slug } = await params;
  return noteMetadata(domain, slug);
}

/** A note over its field's map: the same shell with the note's panel open. */
export default async function NotePage({ params }: PageProps<"/[domain]/graph/[slug]">) {
  const { domain, slug } = await params;
  return <NotePageContent domain={domain} slug={slug} />;
}
