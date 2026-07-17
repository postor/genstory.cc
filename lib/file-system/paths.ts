import type { ContentTypeId } from "@/lib/content-types";

export type ProjectPath = [template: ContentTypeId, projectId: string];

function invalidSegment(value: string): boolean {
  return (
    !value ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    /^[A-Za-z]:$/.test(value)
  );
}

export function normalizeRelativePath(input: string): string {
  const value = input.replaceAll("\\", "/");
  if (!value || value.startsWith("/") || /^[A-Za-z]:\//.test(value)) {
    throw new Error("路径必须是非空的相对路径");
  }

  const parts: string[] = [];
  for (const part of value.split("/")) {
    if (!part) throw new Error("路径不能包含空路径段");
    if (part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) throw new Error("路径不能超出项目目录");
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  if (parts.length === 0) throw new Error("路径不能为空");
  return parts.join("/");
}

export function projectRelativePath(
  template: ContentTypeId,
  projectId: string
): ProjectPath {
  if (invalidSegment(template) || invalidSegment(projectId)) {
    throw new Error("项目类型和项目 ID 必须是单一路径段");
  }
  return [template, projectId];
}

export function validateProjectPath(path: readonly string[]): ProjectPath {
  if (path.length !== 2) throw new Error("项目路径必须包含类型和项目 ID");
  return projectRelativePath(path[0] as ContentTypeId, path[1]);
}
