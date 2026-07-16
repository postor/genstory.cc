"use client";

// Model picker with a client-side filter and a loading state.
// Filter input uses the shadcn Input; the option list is a custom control
// (no shadcn primitive for a filtered select) styled with Tailwind utilities.

import { useState } from "react";
import type { ModelInfo } from "@/lib/openrouter";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export interface ModelSelectProps {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ModelSelect({ models, value, onChange, loading, disabled }: ModelSelectProps) {
  const [filter, setFilter] = useState("");
  const filtered = models.filter((m) =>
    `${m.name} ${m.id}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="筛选模型…"
          disabled={disabled}
          aria-label="筛选模型"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {loading ? (
        <p className="px-1 text-sm text-muted-foreground">模型加载中…</p>
      ) : filtered.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">无匹配模型</p>
      ) : (
        <ScrollArea className="h-40 rounded-md border">
          <ul className="flex flex-col">
            {filtered.map((m) => {
              const selected = m.id === value;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(m.id)}
                    className={
                      "w-full px-3 py-2 text-left text-sm transition-colors " +
                      (selected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground") +
                      (disabled ? " cursor-not-allowed opacity-50" : "")
                    }
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="ml-1 text-xs opacity-70">{m.id}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
