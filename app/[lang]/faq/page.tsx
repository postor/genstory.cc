import type { Metadata } from "next";

import { DocumentationPage } from "@/components/documentation-page";
import {
  getDocumentationSectionCopy,
  getDocumentationTree,
} from "@/lib/guides-faq";
import {
  normalizePublicLang,
  publicPageMetadata,
  siteKeywords,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);
  const copy = getDocumentationSectionCopy(lang, "faq");
  return publicPageMetadata({
    lang,
    path: "faq",
    title: `${copy.title} - GenStory.cc`,
    description: copy.description,
    keywords: [...siteKeywords[lang], copy.title],
  });
}

export default async function FaqIndex({ params }: Props) {
  const lang = normalizePublicLang((await params).lang);
  const tree = await getDocumentationTree(lang);
  const sectionCopy = getDocumentationSectionCopy(lang, "faq");

  return (
    <DocumentationPage
      lang={lang}
      kind="faq"
      tree={tree}
      sectionCopy={sectionCopy}
    />
  );
}

