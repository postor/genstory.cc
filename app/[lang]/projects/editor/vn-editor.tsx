"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import type { VNProject, VNScene, VNAsset, AssetType } from "@/lib/vn/types";

const positionLabelKeys = {
  left: "vn.left",
  center: "vn.center",
  right: "vn.right",
} as const;

function uid(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function VNEditor({
  vn,
  onChange,
  selectedSceneId,
  onSceneSelect,
  showSceneList = true,
}: {
  vn: VNProject;
  onChange: (vn: VNProject) => void;
  selectedSceneId?: string | null;
  onSceneSelect?: (sceneId: string) => void;
  showSceneList?: boolean;
}) {
  const { t } = useLang();
  const scenes = useMemo(
    () => vn.chapters.flatMap((c) => c.scenes.map((s) => ({ chapter: c, scene: s }))),
    [vn]
  );
  const [internalSelected, setInternalSelected] = useState<string | null>(
    scenes[0]?.scene.id ?? null
  );

  const selected = selectedSceneId ?? internalSelected;
  const effectiveSelected =
    selected && scenes.some((x) => x.scene.id === selected)
      ? selected
      : scenes[0]?.scene.id ?? null;
  const current =
    scenes.find((x) => x.scene.id === effectiveSelected)?.scene ?? null;

  function selectScene(sceneId: string) {
    setInternalSelected(sceneId);
    onSceneSelect?.(sceneId);
  }

  function patchScene(sceneId: string, patch: Partial<VNScene>) {
    onChange({
      ...vn,
      chapters: vn.chapters.map((c) => ({
        ...c,
        scenes: c.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
      })),
    });
  }

  function addChapter() {
    onChange({
      ...vn,
      chapters: [
        ...vn.chapters,
        { id: `chapter-${uid()}`, title: t("vn.newChapter"), scenes: [] },
      ],
    });
  }

  function addScene() {
    const target = vn.chapters[0];
    if (!target) return;
    const id = `scene-${uid()}`;
    const scene: VNScene = { id, title: t("vn.newScene"), characters: [], script: "" };
    onChange({
      ...vn,
      chapters: vn.chapters.map((c) =>
        c.id === target.id ? { ...c, scenes: [...c.scenes, scene] } : c
      ),
    });
    selectScene(id);
  }

  function removeScene(sceneId: string) {
    const next: VNProject = {
      ...vn,
      chapters: vn.chapters
        .map((c) => ({
          ...c,
          scenes: c.scenes.filter((s) => s.id !== sceneId),
        }))
        .filter((c) => c.scenes.length > 0 || c.id !== vn.chapters[0].id),
    };
    onChange(next);
    if (selected === sceneId) {
      const flat = next.chapters.flatMap((c) => c.scenes);
      if (flat[0]) selectScene(flat[0].id);
    }
  }

  function addCharacter(sceneId: string) {
    const scene = scenes.find((x) => x.scene.id === sceneId)?.scene;
    if (!scene) return;
    patchScene(sceneId, {
      characters: [
        ...scene.characters,
        { id: vn.assets[0]?.id ?? "", position: "left" },
      ],
    });
  }

  function patchCharacter(sceneId: string, idx: number, patch: Record<string, unknown>) {
    const scene = scenes.find((x) => x.scene.id === sceneId)?.scene;
    if (!scene) return;
    patchScene(sceneId, {
      characters: scene.characters.map((c, i) =>
        i === idx ? { ...c, ...patch } : c
      ),
    });
  }

  function removeCharacter(sceneId: string, idx: number) {
    const scene = scenes.find((x) => x.scene.id === sceneId)?.scene;
    if (!scene) return;
    patchScene(sceneId, {
      characters: scene.characters.filter((_, i) => i !== idx),
    });
  }

  function patchAsset(id: string, patch: Partial<VNAsset>) {
    onChange({
      ...vn,
      assets: vn.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }

  function removeAsset(id: string) {
    onChange({ ...vn, assets: vn.assets.filter((a) => a.id !== id) });
  }

  return (
    <div
      className={
        showSceneList
          ? "grid h-full min-h-0 grid-cols-1 lg:grid-cols-[260px_1fr_340px]"
          : "grid h-full min-h-0 grid-cols-1 lg:grid-cols-[1fr_340px]"
      }
    >
      {/* left: chapters / scenes */}
      {showSceneList && (
        <VNSceneList
          vn={vn}
          selectedSceneId={selected}
          onSceneSelect={selectScene}
          onAddChapter={addChapter}
          onAddScene={addScene}
        />
      )}

      {/* center: scene editor */}
      <section className="min-h-0 overflow-auto p-4">
        {!current ? (
          <p className="text-sm text-muted-foreground">{t("vn.noScenes")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={current.title}
                onChange={(e) => patchScene(current.id, { title: e.target.value })}
                className="max-w-xs"
                aria-label={t("vn.sceneTitle")}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeScene(current.id)}
                aria-label={t("projects.delete")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t("vn.background")}</Label>
              <select
                value={current.background ?? ""}
                onChange={(e) =>
                  patchScene(current.id, { background: e.target.value || undefined })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {vn.assets
                  .filter((a) => a.type === "Background")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("vn.characters")}</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addCharacter(current.id)}
                >
                  <Plus className="size-4" />
                  {t("vn.addCharacter")}
                </Button>
              </div>
              <div className="space-y-2">
                {current.characters.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select
                      value={c.id}
                      onChange={(e) =>
                        patchCharacter(current.id, i, { id: e.target.value })
                      }
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {vn.assets
                        .filter((a) => a.type === "Character")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                    <div className="flex overflow-hidden rounded-md border border-border">
                      {(["left", "center", "right"] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => patchCharacter(current.id, i, { position: pos })}
                          className={`px-2 py-1.5 text-xs ${
                            c.position === pos
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {t(positionLabelKeys[pos])}
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCharacter(current.id, i)}
                      aria-label={t("projects.delete")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("vn.script")}</Label>
              <Textarea
                value={current.script}
                onChange={(e) => patchScene(current.id, { script: e.target.value })}
                className="min-h-[260px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{t("vn.scriptHint")}</p>
            </div>
          </div>
        )}
      </section>

      {/* right: assets */}
      <aside className="min-h-0 overflow-auto border-t border-border p-4 lg:border-l lg:border-t-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("vn.assets")}
          </span>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("vn.assetsHint")}</p>
        <div className="space-y-2">
          {vn.assets.map((a) => (
            <div key={a.id} className="rounded-md border border-border p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{a.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAsset(a.id)}
                  aria-label={t("projects.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={a.type}
                  onChange={(e) =>
                    patchAsset(a.id, { type: e.target.value as AssetType })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  <option value="Background">Background</option>
                  <option value="Character">Character</option>
                  <option value="CG">CG</option>
                </select>
                <Input
                  value={a.file}
                  onChange={(e) => patchAsset(a.id, { file: e.target.value })}
                  className="h-8 w-32 text-xs"
                  aria-label={t("vn.assetFile")}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export function VNSceneList({
  vn,
  selectedSceneId,
  onSceneSelect,
  onAddChapter,
  onAddScene,
}: {
  vn: VNProject;
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onAddChapter: () => void;
  onAddScene: () => void;
}) {
  const { t } = useLang();

  return (
    <div className="min-h-0 overflow-auto border-b border-border p-2 lg:border-b-0 lg:border-r">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("vn.scenes")}
        </span>
      </div>
      <div className="space-y-3">
        {vn.chapters.map((ch) => (
          <div key={ch.id}>
            <div className="flex items-center justify-between px-1 py-1">
              <span className="truncate text-sm font-medium">{ch.title}</span>
            </div>
            <div className="space-y-1 pl-2">
              {ch.scenes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSceneSelect(s.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                    selectedSceneId === s.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={onAddChapter}>
          <Plus className="size-4" />
          {t("vn.addChapter")}
        </Button>
        <Button size="sm" variant="outline" onClick={onAddScene}>
          <Plus className="size-4" />
          {t("vn.addScene")}
        </Button>
      </div>
    </div>
  );
}
