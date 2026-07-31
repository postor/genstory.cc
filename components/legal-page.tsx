"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Sparkles } from "lucide-react";

import { useLang } from "@/lib/i18n";

type LegalPageKind = "terms" | "privacy" | "ai";

const pageCopy = {
  zh: {
    terms: {
      title: "服务条款",
      lead: "使用 GenStory.cc 创建、编辑、预览、导出或同步作品，即表示你同意以下使用边界。",
      sections: [
        ["服务范围", "GenStory.cc 提供浏览器内的本地优先创作工作台。作品文件默认保存在当前设备的浏览器中；部分功能会连接你主动选择的第三方模型、云盘或其他服务。"],
        ["你的内容与责任", "你应确保上传、输入、生成后发布或导出的文字、图片、音视频、代码、角色和其他素材拥有必要权利，并遵守适用法律及第三方服务规则。"],
        ["AI 与第三方服务", "AI 助手和生成服务可能返回错误、重复、相似或不适合发布的结果。你需要在使用、公开发布或商业化前自行审核，并承担对最终作品的判断和使用责任。"],
        ["本地存储与备份", "清除网站数据、切换浏览器或更换设备可能使本地作品无法恢复。请定期下载源码 ZIP，或主动同步到你控制的云盘。"],
        ["服务可用性", "服务、模板、预览引擎和第三方接口可能发生变更、中断或失败。除适用法律要求外，服务按现状提供，不保证始终可用、无错误或满足特定用途。"],
        ["条款变更", "我们可能根据功能、法律或服务变化更新本条款。重大变更会在需要时重新请求确认。问题可通过页脚邮箱联系。"],
      ],
    },
    privacy: {
      title: "隐私说明",
      lead: "GenStory.cc 采用本地优先设计：你的项目正文和素材默认留在当前浏览器中。",
      sections: [
        ["默认保存位置", "项目索引保存在浏览器的 IndexedDB，项目正文和资产保存在浏览器的 OPFS。创建项目不会自动把项目文件上传到 GenStory.cc 服务器。"],
        ["你主动连接的服务", "当你使用 AI 助手、自定义 AI API、云盘同步或其他外部能力时，完成该操作所需的内容会发送给你选择的服务。该服务的隐私政策和条款也适用。"],
        ["浏览与统计", "站点可能处理必要的页面访问、错误和匿名统计信息，用于维护功能与了解使用情况。不要在不确定第三方处理规则时输入机密、个人敏感信息或未公开素材。"],
        ["你的控制权", "你可以下载、导入、删除本地项目，也可以在设置中断开云盘授权。清除浏览器网站数据前，请先导出备份。"],
        ["联系我们", "如果你发现隐私或数据处理问题，请通过页脚显示的邮箱联系，并说明相关页面和操作。"],
      ],
    },
    ai: {
      title: "AI 使用说明",
      lead: "AI 是可选的创作辅助，不是事实核验、法律审核或最终发布决策的替代品。",
      sections: [
        ["发送什么内容", "你主动发送消息或发起生成时，系统可能把消息、当前项目概况，以及完成请求所需的项目内容发送给所选模型服务。未使用 AI 时，项目仍可在本地编辑。"],
        ["输出不保证唯一或准确", "模型可能生成错误事实、相似表达、意外风格或不完整代码。请在公开发布、商业使用、导出或交付前进行人工审核和必要的权利核查。"],
        ["输入内容的边界", "不要提交你无权处理的个人信息、机密资料、未公开商业信息或受限制的素材；使用自定义 API 时，也请确认该服务允许浏览器端请求和相应的数据处理方式。"],
        ["第三方规则", "OpenRouter、模型提供商、自定义 API 和图片/视频服务可能有各自的模型限制、留存规则、价格和使用条款。你需要同时遵守这些规则。"],
        ["生成资产的保存", "生成任务完成后，只有在你明确保存、导出或写入项目时，较大的二进制结果才会进入本地项目。任务 URL 不应被当作项目资产永久引用。"],
      ],
    },
  },
  en: {
    terms: {
      title: "Terms of Service",
      lead: "By creating, editing, previewing, exporting, or syncing a work in GenStory.cc, you agree to these boundaries.",
      sections: [
        ["Service scope", "GenStory.cc is a browser-based, local-first creative workspace. Work files stay in this browser by default; some features connect to model, cloud-drive, or other services that you choose to use."],
        ["Your content and responsibility", "You are responsible for having the rights needed for text, images, audio, video, code, characters, and other material that you upload, enter, generate, publish, or export, and for following applicable laws and third-party rules."],
        ["AI and third-party services", "AI assistants and generation services may return inaccurate, repetitive, similar, or unsuitable results. Review them before use, publication, or commercialization, and make the final decision about your work."],
        ["Local storage and backups", "Clearing site data, changing browsers, or changing devices may make local work unavailable. Download source ZIP backups regularly or sync deliberately to a cloud drive you control."],
        ["Availability", "The service, templates, preview engines, and third-party APIs may change, fail, or become unavailable. Except where required by law, the service is provided as-is without a promise of uninterrupted or error-free operation."],
        ["Changes", "We may update these terms when features, laws, or services change. Material changes may require renewed confirmation. Contact us through the email in the footer."],
      ],
    },
    privacy: {
      title: "Privacy Notice",
      lead: "GenStory.cc is designed local-first: your project text and assets stay in this browser by default.",
      sections: [
        ["Default storage", "Project indexes are stored in IndexedDB, while project text and assets are stored in the browser's OPFS. Creating a project does not automatically upload its files to GenStory.cc servers."],
        ["Services you choose", "When you use an AI assistant, custom AI API, cloud sync, or another external capability, the content needed for that action is sent to the service you selected. That service's privacy notice and terms also apply."],
        ["Visits and analytics", "The site may process necessary page visits, errors, and aggregate analytics to maintain features and understand usage. Do not enter confidential, sensitive personal, or unreleased material when a provider's handling rules are unclear."],
        ["Your controls", "You can download, import, and delete local projects, and disconnect cloud authorization in Settings. Export a backup before clearing browser site data."],
        ["Contact", "For privacy or data-handling questions, use the email in the footer and include the relevant page and action."],
      ],
    },
    ai: {
      title: "AI Use Notice",
      lead: "AI is optional creative assistance, not a replacement for fact checking, legal review, or final publishing decisions.",
      sections: [
        ["What may be sent", "When you send a message or start a generation task, the system may send your message, a project summary, and the project content needed for that request to the selected model service. You can still edit locally without using AI."],
        ["Outputs are not guaranteed", "Models can produce incorrect facts, similar expression, unexpected styles, or incomplete code. Review and check rights before public release, commercial use, export, or delivery."],
        ["Input boundaries", "Do not submit personal information, confidential material, unreleased business information, or restricted assets you are not allowed to process. With a custom API, confirm that browser requests and its data practices are acceptable to you."],
        ["Third-party rules", "OpenRouter, model providers, custom APIs, and image/video services may have their own limits, retention rules, pricing, and terms. You must follow those rules as well."],
        ["Saving generated assets", "Large binary results enter the local project only when you explicitly save, export, or write them into the project. A job URL should not be treated as a permanent project asset reference."],
      ],
    },
  },
} as const;

const pageIcons = {
  terms: FileText,
  privacy: ShieldCheck,
  ai: Sparkles,
};

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const { lang } = useLang();
  const copy = pageCopy[lang][kind];
  const Icon = pageIcons[kind];

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[linear-gradient(180deg,rgba(247,243,255,0.84)_0%,rgba(255,255,255,0.92)_38%,rgba(251,250,255,0.96)_100%)] text-[#121331]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,162,255,0.28),transparent_40%)]" />
      <div className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6f45dc] hover:text-[#4c27ba]"
        >
          <ArrowLeft className="size-4" />
          {lang === "zh" ? "返回首页" : "Back to home"}
        </Link>

        <header className="mt-8 border-b border-[#e8e3f7] pb-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eee7ff] text-[#7951dd] shadow-[0_10px_24px_rgba(92,75,160,0.08)]">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#252047] sm:text-4xl">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b6a89] sm:text-base">
                {copy.lead}
              </p>
            </div>
          </div>
        </header>

        <article className="divide-y divide-[#eeeafd]">
          {copy.sections.map(([title, body]) => (
            <section
              key={title}
              className="grid gap-2 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8"
            >
              <h2 className="text-base font-semibold text-[#372272]">{title}</h2>
              <p className="text-sm leading-7 text-[#6b6a89]">{body}</p>
            </section>
          ))}
        </article>

        <div className="mt-8 rounded-2xl border border-[#e6e0ff] bg-[#f1edff] px-5 py-4 text-sm leading-6 text-[#6c5c9a] shadow-[0_12px_30px_rgba(93,65,198,0.08)]">
          {lang === "zh"
            ? "这些页面用于清晰说明产品边界，不替代针对具体业务、地区或发布计划的法律意见。"
            : "These pages explain product boundaries and do not replace legal advice for a specific business, jurisdiction, or release plan."}
        </div>
      </div>
    </main>
  );
}
