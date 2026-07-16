"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "zh" | "en";

type Dict = Record<string, string>;

const zh: Dict = {
  "site.name": "GenStory",
  "nav.home": "首页",
  "nav.projects": "项目",
  "lang.label": "语言",
  "lang.zh": "中文",
  "lang.en": "English",

  "home.heroTitle": "在浏览器里创作你的故事",
  "home.heroSubtitle":
    "图书、漫画、视觉小说与互动视频，全部在本地完成，无需后端。",
  "home.ctaCreate": "开始创作",
  "home.ctaBrowse": "浏览项目",
  "home.sectionCreate": "创建我的作品",
  "home.sectionMore": "查看更多",
  "home.workTypes": "作品类型",
  "home.sampleTitle": "创作空间",
  "home.sampleWaiting": "在本地创建你的第一篇作品，内容会保存在浏览器中。",

  "projects.title": "我的项目",
  "projects.empty": "还没有项目，点击「新建项目」开始创作。",
  "projects.new": "新建项目",
  "projects.import": "导入",
  "projects.export": "导出",
  "projects.delete": "删除",
  "projects.open": "打开",
  "projects.updatedAt": "更新于",
  "projects.createdAt": "创建于",
  "projects.confirmDelete": "确定删除该项目？此操作无法撤销。",
  "projects.imported": "已导入项目",
  "projects.importFailed": "导入失败：",

  "create.title": "新建项目",
  "create.template": "选择模板",
  "create.name": "项目名称",
  "create.namePlaceholder": "为你的作品起个名字",
  "create.submit": "创建并编辑",
  "create.cancel": "取消",
  "create.loading": "正在准备模板…",
  "create.noTemplate": "请选择一个模板",

  "editor.title": "编辑项目",
  "editor.name": "标题",
  "editor.template": "模板",
  "editor.content": "内容",
  "editor.preview": "预览",
  "editor.save": "保存",
  "editor.saved": "已保存",
  "editor.export": "导出文件",
  "editor.back": "返回列表",
  "editor.notFound": "未找到该项目，可能已被删除。",
  "editor.loadTemplate": "重新载入模板内容",
  "editor.empty": "内容为空，可点击「重新载入模板内容」或直接在下方编辑。",

  "common.cancel": "取消",
  "common.confirm": "确定",
};

const en: Dict = {
  "site.name": "GenStory",
  "nav.home": "Home",
  "nav.projects": "Projects",
  "lang.label": "Language",
  "lang.zh": "中文",
  "lang.en": "English",

  "home.heroTitle": "Create your story right in the browser",
  "home.heroSubtitle":
    "Books, comics, visual novels and interactive videos — all local, no backend required.",
  "home.ctaCreate": "Start creating",
  "home.ctaBrowse": "Browse projects",
  "home.sectionCreate": "Create my work",
  "home.sectionMore": "View more",
  "home.workTypes": "Work types",
  "home.sampleTitle": "Workspace",
  "home.sampleWaiting":
    "Create your first work locally — it is saved in your browser.",

  "projects.title": "My projects",
  "projects.empty": "No projects yet. Click “New project” to start.",
  "projects.new": "New project",
  "projects.import": "Import",
  "projects.export": "Export",
  "projects.delete": "Delete",
  "projects.open": "Open",
  "projects.updatedAt": "Updated",
  "projects.createdAt": "Created",
  "projects.confirmDelete": "Delete this project? This cannot be undone.",
  "projects.imported": "Project imported",
  "projects.importFailed": "Import failed: ",

  "create.title": "New project",
  "create.template": "Choose a template",
  "create.name": "Project name",
  "create.namePlaceholder": "Name your work",
  "create.submit": "Create & edit",
  "create.cancel": "Cancel",
  "create.loading": "Preparing template…",
  "create.noTemplate": "Please choose a template",

  "editor.title": "Edit project",
  "editor.name": "Title",
  "editor.template": "Template",
  "editor.content": "Content",
  "editor.preview": "Preview",
  "editor.save": "Save",
  "editor.saved": "Saved",
  "editor.export": "Export file",
  "editor.back": "Back to list",
  "editor.notFound": "Project not found — it may have been deleted.",
  "editor.loadTemplate": "Reload template content",
  "editor.empty":
    "Content is empty. Click “Reload template content” or edit below directly.",

  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
};

const dictionaries: Record<Lang, Dict> = { zh, en };

const STORAGE_KEY = "genstory-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    let initial: Lang = "zh";
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") initial = saved;
      else if (navigator.language?.toLowerCase().startsWith("en")) initial = "en";
    } catch {
      /* ignore storage errors */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const t = useCallback(
    (key: string) => dictionaries[lang][key] ?? key,
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang 必须在 LangProvider 内使用");
  return ctx;
}
