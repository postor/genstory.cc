import Link from "next/link";
import { useId } from "react";

export function LegalConsentCheckbox({
  lang,
  checked,
  onChange,
}: {
  lang: "zh" | "en";
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const inputId = useId();

  return (
    <div className="rounded-xl border border-[#e8e0ff] bg-[#fbfaff] px-3.5 py-3">
      <label
        htmlFor={inputId}
        className="flex items-start gap-3 text-xs leading-5 text-[#6d6689]"
      >
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[#8754ff]"
        />
        <span>
          {lang === "zh"
            ? "创建作品前，请确认你已阅读并同意"
            : "Before creating a work, confirm that you have read and agree to"}{" "}
          <Link
            href="/terms"
            target="_blank"
            className="font-semibold text-[#6f45dc] underline decoration-[#cfc0ff] underline-offset-2 hover:text-[#4c27ba]"
          >
            {lang === "zh" ? "服务条款" : "Terms of Service"}
          </Link>
          {lang === "zh" ? "、" : " and "}
          <Link
            href="/privacy"
            target="_blank"
            className="font-semibold text-[#6f45dc] underline decoration-[#cfc0ff] underline-offset-2 hover:text-[#4c27ba]"
          >
            {lang === "zh" ? "隐私说明" : "Privacy"}
          </Link>
          {lang === "zh" ? "和" : " and "}
          <Link
            href="/ai-disclosure"
            target="_blank"
            className="font-semibold text-[#6f45dc] underline decoration-[#cfc0ff] underline-offset-2 hover:text-[#4c27ba]"
          >
            {lang === "zh" ? "AI 使用说明" : "AI Use Notice"}
          </Link>
          {lang === "zh" ? "。" : "."}
        </span>
      </label>
      <p className="mt-2 pl-7 text-[11px] leading-5 text-[#918ca8]">
        {lang === "zh"
          ? "作品默认只保存在当前浏览器；只有你主动使用 AI 或云盘同步时，相关内容才会发送给所选服务。"
          : "Works stay in this browser by default. Content is sent to a selected service only when you use AI or cloud sync."}
      </p>
    </div>
  );
}
