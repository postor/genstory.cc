"use client";

import { useContext } from "react";
import {
  OpenRouterMcpContext,
  type OpenRouterMcpContextValue,
} from "@/lib/openrouter-provider/OpenRouterMcpProvider";

export function useOpenRouterMcp(): OpenRouterMcpContextValue {
  const ctx = useContext(OpenRouterMcpContext);
  if (!ctx) throw new Error("useOpenRouterMcp 必须在 <OpenRouterMcpProvider> 内使用");
  return ctx;
}
