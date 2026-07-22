import type { ModelInfo } from "@/lib/openrouter";

const PREFERRED_FREE_MODEL_NAME = "nvidia: nemotron 3 ultra (free)";

function isFreeModel(model: ModelInfo): boolean {
  return model.name.toLowerCase().includes("(free)") || model.id.toLowerCase().includes(":free");
}

function isPreferredFreeModel(model: ModelInfo): boolean {
  return model.name.trim().toLowerCase() === PREFERRED_FREE_MODEL_NAME;
}

export function pickInitialModelId(models: ModelInfo[], preferredId: string): string {
  if (preferredId && models.some((model) => model.id === preferredId)) {
    return preferredId;
  }

  return models.find(isPreferredFreeModel)?.id ?? models.find(isFreeModel)?.id ?? models[0]?.id ?? "";
}
