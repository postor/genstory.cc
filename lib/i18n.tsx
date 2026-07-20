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
    "图书、漫画、视觉小说、互动视频与 Phaser 游戏，都可以直接在浏览器中创作。作品保存在这台设备的浏览器里。",
  "home.ctaCreate": "开始创作",
  "home.ctaBrowse": "浏览项目",
  "home.sectionCreate": "创建我的作品",
  "home.sectionMore": "查看更多",
  "home.emptyCategoryTitle": "还没有作品",
  "home.emptyCategoryBody":
    "创建后会显示在这里。作品会保存在这台设备的浏览器中，建议定期下载项目备份。",
  "home.workTypes": "作品类型",
  "home.sampleTitle": "创作空间",
  "home.sampleWaiting": "创建你的第一部作品。内容会保存在这台设备的浏览器中。",

  "projects.title": "我的作品",
  "projects.empty": "还没有作品，点击「新建作品」开始创作。",
  "projects.new": "新建作品",
  "projects.import": "导入项目备份",
  "projects.importing": "正在导入备份…",
  "projects.export": "导出",
  "projects.delete": "删除",
  "projects.open": "打开",
  "projects.updatedAt": "更新于",
  "projects.createdAt": "创建于",
  "projects.editTitle": "编辑标题",
  "projects.confirmDelete": "确定删除该项目？此操作无法撤销。",
  "projects.reconnect": "重新连接作品",
  "projects.unbound": "暂时无法找到作品",
  "projects.storageNote":
    "作品内容和素材保存在这台设备的浏览器中，不会自动上传到 GenStory 服务器。换设备或清理浏览器数据前，请先下载项目备份。",

  "create.title": "新建作品",
  "create.template": "项目类型",
  "create.name": "作品名称",
  "create.namePlaceholder": "为你的作品起个名字",
  "create.submit": "创建并编辑",
  "create.cancel": "取消",
  "create.loading": "正在准备模板…",
  "create.noTemplate": "请选择一个模板",
  "create.browserUnsupported":
    "当前浏览器不支持在浏览器中保存作品，请换用最新版 Chrome、Edge 或其他现代桌面浏览器。",
  "editor.title": "编辑作品",
  "editor.name": "标题",
  "editor.template": "模板",
  "editor.content": "内容",
  "editor.preview": "预览",
  "editor.save": "保存",
  "editor.saved": "已保存到浏览器",
  "editor.downloadSource": "下载项目备份",
  "editor.export": "导出",
  "phaser.export": "导出 Phaser 游戏",
  "editor.back": "返回列表",
  "editor.notFound": "未找到该项目，可能已被删除。",
  "editor.loadTemplate": "重新载入模板内容",
  "editor.empty": "内容为空，可点击「重新载入模板内容」或直接在下方编辑。",
  "editor.files": "项目文件",
  "editor.noProject": "请从左侧选择一个项目开始编辑。",
  "editor.noProjects": "还没有项目，先去「项目」页新建一个。",
  "editor.chat": "创作助手",
  "editor.guidanceTitle": "是否需要引导创建第一个章节？",
  "editor.guidanceDesc":
    "我可以帮你规划并写出项目的第一个章节，是否现在开始？",
  "editor.guidanceStart": "开始引导",
  "editor.guidanceSkip": "暂不",
  "editor.firstChapterPrompt": "引导我创建第一个章节",
  "editor.guidancePickModel": "请选择一个模型，不同模型的能力和价格不同。",
  "editor.guidancePressEnter": "按回车输入（发送）。",
  "editor.fileSystemUnsupported": "当前浏览器不支持在浏览器中保存作品。",
  "editor.permissionDenied": "无法访问浏览器中的作品数据，请重新打开作品。",
  "editor.refreshFiles": "刷新文件",
  "editor.uploadFiles": "上传文件",
  "editor.newFolder": "新建目录",
  "editor.deleteEntry": "删除",
  "editor.enterFolderName": "请输入目录名称",
  "editor.confirmDeleteEntry": "确定删除选中的文件或目录？此操作无法撤销。",
  "editor.reloadFile": "重新读取",
  "editor.fileChanged": "文件已变化",
  "editor.saveFailed": "无法保存到浏览器：",
  "editor.noBoundProject": "作品数据暂时无法访问，请重新连接或恢复项目。",
  "editor.chatDataNote":
    "创作助手会将你发送的消息，以及它读取的项目内容，发送给你选择的模型服务。",
  "editor.binaryFile": "这是二进制文件，当前仅支持图片预览。",
  "editor.folderSelected": "已选中目录。可以上传文件、新建子目录或删除该目录。",
  "editor.applyChanges": "应用变更",
  "editor.discardChanges": "丢弃",
  "editor.pendingChanges": "待应用文件变更",

  "vn.projectTitle": "项目标题",
  "vn.scenes": "章节与场景",
  "vn.assets": "资产",
  "vn.addChapter": "新增章节",
  "vn.addScene": "新增场景",
  "vn.sceneTitle": "场景标题",
  "vn.background": "背景",
  "vn.characters": "出场角色",
  "vn.addCharacter": "添加角色",
  "vn.position": "位置",
  "vn.left": "左",
  "vn.center": "中",
  "vn.right": "右",
  "vn.script": "剧本",
  "vn.scriptHint":
    "旁白：: 文本　对话：说话者: 文本　分支：>> 选项A:场景| 选项B:场景　等待：~~ 1200　跳转：changeScene:场景.txt",
  "vn.noScenes": "还没有场景，点击「新增场景」开始。",
  "vn.assetsHint": "模板已预置小红帽、外婆、大灰狼和森林等资产，文件均来自当前项目目录。",
  "vn.assetName": "名称",
  "vn.assetType": "类型",
  "vn.assetFile": "文件名",
  "vn.preview": "预览",
  "vn.exportOpenwebgal": "导出 OpenWebGal",
  "vn.previewLoading": "正在准备预览…",
  "vn.exporting": "正在打包导出…",
  "vn.structuredEditor": "场景编辑",

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
    "Create books, comics, visual novels, interactive videos, and Phaser games directly in your browser. Your work stays in this browser on this device.",
  "home.ctaCreate": "Start creating",
  "home.ctaBrowse": "Browse projects",
  "home.sectionCreate": "Create my work",
  "home.sectionMore": "View more",
  "home.emptyCategoryTitle": "No works yet",
  "home.emptyCategoryBody":
    "Created works appear here. They stay in this browser on this device, so regular project backups are recommended.",
  "home.workTypes": "Work types",
  "home.sampleTitle": "Workspace",
  "home.sampleWaiting":
    "Create your first work. It will be saved in this browser on this device.",

  "projects.title": "My works",
  "projects.empty": "No works yet. Click “New work” to start creating.",
  "projects.new": "New work",
  "projects.import": "Import project backup",
  "projects.importing": "Importing backup…",
  "projects.export": "Export",
  "projects.delete": "Delete",
  "projects.open": "Open",
  "projects.updatedAt": "Updated",
  "projects.createdAt": "Created",
  "projects.editTitle": "Edit title",
  "projects.confirmDelete": "Delete this project? This cannot be undone.",
  "projects.reconnect": "Reconnect work",
  "projects.unbound": "Work temporarily unavailable",
  "projects.storageNote":
    "Your work and assets stay in this browser on this device and are not automatically uploaded to GenStory servers. Download a project backup before changing devices or clearing browser data.",

  "create.title": "New work",
  "create.template": "Project type",
  "create.name": "Work name",
  "create.namePlaceholder": "Name your work",
  "create.submit": "Create & edit",
  "create.cancel": "Cancel",
  "create.loading": "Preparing template…",
  "create.noTemplate": "Please choose a template",
  "create.browserUnsupported":
    "This browser cannot save work in the browser. Use the latest Chrome, Edge, or another modern desktop browser.",
  "editor.title": "Edit work",
  "editor.name": "Title",
  "editor.template": "Template",
  "editor.content": "Content",
  "editor.preview": "Preview",
  "editor.save": "Save",
  "editor.saved": "Saved in browser",
  "editor.downloadSource": "Download project backup",
  "editor.export": "Export",
  "phaser.export": "Export Phaser game",
  "editor.back": "Back to list",
  "editor.notFound": "Project not found — it may have been deleted.",
  "editor.loadTemplate": "Reload template content",
  "editor.empty":
    "Content is empty. Click “Reload template content” or edit below directly.",
  "editor.files": "Project files",
  "editor.noProject": "Select a project on the left to start editing.",
  "editor.noProjects": "No projects yet — create one from the Projects page.",
  "editor.chat": "Creation assistant",
  "editor.guidanceTitle": "Want guidance to create the first chapter?",
  "editor.guidanceDesc":
    "I can help you plan and write the first chapter of your project. Start now?",
  "editor.guidanceStart": "Start guidance",
  "editor.guidanceSkip": "Not now",
  "editor.firstChapterPrompt": "Guide me to create the first chapter",
  "editor.guidancePickModel": "Please pick a model — different models have different capabilities and prices.",
  "editor.guidancePressEnter": "Press Enter to send.",
  "editor.fileSystemUnsupported": "This browser cannot save work in the browser.",
  "editor.permissionDenied": "Could not access the work stored in this browser. Reopen the work and try again.",
  "editor.refreshFiles": "Refresh files",
  "editor.uploadFiles": "Upload files",
  "editor.newFolder": "New folder",
  "editor.deleteEntry": "Delete",
  "editor.enterFolderName": "Enter folder name",
  "editor.confirmDeleteEntry": "Delete the selected file or folder? This cannot be undone.",
  "editor.reloadFile": "Reload file",
  "editor.fileChanged": "File changed",
  "editor.saveFailed": "Could not save to the browser: ",
  "editor.noBoundProject": "The work data is temporarily unavailable. Reconnect or restore the work.",
  "editor.chatDataNote":
    "The creation assistant sends your messages and any project content it reads to the model service you choose.",
  "editor.binaryFile": "This is a binary file. Image preview is supported here.",
  "editor.folderSelected": "Folder selected. You can upload files, create a child folder, or delete this folder.",
  "editor.applyChanges": "Apply changes",
  "editor.discardChanges": "Discard",
  "editor.pendingChanges": "Pending file changes",

  "vn.projectTitle": "Project title",
  "vn.scenes": "Chapters & scenes",
  "vn.assets": "Assets",
  "vn.addChapter": "Add chapter",
  "vn.addScene": "Add scene",
  "vn.sceneTitle": "Scene title",
  "vn.background": "Background",
  "vn.characters": "Characters on stage",
  "vn.addCharacter": "Add character",
  "vn.position": "Position",
  "vn.left": "Left",
  "vn.center": "Center",
  "vn.right": "Right",
  "vn.script": "Script",
  "vn.scriptHint":
    "Narration: : text   Dialogue: speaker: text   Branch: >> OptA:scene| OptB:scene   Wait: ~~ 1200   Jump: changeScene:scene.txt",
  "vn.noScenes": "No scenes yet — click “Add scene” to start.",
  "vn.assetsHint": "The template includes Little Red Riding Hood, the wolf, the forest, and other assets from the project directory.",
  "vn.assetName": "Name",
  "vn.assetType": "Type",
  "vn.assetFile": "File name",
  "vn.preview": "Preview",
  "vn.exportOpenwebgal": "Export OpenWebGal",
  "vn.previewLoading": "Preparing preview…",
  "vn.exporting": "Packaging export…",
  "vn.structuredEditor": "Scene editor",

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
