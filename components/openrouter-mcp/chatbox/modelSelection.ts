import type { ModelInfo } from "@/lib/openrouter";

const PREFERRED_MODEL_NAME = "free models router";

export interface ModelSelectionPreferences {
  chatModelId?: string;
  globalModelId?: string;
}

function findAvailableModelId(models: ModelInfo[], preferredId?: string): string {
  if (!preferredId) return "";
  return models.some((model) => model.id === preferredId) ? preferredId : "";
}

export function pickInitialModelId(
  models: ModelInfo[],
  preferences: ModelSelectionPreferences
): string {
  return (
    findAvailableModelId(models, preferences.chatModelId) ||
    findAvailableModelId(models, preferences.globalModelId) ||
    models.find((model) => model.name.trim().toLowerCase() === PREFERRED_MODEL_NAME)?.id ||
    models[0]?.id ||
    ""
  );
}
