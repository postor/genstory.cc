import type { Lang } from "./i18n.ts";

export const GENSTORY_MENU_CREDIT: Record<Lang, string> = {
  zh: "使用 genstory.cc 制作",
  en: "made by genstory.cc",
};

export function genstoryMenuCredit(lang: Lang): string {
  return GENSTORY_MENU_CREDIT[lang];
}

function cssString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\A ")}"`;
}

export function genstoryVNMenuCreditCss(lang: Lang): string {
  return [
    "[class*=\"_Title_buttonList_\"]::after {",
    `  content: ${cssString(genstoryMenuCredit(lang))};`,
    "  display: block;",
    "  margin: 4px 0 0 36px;",
    "  color: rgb(255 255 255 / 55%);",
    "  font: 600 12px / 1.4 Inter, system-ui, sans-serif;",
    "  letter-spacing: 0.04em;",
    "  text-shadow: 0 2px 8px rgb(0 0 0 / 55%);",
    "  transform: skew(-10deg);",
    "}",
    "",
  ].join("\n");
}
