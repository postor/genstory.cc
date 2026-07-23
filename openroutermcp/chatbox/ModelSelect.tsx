"use client";

// Model picker built as a proper dropdown (shadcn Popover + Base UI): a trigger
// button shows the selected model and the panel opens on click, closing on
// selection, outside-click, or Escape. The panel has a client-side filter and
// keyboard navigation (ArrowUp/Down move the highlight, Enter/Space select).

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ExternalLink, Loader2 } from "lucide-react";
import type { ModelInfo } from "@/lib/openrouter";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ModelSelectProps {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

function formatPricePerMillion(value?: string): string | null {
  if (value === undefined) return null;
  const price = Number(value) * 1_000_000;
  if (!Number.isFinite(price)) return null;
  return price === 0 ? "$0" : `$${price < 0.01 ? price.toFixed(4) : price.toFixed(2)}`;
}

function modelPriceLabel(model: ModelInfo): string | null {
  const prompt = formatPricePerMillion(model.pricing?.prompt);
  const completion = formatPricePerMillion(model.pricing?.completion);
  if (!prompt && !completion) return null;
  return `In ${prompt ?? "-"} / Out ${completion ?? "-"} per 1M tokens`;
}

export function ModelSelect({ models, value, onChange, loading, disabled }: ModelSelectProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = useMemo(
    () =>
      models.filter((m) =>
        `${m.name} ${m.id}`.toLowerCase().includes(filter.toLowerCase())
      ),
    [models, filter]
  );

  const selected = useMemo(() => models.find((m) => m.id === value), [models, value]);

  // When the panel opens, start the highlight on the current selection and
  // focus the filter input.
  useEffect(() => {
    if (!open) return;
    const idx = filtered.findIndex((m) => m.id === value);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(idx >= 0 ? idx : 0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, filtered, value]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
    setFilter("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== inputRef.current) return;
    if (disabled || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const m = filtered[activeIndex];
      if (m) select(m.id);
    }
  };

  const triggerLabel = loading
    ? t("chat.modelLoading")
    : selected
      ? selected.name
      : t("chat.modelSelect");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal"
            aria-label={t("chat.modelSelectLabel")}
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="size-4 opacity-60" />
        )}
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="start" sideOffset={4} className="w-80">
          <PopoverPopup onKeyDown={handleKeyDown}>
            <div className="relative mb-2">
              <Input
                ref={inputRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("chat.modelFilter")}
                aria-label={t("chat.modelFilterLabel")}
              />
            </div>
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">{t("chat.noMatchingModels")}</p>
            ) : (
              <ScrollArea className="h-56 rounded-md">
                <ul className="flex flex-col">
                  {filtered.map((m, i) => {
                    const isActive = i === activeIndex;
                    const priceLabel = modelPriceLabel(m);
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          ref={(el) => {
                            itemRefs.current[i] = el;
                          }}
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => select(m.id)}
                          className={
                            "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm outline-none transition-colors " +
                            (isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent hover:text-accent-foreground")
                          }
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{m.name}</span>
                            {priceLabel ? (
                              <span className="block truncate text-[10px] opacity-65">
                                {priceLabel}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
            <div className="mt-2 border-t px-1 pt-2 text-xs text-muted-foreground">
              <span>{t("chat.modelBenchmarkHint")} </span>
              <a
                href="https://openrouter.ai/rankings#benchmarks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
              >
                {t("chat.modelBenchmarkLink")}
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </div>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
