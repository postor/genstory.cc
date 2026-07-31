import type { ContentTypeId } from "@/lib/content-types";
import { openProjectDirectory, readFile } from "@/lib/file-system/browser";
import type { Project } from "@/lib/local-projects";

export const projectTypeImages: Record<ContentTypeId, string> = {
  book: "/home/type-icons/book.png",
  "picture-book": "/home/type-icons/book.png",
  comic: "/home/type-icons/comic.png",
  "visual-novel": "/home/type-icons/visual-novel.png",
  "interactive-video": "/home/type-icons/video.png",
  "phaser-game": "/home/type-icons/game.png",
};

export const projectTypeImageDimensions: Record<
  ContentTypeId,
  { width: number; height: number }
> = {
  book: { width: 278, height: 172 },
  "picture-book": { width: 278, height: 172 },
  comic: { width: 285, height: 207 },
  "visual-novel": { width: 310, height: 219 },
  "interactive-video": { width: 356, height: 242 },
  "phaser-game": { width: 315, height: 219 },
};

export function hasProjectCoverUrl(
  entry: readonly [string, string | undefined],
): entry is [string, string] {
  return Boolean(entry[1]);
}

export async function readProjectCoverUrl(
  project: Project,
): Promise<string | undefined> {
  try {
    const root = await openProjectDirectory(project.template, project.id);

    for (const filename of ["cover.jpg", "cover.png"]) {
      try {
        const file = await readFile(root, filename);
        return URL.createObjectURL(file);
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError") {
          continue;
        }
        throw error;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}
