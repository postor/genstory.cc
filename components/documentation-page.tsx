"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  FileText,
  Folder,
  FolderOpen,
  Menu,
  X,
} from "lucide-react";
import { isValidElement, useEffect, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  type DocumentationArticle,
  type DocumentationSection,
  type DocumentationKind,
} from "@/lib/guides-faq";
import { languageInfo } from "@/lib/platform-i18n";
import { cn } from "@/lib/utils";
import type { PublicLang } from "@/lib/seo";

type DocumentationPageProps = {
  lang: PublicLang;
  kind: DocumentationKind;
  tree: DocumentationSection[];
  article?: DocumentationArticle;
  sectionCopy: {
    title: string;
    description: string;
  };
};

const copy = {
  zh: {
    menu: "打开文档目录",
    close: "关闭文档目录",
    navigation: "文档目录",
    home: "首页",
    guides: "使用指南",
    faq: "常见问题",
    articles: "篇文章",
    backToSection: "返回",
    related: "相关内容",
  },
  en: {
    menu: "Open documentation menu",
    close: "Close documentation menu",
    navigation: "Documentation",
    home: "Home",
    guides: "Guides",
    faq: "FAQ",
    articles: "articles",
    backToSection: "Back to",
    related: "Related content",
  },
} satisfies Record<PublicLang, Record<string, string>>;

export function DocumentationPage({
  lang,
  kind,
  tree,
  article,
  sectionCopy,
}: DocumentationPageProps) {
  const pathname = usePathname();
  const labels = copy[lang];
  const activeHref = article?.href ?? pathname;
  const navigationTree = tree.filter((section) => section.kind === kind);
  const linkTitles = useMemo(() => {
    const titles = new Map<string, string>();
    for (const section of tree) {
      titles.set(section.href, section.title);
      for (const category of section.categories) {
        for (const item of category.articles) {
          titles.set(item.href, item.title);
        }
      }
    }
    return titles;
  }, [tree]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main
      lang={languageInfo[lang].htmlLang}
      className="bg-[#fbfaff] text-[#17152b]"
    >
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#e9e6f2] pb-4 lg:hidden">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7962b3]">
              {labels.navigation}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[#302b4c]">
              {article?.title ?? sectionCopy.title}
            </p>
          </div>
          <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={labels.menu}
                  title={labels.menu}
                  className="shrink-0 border-[#ddd8ef] bg-white"
                />
              }
            >
              <Menu aria-hidden="true" />
            </DialogTrigger>
            <DialogContent
              aria-label={labels.navigation}
              className="top-16 left-0 h-[calc(100dvh-4rem)] w-[min(88vw,22rem)] max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 border-r border-[#e2ddef] bg-white p-0 shadow-2xl"
              showCloseButton={false}
            >
              <DialogHeader className="flex-row items-center justify-between border-b border-[#ece9f5] px-4 py-4">
                <div>
                  <DialogTitle className="text-base">{labels.navigation}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {sectionCopy.title}
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={labels.close}
                  title={labels.close}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X aria-hidden="true" />
                </Button>
              </DialogHeader>
              <ScrollArea className="h-[calc(100%-5rem)]">
                <div className="p-3">
                  <DocumentationNavigation
                    tree={navigationTree}
                    activeHref={activeHref}
                    onNavigate={() => setMobileMenuOpen(false)}
                    idPrefix="mobile"
                  />
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-12">
          <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] min-h-0 lg:block">
            <div className="border-r border-[#e8e4f1] pr-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7962b3]">
                  {labels.navigation}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#78748d]">
                  {sectionCopy.description}
                </p>
              </div>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <DocumentationNavigation
                  tree={navigationTree}
                    activeHref={activeHref}
                  idPrefix="desktop"
                />
              </ScrollArea>
            </div>
          </aside>

          <div className="min-w-0">
            {article ? (
              <DocumentationArticleContent
                article={article}
                lang={lang}
                labels={labels}
                linkTitles={linkTitles}
              />
            ) : (
              <DocumentationIndexContent
                lang={lang}
                kind={kind}
                tree={tree}
                sectionCopy={sectionCopy}
                labels={labels}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function DocumentationNavigation({
  tree,
  activeHref,
  onNavigate,
  idPrefix,
}: {
  tree: DocumentationSection[];
  activeHref: string;
  onNavigate?: () => void;
  idPrefix: string;
}) {
  const initialExpanded = useMemo(
    () =>
      Object.fromEntries(
        tree.flatMap((section) =>
          section.categories
            .filter((category) =>
              category.articles.some((article) => article.href === activeHref),
            )
            .map((category) => [`${section.kind}:${category.id}`, true]),
        ),
      ),
    [activeHref, tree],
  );
  const [expanded, setExpanded] =
    useState<Record<string, boolean>>(initialExpanded);

  useEffect(() => {
    setExpanded(initialExpanded);
    const frameId = window.requestAnimationFrame(() => {
      const current = document.getElementById(
        `${idPrefix}-${navigationId(activeHref)}`,
      );
      current?.scrollIntoView({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeHref, idPrefix, initialExpanded]);

  return (
    <nav aria-label="Documentation">
      <div className="space-y-5">
        {tree.map((section) => {
          const SectionIcon = section.kind === "guides" ? BookOpen : CircleHelp;
          const sectionActive = activeHref === section.href;

          return (
            <section key={section.kind} aria-labelledby={`${idPrefix}-${section.kind}`}>
              <Link
                id={`${idPrefix}-${navigationId(section.href)}`}
                href={section.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
                  sectionActive
                    ? "bg-[#eee8ff] text-[#6842c5]"
                    : "text-[#3e3955] hover:bg-[#f4f1fb] hover:text-[#6842c5]",
                )}
              >
                <SectionIcon className="size-4 shrink-0" aria-hidden="true" />
                <span>{section.title}</span>
              </Link>

              <div className="mt-2 space-y-1">
                {section.categories.map((category) => {
                  const categoryKey = `${section.kind}:${category.id}`;
                  const categoryExpanded = expanded[categoryKey] ?? false;
                  return (
                    <div key={category.id}>
                      <button
                        type="button"
                        aria-expanded={categoryExpanded}
                        title={categoryExpanded ? "Collapse section" : "Expand section"}
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [categoryKey]: !categoryExpanded,
                          }))
                        }
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#817d93] transition-colors hover:bg-[#f7f5fb] hover:text-[#514a6a]"
                      >
                        <ChevronDown
                          className={cn(
                            "size-3.5 shrink-0 transition-transform",
                            !categoryExpanded && "-rotate-90",
                          )}
                          aria-hidden="true"
                        />
                        {categoryExpanded ? (
                          <FolderOpen className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <Folder className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="min-w-0 truncate">{category.title}</span>
                      </button>
                      {categoryExpanded ? (
                        <div className="ml-3 border-l border-[#e9e5f2] pl-2">
                          {category.articles.map((article) => {
                            const active = article.href === activeHref;
                            return (
                              <Link
                                key={article.id}
                                id={`${idPrefix}-${navigationId(article.href)}`}
                                href={article.href}
                                onClick={onNavigate}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "flex items-start gap-2 rounded-lg px-2 py-2 text-xs leading-5 transition-colors",
                                  active
                                    ? "bg-[#eee8ff] font-semibold text-[#6842c5]"
                                    : "text-[#6f6b80] hover:bg-[#f7f5fb] hover:text-[#3e3955]",
                                )}
                              >
                                <FileText
                                  className="mt-0.5 size-3.5 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{article.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}

function DocumentationArticleContent({
  article,
  lang,
  labels,
  linkTitles,
}: {
  article: DocumentationArticle;
  lang: PublicLang;
  labels: Record<string, string>;
  linkTitles: Map<string, string>;
}) {
  return (
    <article className="min-w-0">
      <div className="mb-8 border-b border-[#e7e3ef] pb-7">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#7a748e]">
          <Link className="hover:text-[#6842c5]" href={localizedPathForLabel(lang)}>
            {labels.home}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="hover:text-[#6842c5]"
            href={article.kind === "guides" ? `/${lang}/guides` : `/${lang}/faq`}
          >
            {article.kind === "guides" ? labels.guides : labels.faq}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{article.categoryLabel}</span>
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-[#1d1931] sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#6e6a80]">
          {article.description}
        </p>
      </div>
      <MarkdownContent markdown={article.body} linkTitles={linkTitles} />
    </article>
  );
}

function DocumentationIndexContent({
  lang,
  kind,
  tree,
  sectionCopy,
  labels,
}: {
  lang: PublicLang;
  kind: DocumentationKind;
  tree: DocumentationSection[];
  sectionCopy: DocumentationPageProps["sectionCopy"];
  labels: Record<string, string>;
}) {
  const section = tree.find((item) => item.kind === kind);
  if (!section) return null;

  return (
    <section aria-labelledby="documentation-index-title">
      <div className="border-b border-[#e7e3ef] pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7962b3]">
          GenStory.cc
        </p>
        <h1
          id="documentation-index-title"
          className="mt-3 text-3xl font-bold tracking-tight text-[#1d1931] sm:text-4xl"
        >
          {section.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#6e6a80]">
          {sectionCopy.description}
        </p>
      </div>

      <div className="mt-8 space-y-10">
        {section.categories.map((category) => (
          <section key={category.id} aria-labelledby={`category-${category.id}`}>
            <div className="mb-3 flex items-center gap-2">
              <Folder className="size-4 text-[#7962b3]" aria-hidden="true" />
              <h2
                id={`category-${category.id}`}
                className="text-xl font-semibold text-[#2f2947]"
              >
                {category.title}
              </h2>
            </div>
            <div className="divide-y divide-[#ece9f5] border-y border-[#ece9f5]">
              {category.articles.map((article) => (
                <Link
                  key={article.id}
                  href={article.href}
                  className="group flex items-start gap-3 py-4 transition-colors hover:text-[#6842c5]"
                >
                  <FileText
                    className="mt-1 size-4 shrink-0 text-[#a39bb8] group-hover:text-[#7962b3]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-[#332d4b] group-hover:text-[#6842c5]">
                      {article.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[#777388]">
                      {article.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function MarkdownContent({
  markdown,
  linkTitles,
}: {
  markdown: string;
  linkTitles: Map<string, string>;
}) {
  const headingCounts = new Map<string, number>();
  const markdownComponents: Components = {
    h2: ({ node: _node, children, ...props }) => {
      void _node;
      return (
        <h2
          {...props}
          id={createHeadingId(children, headingCounts)}
          className="mt-10 scroll-mt-24 text-2xl font-bold tracking-tight text-[#2a2441] first:mt-0"
        >
          {children}
        </h2>
      );
    },
    h3: ({ node: _node, children, ...props }) => {
      void _node;
      return (
        <h3
          {...props}
          id={createHeadingId(children, headingCounts)}
          className="mt-7 scroll-mt-24 text-lg font-semibold text-[#39324f]"
        >
          {children}
        </h3>
      );
    },
    a: ({ node: _node, href, children, title, ...props }) => {
      void _node;
      const isInternal = typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
      const targetTitle =
        typeof href === "string"
          ? linkTitles.get(normalizeDocumentationHref(href))
          : undefined;
      const linkChildren = targetTitle ?? children;
      if (isInternal) {
        return (
          <Link
            {...props}
            href={href}
            title={title}
            className="font-medium text-[#6842c5] underline decoration-[#c9bdf0] underline-offset-4 hover:text-[#47249c] hover:decoration-[#6842c5]"
          >
            {linkChildren}
          </Link>
        );
      }
      return (
        <a
          {...props}
          href={href}
          title={title}
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel={href?.startsWith("http") ? "noreferrer" : undefined}
          className="font-medium text-[#6842c5] underline decoration-[#c9bdf0] underline-offset-4 hover:text-[#47249c] hover:decoration-[#6842c5]"
        >
          {linkChildren}
        </a>
      );
    },
    img: ({ node: _node, src, alt, ...props }) => {
      void _node;
      if (!src) return null;
      return (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...props}
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            className="my-6 max-h-[34rem] max-w-full rounded-lg border border-[#e4dfed] object-contain"
          />
        </>
      );
    },
    pre: ({ node: _node, children, ...props }) => {
      void _node;
      return (
        <pre
          {...props}
          className="my-6 overflow-x-auto rounded-lg border border-[#29233e] bg-[#191628] p-4 text-sm leading-6 text-[#eeeafa]"
        >
          {children}
        </pre>
      );
    },
    code: ({ node: _node, className, children, ...props }) => {
      void _node;
      const isBlock = className?.includes("language-");
      return (
        <code
          {...props}
          className={cn(
            isBlock
              ? "font-mono"
              : "rounded bg-[#f0edf7] px-1.5 py-0.5 font-mono text-[0.9em] text-[#4d3e73]",
            className,
          )}
        >
          {children}
        </code>
      );
    },
    blockquote: ({ node: _node, children, ...props }) => {
      void _node;
      return (
        <blockquote
          {...props}
          className="my-6 border-l-4 border-[#b9a5ee] pl-4 text-[#6e6a80]"
        >
          {children}
        </blockquote>
      );
    },
  };

  return (
    <div className="max-w-3xl text-[15px] leading-7 text-[#514c61] [&_hr]:my-8 [&_hr]:border-[#e7e3ef] [&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_strong]:font-semibold [&_strong]:text-[#302a45] [&_table]:my-6 [&_table]:w-full [&_td]:border [&_td]:border-[#e4dfed] [&_td]:p-2 [&_th]:border [&_th]:border-[#e4dfed] [&_th]:bg-[#f5f2fa] [&_th]:p-2 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function createHeadingId(
  children: ReactNode,
  counts: Map<string, number>,
) {
  const text = nodeText(children).trim();
  const base =
    text
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-") || "section";
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeText(node.props.children);
  }
  return "";
}

function navigationId(href: string) {
  return href.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeDocumentationHref(href: string) {
  const path = href.split(/[?#]/, 1)[0] ?? href;
  return path.replace(/\/$/, "") || "/";
}

function localizedPathForLabel(lang: PublicLang) {
  return `/${lang}`;
}
