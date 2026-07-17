export type TemplateFileKind = "text" | "binary";

export interface ProjectFileEntry {
  path: string;
  kind: "file" | "directory";
  size?: number;
  lastModified?: number;
}

export interface ProjectTemplateFile {
  path: string;
  kind: TemplateFileKind;
  content?: string;
  sourceUrl?: string;
}
