import type { ContentTypeId } from "@/lib/content-types";
import { listProjectFiles, readTextFile } from "@/lib/file-system/browser";

export interface ProjectPreviewSection {
  path: string;
  title: string;
  body: string;
}

export interface ProjectPreviewModel {
  type: Exclude<ContentTypeId, "visual-novel">;
  title: string;
  sections: ProjectPreviewSection[];
}

function scalar(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "none") return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function frontmatter(text: string): Record<string, string> {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => {
        const index = line.indexOf(":");
        return index < 0
          ? null
          : [line.slice(0, index).trim(), scalar(line.slice(index + 1)) ?? ""];
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  );
}

function heading(text: string): string | undefined {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^#\s+(.+)$/)?.[1]?.trim())
    .find(Boolean);
}

async function safeText(
  root: FileSystemDirectoryHandle,
  path: string
): Promise<string> {
  try {
    return await readTextFile(root, path);
  } catch {
    return "";
  }
}

export async function readProjectPreview(
  root: FileSystemDirectoryHandle,
  type: Exclude<ContentTypeId, "visual-novel">
): Promise<ProjectPreviewModel> {
  const [projectMeta, entries] = await Promise.all([
    safeText(root, "meta.md"),
    listProjectFiles(root),
  ]);
  const projectTitle = frontmatter(projectMeta).title || heading(projectMeta) || "Untitled";
  const sections: ProjectPreviewSection[] = [];

  if (type === "book") {
    const pages = entries
      .filter((entry) => entry.kind === "file")
      .map((entry) => entry.path)
      .filter((path) => /^chapter-[^/]+\/content\.md$/i.test(path))
      .sort((a, b) => a.localeCompare(b));
    for (const path of pages) {
      const body = await safeText(root, path);
      sections.push({ path, title: heading(body) || path, body });
    }
  } else if (type === "comic") {
    const scripts = entries
      .filter((entry) => entry.kind === "file")
      .map((entry) => entry.path)
      .filter((path) => /^chapter-[^/]+\/pages\/[^/]+\/storyboard\.md$/i.test(path))
      .sort((a, b) => a.localeCompare(b));
    for (const path of scripts) {
      const metaPath = path.replace(/storyboard\.md$/i, "meta.md");
      const [meta, body] = await Promise.all([
        safeText(root, metaPath),
        safeText(root, path),
      ]);
      sections.push({
        path,
        title: frontmatter(meta).title || heading(body) || path,
        body,
      });
    }
  } else {
    const scripts = entries
      .filter((entry) => entry.kind === "file")
      .map((entry) => entry.path)
      .filter((path) => /^chapter-[^/]+\/segments\/[^/]+\/script\.md$/i.test(path))
      .sort((a, b) => a.localeCompare(b));
    for (const path of scripts) {
      const metaPath = path.replace(/script\.md$/i, "meta.md");
      const [meta, body] = await Promise.all([
        safeText(root, metaPath),
        safeText(root, path),
      ]);
      sections.push({
        path,
        title: frontmatter(meta).title || heading(body) || path,
        body,
      });
    }
  }

  return { type, title: projectTitle, sections };
}
