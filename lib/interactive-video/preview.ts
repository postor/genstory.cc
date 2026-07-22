import { listProjectFiles, readTextFile } from "../file-system/browser.ts";

export interface InteractiveVideoAsset {
  id: string;
  type: string;
  name: string;
  path: string;
}

export interface InteractiveVideoTimelineEvent {
  at: number;
  videoId?: string;
  voiceId?: string;
  caption?: string;
  choiceId?: string;
}

export interface InteractiveVideoChoiceOption {
  label: string;
  next: string;
}

export interface InteractiveVideoChoice {
  id: string;
  prompt: string;
  options: InteractiveVideoChoiceOption[];
}

export interface InteractiveVideoSegment {
  id: string;
  path: string;
  title: string;
  body: string;
  timeline: InteractiveVideoTimelineEvent[];
  choices: InteractiveVideoChoice[];
}

export interface InteractiveVideoPreviewModel {
  type: "interactive-video";
  title: string;
  startSegmentId: string;
  assets: Record<string, InteractiveVideoAsset>;
  segments: InteractiveVideoSegment[];
}

function scalar(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function frontmatter(text: string): Record<string, string> {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => {
        const index = line.indexOf(":");
        return index < 0
          ? null
          : [line.slice(0, index).trim(), scalar(line.slice(index + 1))];
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  );
}

function heading(text: string): string | undefined {
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/^#\s+(.+)$/)?.[1]?.trim())
    .find(Boolean);
}

function itemKeyValue(line: string): [string, string] | null {
  const match = line.match(/^\s*(?:-\s+)?([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
  return match ? [match[1], scalar(match[2])] : null;
}

function parseAssets(text: string): Record<string, InteractiveVideoAsset> {
  const assets: Record<string, InteractiveVideoAsset> = {};
  let current: Partial<InteractiveVideoAsset> | null = null;

  function finish() {
    if (!current?.id || !current.path) return;
    assets[current.id] = {
      id: current.id,
      type: current.type ?? "Asset",
      name: current.name ?? current.id,
      path: current.path.startsWith("assets/")
        ? current.path
        : `assets/${current.path}`,
    };
  }

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*-\s+id:/.test(line)) {
      finish();
      current = {};
    }
    if (!current) continue;
    const pair = itemKeyValue(line);
    if (!pair) continue;
    const [key, value] = pair;
    if (key === "id") current.id = value;
    if (key === "type") current.type = value;
    if (key === "name") current.name = value;
    if (key === "file") current.path = value;
  }
  finish();
  return assets;
}

function parseTimeline(text: string): InteractiveVideoTimelineEvent[] {
  const events: InteractiveVideoTimelineEvent[] = [];
  let current: InteractiveVideoTimelineEvent | null = null;

  function finish() {
    if (current) events.push(current);
  }

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*-\s+at:/.test(line)) {
      finish();
      const pair = itemKeyValue(line);
      current = { at: Number(pair?.[1] ?? 0) || 0 };
      continue;
    }
    if (!current) continue;
    const pair = itemKeyValue(line);
    if (!pair) continue;
    const [key, value] = pair;
    if (key === "video") current.videoId = value;
    if (key === "voice") current.voiceId = value;
    if (key === "caption") current.caption = value;
    if (key === "choice") current.choiceId = value;
  }
  finish();
  return events.sort((a, b) => a.at - b.at);
}

function parseChoices(text: string): InteractiveVideoChoice[] {
  const choices: InteractiveVideoChoice[] = [];
  let currentChoice: InteractiveVideoChoice | null = null;
  let currentOption: Partial<InteractiveVideoChoiceOption> | null = null;

  function finishOption() {
    if (!currentChoice || !currentOption?.label || !currentOption.next) return;
    currentChoice.options.push({
      label: currentOption.label,
      next: currentOption.next,
    });
  }

  function finishChoice() {
    finishOption();
    currentOption = null;
    if (currentChoice?.id) choices.push(currentChoice);
  }

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*-\s+id:/.test(line)) {
      finishChoice();
      const pair = itemKeyValue(line);
      currentChoice = {
        id: pair?.[1] ?? "",
        prompt: "",
        options: [],
      };
      continue;
    }
    if (!currentChoice) continue;
    if (/^\s*-\s+label:/.test(line)) {
      finishOption();
      const pair = itemKeyValue(line);
      currentOption = { label: pair?.[1] ?? "" };
      continue;
    }
    const pair = itemKeyValue(line);
    if (!pair) continue;
    const [key, value] = pair;
    if (currentOption && key === "next") currentOption.next = value;
    else if (key === "prompt") currentChoice.prompt = value;
  }
  finishChoice();
  return choices;
}

export function parseInteractiveVideoSource(
  files: Record<string, string>
): InteractiveVideoPreviewModel {
  const projectMeta = files["meta.md"] ?? "";
  const title = frontmatter(projectMeta).title || heading(projectMeta) || "Untitled";
  const assets = parseAssets(files["assets/index.yml"] ?? "");
  const segmentIds = Object.keys(files)
    .map((path) => path.match(/^chapter-[^/]+\/segments\/([^/]+)\/script\.md$/i)?.[1])
    .filter((id): id is string => Boolean(id))
    .sort((a, b) => a.localeCompare(b));

  const segments = segmentIds.map((id) => {
    const basePath = Object.keys(files).find((path) =>
      path.endsWith(`/segments/${id}/script.md`)
    );
    const segmentRoot = basePath?.replace(/script\.md$/i, "") ?? "";
    const meta = files[`${segmentRoot}meta.md`] ?? "";
    const body = files[`${segmentRoot}script.md`] ?? "";
    return {
      id,
      path: `${segmentRoot}script.md`,
      title: frontmatter(meta).title || heading(body) || id,
      body,
      timeline: parseTimeline(files[`${segmentRoot}timeline.yml`] ?? ""),
      choices: parseChoices(files[`${segmentRoot}choices.yml`] ?? ""),
    };
  });

  const startSegmentId =
    segmentIds.find((id) => id === "start") ??
    segmentIds.find((id) => id === "segment-001") ??
    segmentIds[0] ??
    "";

  return {
    type: "interactive-video",
    title,
    startSegmentId,
    assets,
    segments,
  };
}

export async function readInteractiveVideoPreviewFromDirectory(
  root: FileSystemDirectoryHandle
): Promise<InteractiveVideoPreviewModel> {
  const entries = await listProjectFiles(root);
  const paths = entries
    .filter((entry) => entry.kind === "file")
    .map((entry) => entry.path)
    .filter(
      (path) =>
        path === "meta.md" ||
        path === "assets/index.yml" ||
        /^chapter-[^/]+\/segments\/[^/]+\/(meta|script|timeline|choices)\.ya?ml$/i.test(path) ||
        /^chapter-[^/]+\/segments\/[^/]+\/(meta|script)\.md$/i.test(path)
    );
  const files = Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => {
        try {
          return [path, await readTextFile(root, path)] as const;
        } catch {
          return [path, ""] as const;
        }
      })
    )
  );
  return parseInteractiveVideoSource(files);
}
