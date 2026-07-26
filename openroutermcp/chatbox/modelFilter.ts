export interface SearchableModel {
  id: string;
  name: string;
}

export function normalizeModelSearchText(text: string): string {
  return text.replace(/[\s\p{P}]/gu, "").toLowerCase();
}

export function modelMatchesFilter(model: SearchableModel, filter: string): boolean {
  const filterNeedle = normalizeModelSearchText(filter);
  if (!filterNeedle) return true;
  return [model.name, model.id, `${model.name} ${model.id}`].some((value) =>
    normalizeModelSearchText(value).includes(filterNeedle)
  );
}
