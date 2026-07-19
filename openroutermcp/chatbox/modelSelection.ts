import type { ModelInfo } from "@/lib/openrouter";

function isFreeModel(model: ModelInfo): boolean {
  return model.name.toLowerCase().includes("(free)") || model.id.toLowerCase().includes(":free");
}

export function pickInitialModelId(models: ModelInfo[], preferredId: string): string {
  if (preferredId && models.some((model) => model.id === preferredId)) {
    return preferredId;
  }

  return models.find(isFreeModel)?.id ?? models[0]?.id ?? "";
}
