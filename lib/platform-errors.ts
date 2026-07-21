import type { Lang } from "./i18n";

const ZH_TO_EN: Record<string, string> = {
  "当前浏览器不支持保存作品，请换用现代桌面浏览器":
    "This browser does not support saving works. Please use a modern desktop browser.",
  "当前浏览器不支持在浏览器中保存作品":
    "This browser does not support saving works in the browser.",
  "未找到 ZIP 目录，无法导入项目备份":
    "ZIP central directory not found. Could not import the project backup.",
  "ZIP 目录损坏，无法导入项目备份":
    "The ZIP central directory is corrupted. Could not import the project backup.",
  "只能导入 GenStory.cc 导出的项目备份 ZIP":
    "Only GenStory.cc-exported project backup ZIP files can be imported.",
  "ZIP 文件损坏，无法导入项目备份":
    "The ZIP file is corrupted. Could not import the project backup.",
  "项目备份包含空路径，无法恢复作品":
    "The project backup contains an empty path and cannot be restored.",
  "项目备份缺少作品信息（meta.md），无法恢复作品":
    "The project backup is missing project metadata (meta.md) and cannot be restored.",
  "项目备份缺少创作规则文件，无法恢复作品":
    "The project backup is missing the project rules file and cannot be restored.",
  "模板资产加载失败": "Failed to load template asset",
  "模板二进制文件缺少来源": "Template binary file is missing a source",
  "Phaser 运行时尚未准备好，请重新加载应用后再导出":
    "The Phaser runtime is not ready yet. Reload the app and try exporting again.",
  "Phaser 项目缺少 index.html": "The Phaser project is missing index.html.",
  "受保护资源元数据请求失败": "Protected resource metadata request failed",
  "受保护资源元数据中缺少 authorization_servers":
    "Protected resource metadata is missing authorization_servers.",
  "无法获取授权服务器元数据 (authorization server metadata)":
    "Could not fetch authorization server metadata.",
  "授权服务器不支持动态客户端注册 (registration_endpoint 缺失)":
    "The authorization server does not support dynamic client registration (registration_endpoint missing).",
  "动态客户端注册失败": "Dynamic client registration failed",
  "注册响应缺少 client_id": "The registration response is missing client_id.",
  "授权服务器缺少 authorization_endpoint":
    "The authorization server is missing authorization_endpoint.",
  "令牌交换失败": "Token exchange failed",
  "令牌刷新失败": "Token refresh failed",
  "OpenRouter 请求失败": "OpenRouter request failed",
  "OpenRouter 未返回可读取的流": "OpenRouter did not return a readable stream.",
  "OpenRouter 返回内容为空": "OpenRouter returned empty content.",
  "聊天变更只能写入文本文件": "Chat changes can only write text files",
  "文件不存在或不是文本文件": "File does not exist or is not a text file",
};

const EN_TO_ZH: Record<string, string> = {
  "This browser does not support saving works. Please use a modern desktop browser.":
    "当前浏览器不支持保存作品，请换用现代桌面浏览器",
  "This browser does not support saving works in the browser.":
    "当前浏览器不支持在浏览器中保存作品",
  "ZIP central directory not found. Could not import the project backup.":
    "未找到 ZIP 目录，无法导入项目备份",
  "The ZIP central directory is corrupted. Could not import the project backup.":
    "ZIP 目录损坏，无法导入项目备份",
  "Only GenStory.cc-exported project backup ZIP files can be imported.":
    "只能导入 GenStory.cc 导出的项目备份 ZIP",
  "The ZIP file is corrupted. Could not import the project backup.":
    "ZIP 文件损坏，无法导入项目备份",
  "The project backup contains an empty path and cannot be restored.":
    "项目备份包含空路径，无法恢复作品",
  "The project backup is missing project metadata (meta.md) and cannot be restored.":
    "项目备份缺少作品信息（meta.md），无法恢复作品",
  "The project backup is missing the project rules file and cannot be restored.":
    "项目备份缺少创作规则文件，无法恢复作品",
  "Failed to load template asset": "模板资产加载失败",
  "Template binary file is missing a source": "模板二进制文件缺少来源",
  "The Phaser runtime is not ready yet. Reload the app and try exporting again.":
    "Phaser 运行时尚未准备好，请重新加载应用后再导出",
  "The Phaser project is missing index.html.": "Phaser 项目缺少 index.html",
  "Protected resource metadata request failed": "受保护资源元数据请求失败",
  "Protected resource metadata is missing authorization_servers.":
    "受保护资源元数据中缺少 authorization_servers",
  "Could not fetch authorization server metadata.":
    "无法获取授权服务器元数据 (authorization server metadata)",
  "The authorization server does not support dynamic client registration (registration_endpoint missing).":
    "授权服务器不支持动态客户端注册 (registration_endpoint 缺失)",
  "Dynamic client registration failed": "动态客户端注册失败",
  "The registration response is missing client_id.": "注册响应缺少 client_id",
  "The authorization server is missing authorization_endpoint.":
    "授权服务器缺少 authorization_endpoint",
  "Token exchange failed": "令牌交换失败",
  "Token refresh failed": "令牌刷新失败",
  "OpenRouter request failed": "OpenRouter 请求失败",
  "OpenRouter did not return a readable stream.":
    "OpenRouter 未返回可读取的流",
  "OpenRouter returned empty content.": "OpenRouter 返回内容为空",
  "Chat changes can only write text files": "聊天变更只能写入文本文件",
  "File does not exist or is not a text file": "文件不存在或不是文本文件",
};

export function localizePlatformErrorMessage(message: string, lang: Lang): string {
  const exact = lang === "en" ? ZH_TO_EN[message] : EN_TO_ZH[message];
  if (exact) return exact;

  for (const [source, target] of Object.entries(lang === "en" ? ZH_TO_EN : EN_TO_ZH)) {
    if (message.startsWith(source)) return message.replace(source, target);
  }
  return message;
}

