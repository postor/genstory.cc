"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import pictureBookImage from "@/docs/design/icons/picture-book.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { contentTypes, type ContentTypeId } from "@/lib/content-types";
import { openProjectDirectory, readFile } from "@/lib/file-system/browser";
import { listProjects, type Project } from "@/lib/local-projects";
import { localizedPath, type PublicLang } from "@/lib/seo";

const typeImages: Record<ContentTypeId, string> = {
  book: "/home/type-icons/book.png",
  "picture-book": pictureBookImage.src,
  comic: "/home/type-icons/comic.png",
  "visual-novel": "/home/type-icons/visual-novel.png",
  "interactive-video": "/home/type-icons/video.png",
  "phaser-game": "/home/type-icons/game.png",
};

export function LocalContinueProjectCard({ lang }: { lang: PublicLang }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [coverImage, setCoverImage] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    void listProjects()
      .then((items) => {
        if (!cancelled) setProjects(items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recentProject = projects[0];

  useEffect(() => {
    if (!recentProject) {
      return;
    }

    let cancelled = false;
    let coverUrl: string | undefined;

    void readProjectCoverUrl(recentProject)
      .then((url) => {
        coverUrl = url;
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        setCoverImage(url);
      })
      .catch(() => {
        if (!cancelled) setCoverImage(undefined);
      });

    return () => {
      cancelled = true;
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, [recentProject]);

  if (!recentProject) return null;

  const projectHref = localizedPath(lang, `projects/editor?id=${recentProject.id}`);
  const projectType = contentTypes.find((type) => type.id === recentProject.template);
  const image = coverImage ?? typeImages[recentProject.template];
  const updated = new Date(recentProject.updatedAt).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
  );

  return (
    <Card className="overflow-hidden border-[#e8e3ff] bg-white/85 shadow-[0_18px_45px_rgba(88,67,166,0.08)]">
      <CardHeader className="flex-row items-center justify-between border-b border-[#f0edff] px-5 py-4">
        <CardTitle className="text-lg">
          {lang === "zh" ? "今天继续创作" : "Continue creating today"}
        </CardTitle>
        <Link
          href={localizedPath(lang, "projects")}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#7250d9] hover:text-[#4c27ba]"
        >
          {lang === "zh" ? "查看全部" : "View all"}
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-5">
        <Link href={projectHref} className="group flex gap-3">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[#eeeaff]">
            {coverImage ? (
              <>
                {/* Local OPFS previews use blob URLs; Next Image cannot render them reliably. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </>
            ) : (
              <Image
                src={image}
                alt=""
                fill
                sizes="112px"
                className="object-contain object-center"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{recentProject.title}</h3>
            <p className="mt-1 text-xs text-[#7f7d9b]">
              {projectType?.label[lang] ?? recentProject.template}
            </p>
            <p className="mt-3 text-xs text-[#9a97b0]">
              {lang === "zh" ? `最近编辑：${updated}` : `Last edited: ${updated}`}
            </p>
          </div>
        </Link>
        <Button
          render={<Link href={projectHref} />}
          variant="outline"
          className="mt-5 w-full border-[#b79cff] text-[#6e43e5] hover:bg-[#f5f0ff] hover:text-[#5c34ce]"
        >
          {lang === "zh" ? "继续创作" : "Continue"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  );
}

async function readProjectCoverUrl(project: Project): Promise<string | undefined> {
  try {
    const root = await openProjectDirectory(project.template, project.id);

    for (const filename of ["cover.jpg", "cover.png"]) {
      try {
        const file = await readFile(root, filename);
        return URL.createObjectURL(file);
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") continue;
        throw error;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}
