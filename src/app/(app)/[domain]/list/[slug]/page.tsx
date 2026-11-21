import { NotePageContent, noteMetadata, noteStaticParams } from "@/features/panel/note-page";

export const dynamicParams = false;

export const generateStaticParams = noteStaticParams;

export async function generateMetadata({ params }: PageProps<"/[domain]/list/[slug]">) {
  const { domain, slug } = await params;
  return noteMetadata(domain, slug);
}

/** A note over its field's list; Back returns to the list. */
export default async function ListNotePage({ params }: PageProps<"/[domain]/list/[slug]">) {
  const { domain, slug } = await params;
  return <NotePageContent domain={domain} slug={slug} />;
}
