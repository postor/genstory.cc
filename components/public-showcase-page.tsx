import { ShowcaseGallery } from "@/components/showcase-gallery";
import { languageInfo } from "@/lib/platform-i18n";
import type { PublicLang } from "@/lib/seo";

const showcaseCopy = {
  zh: {
    heading: "作品展示",
    intro:
      "浏览 GenStory.cc 的模板和示例项目，打开后即可预览、试玩或下载源码继续编辑。",
    sourceZip: "源码 ZIP",
    createFromTemplate: "用此模板创建",
    downloadTemplate: "下载模板 ZIP",
    downloadingTemplate: "正在打包…",
    downloadFailed: "模板文件打包失败，请稍后再试",
    downloadCase: "下载案例 ZIP",
    preview: "预览案例",
    previewLoading: "准备预览中…",
    fork: "Fork 到本地",
    forkLoading: "创建本地项目中…",
    unsupported: "当前浏览器不支持本地项目预览",
    failed: "案例项目加载失败，请稍后再试",
    templateStatus: "当前模板",
    caseStatus: "完整案例",
    templateFilename: "下载后可从项目列表导入源码 ZIP 恢复。",
    caseFilename: "案例 ZIP 可导入为新的本地项目。",
    openPreview: "点开预览",
    modalTemplateLabel: "模板预览",
    modalCaseLabel: "案例预览",
    playablePreview: "可玩预览",
    mediaPreview: "素材预览",
    fileCount: "{count} 个文件",
    loadingPreview: "正在准备预览…",
    noMediaPreview: "这个项目暂时没有可展示的图片素材。",
    gameUnavailable: "游戏预览暂时不可用，请下载 ZIP 后本地查看。",
  },
  en: {
    heading: "Showcase",
    intro:
      "Browse GenStory.cc templates and example projects to preview, play, or download the source for further editing.",
    sourceZip: "Source ZIP",
    createFromTemplate: "Create from this template",
    downloadTemplate: "Download template ZIP",
    downloadingTemplate: "Packaging…",
    downloadFailed: "The template files could not be packaged",
    downloadCase: "Download case ZIP",
    preview: "Preview case",
    previewLoading: "Preparing preview…",
    fork: "Fork locally",
    forkLoading: "Creating project…",
    unsupported: "This browser cannot preview local projects",
    failed: "The case project could not be loaded",
    templateStatus: "Current template",
    caseStatus: "Complete case",
    templateFilename: "The source ZIP can be imported from the project list later.",
    caseFilename: "The case ZIP can be imported as a new local project.",
    openPreview: "Open preview",
    modalTemplateLabel: "Template preview",
    modalCaseLabel: "Case preview",
    playablePreview: "Playable preview",
    mediaPreview: "Media preview",
    fileCount: "{count} files",
    loadingPreview: "Preparing preview…",
    noMediaPreview: "This project has no image media to show yet.",
    gameUnavailable: "The game preview is unavailable. Download the ZIP to inspect it locally.",
  },
} satisfies Record<PublicLang, Record<string, string>>;

export function PublicShowcasePage({ lang }: { lang: PublicLang }) {
  const copy = showcaseCopy[lang];

  return (
    <main
      lang={languageInfo[lang].htmlLang}
      className="overflow-hidden bg-[#fbfaff] text-[#17152d]"
    >
      <ShowcaseGallery lang={lang} copy={copy} />
    </main>
  );
}
