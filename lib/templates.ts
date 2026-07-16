import type { Lang } from "@/lib/i18n";
import { type ContentTypeId } from "@/lib/content-types";

export function templatePath(lang: Lang, id: ContentTypeId): string {
  return `/templates/${lang}/${id}.md`;
}

export async function loadTemplate(
  lang: Lang,
  id: ContentTypeId
): Promise<string> {
  const res = await fetch(templatePath(lang, id));
  if (!res.ok) throw new Error(`模板加载失败: ${id} (${lang})`);
  return res.text();
}
