import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocumentationPage } from "@/components/documentation-page";
import {
  getDocumentationArticle,
  getDocumentationArticles,
  getDocumentationSectionCopy,
  getDocumentationTree,
} from "@/lib/guides-faq";
import {
  normalizePublicLang,
  publicPageMetadata,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string; slug: string[] }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const articles = [
    ...(await getDocumentationArticles("zh")),
    ...(await getDocumentationArticles("en")),
  ];
  return articles
    .filter((article) => article.kind === "faq")
    .map((article) => ({
      lang: article.lang,
      slug: article.slugSegments,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = normalizePublicLang(rawLang);
  const article = await getDocumentationArticle(lang, "faq", slug);
  if (!article) notFound();

  return publicPageMetadata({
    lang,
    path: article.href.slice(`/${lang}/`.length),
    title: article.seoTitle,
    description: article.description,
  });
}

export default async function FaqArticle({ params }: Props) {
  const { lang: rawLang, slug } = await params;
  const lang = normalizePublicLang(rawLang);
  const article = await getDocumentationArticle(lang, "faq", slug);
  if (!article) notFound();

  return (
    <DocumentationPage
      lang={lang}
      kind="faq"
      tree={await getDocumentationTree(lang)}
      article={article}
      sectionCopy={getDocumentationSectionCopy(lang, "faq")}
    />
  );
}

