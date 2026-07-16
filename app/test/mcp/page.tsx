"use client";

import { useState } from "react";
import { useOpenRouterMcp } from "@/lib/openrouter-provider/useOpenRouterMcp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatBox } from "@/openroutermcp/chatbox";

export default function McpTestPage() {
  const {
    status,
    error,
    serverUrl,
    setServerUrl,
    serverInfo,
    tools,
    isAuthorized,
    token,
    connect,
    disconnect,
    callTool,
  } = useOpenRouterMcp();

  const [selected, setSelected] = useState<string>("");
  const [argsText, setArgsText] = useState<string>("{}");
  const [callResult, setCallResult] = useState<string>("");
  const [showSecret, setShowSecret] = useState(false);

  async function handleCall(): Promise<void> {
    setCallResult("");
    if (!selected) return;
    try {
      let args: unknown = {};
      try {
        args = argsText.trim() ? JSON.parse(argsText) : {};
      } catch {
        throw new Error("参数不是合法 JSON");
      }
      const res = await callTool(selected, args);
      setCallResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setCallResult("调用失败: " + msg(e));
    }
  }

  return (
    <main className="mx-auto max-w-[820px] p-6 font-mono text-foreground">
      <h1 className="text-xl font-semibold">/test/mcp — 浏览器直连 MCP（无后端）</h1>

      <div className="my-3 rounded-lg border border-orange-300 bg-orange-50 p-3 text-[13px] leading-relaxed text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
        <strong>⚠️ 测试用途：</strong> 本页使用 <code>OpenRouterMcpProvider</code> 管理 OAuth
        授权，令牌（secret）默认存于浏览器 localStorage，<strong>任何能执行 JS 的脚本（含 XSS）都可读取</strong>。
        仅用于验证「无后端、SSG、localStorage 存 secret」是否可行，<strong>不要用于生产</strong>。
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder="MCP 服务器 URL"
          className="min-w-[280px] flex-1"
        />
        <Button onClick={() => void connect()} disabled={status === "connecting"}>
          {isAuthorized ? "连接（用已存令牌）" : "连接 / 登录"}
        </Button>
        <Button variant="destructive" onClick={disconnect}>
          断开 / 清除凭证
        </Button>
      </div>

      <div className="mb-3 text-[13px]">
        状态：<b>{status}</b>
        {isAuthorized && (
          <Button variant="link" className="h-auto p-0 pl-2.5 text-[13px]" onClick={() => setShowSecret((v) => !v)}>
            {showSecret ? "隐藏 localStorage 中的 secret" : "查看 localStorage 中的 secret"}
          </Button>
        )}
      </div>

      {showSecret && token && (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[12px] text-emerald-200">
          {JSON.stringify(token, null, 2)}
        </pre>
      )}

      {serverInfo != null && (
        <section className="mb-4">
          <h2 className="mb-1.5 mt-3 text-[15px] font-semibold">initialize 响应</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[12px] text-zinc-200">
            {JSON.stringify(serverInfo, null, 2)}
          </pre>
        </section>
      )}

      {tools.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-1.5 mt-3 text-[15px] font-semibold">工具列表（{tools.length}）</h2>
          <div className="mb-2 flex flex-wrap gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {tools.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button onClick={() => void handleCall()}>调用工具</Button>
          </div>
          {selected && (
            <p className="mb-2 text-xs text-muted-foreground">
              {tools.find((t) => t.name === selected)?.description || "（无描述）"}
            </p>
          )}
          <Textarea
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            rows={4}
            placeholder='调用参数 JSON，例如 {}'
          />
          {callResult && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[12px] text-zinc-200">
              {callResult}
            </pre>
          )}
        </section>
      )}

      {error && (
        <pre className="mb-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </pre>
      )}

      <hr className="my-6 border-t border-border" />

      <ChatBox />

      <p className="mt-4 text-xs text-muted-foreground">
        流程：连接 → 若服务器返回 401，则在浏览器内走 OAuth(PKCE) →
        回调本页用 code 换令牌 → 存 localStorage → 重新 initialize 并列出工具。
        若授权服务器不允许网页回调（redirect_uri 非 https/非 loopback）或 CORS 拦截，
        上方会以红色错误明确展示原因。聊天组件在初始化时尝试连接；未授权会弹出确认框，
        取消则保持禁用，点击组件任意位置可重新触发授权。
      </p>
    </main>
  );
}

function msg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
