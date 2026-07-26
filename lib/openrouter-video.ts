// Browser-side OpenRouter video generation helpers.
//
// OpenRouter video generation is asynchronous: POST /videos creates a job,
// GET /videos/{jobId} polls it, and completed jobs expose either unsigned_urls
// or the authenticated /videos/{jobId}/content endpoint for the raw MP4 bytes.

const OR_BASE = "https://openrouter.ai/api/v1";
const OR_ORIGIN = "https://openrouter.ai";

export type OpenRouterVideoStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface OpenRouterVideoModelInfo {
  id: string;
  name?: string;
  supported_durations?: number[];
  supported_resolutions?: string[];
  supported_aspect_ratios?: string[];
}

export interface OpenRouterVideoRequest {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  generate_audio?: boolean;
  image_url?: string;
}

export interface OpenRouterVideoJob {
  id: string;
  polling_url?: string;
  status: OpenRouterVideoStatus;
  error?: string;
  generation_id?: string;
  unsigned_urls?: string[];
  usage?: {
    cost?: number | null;
    is_byok?: boolean;
  };
}

function openRouterHeaders(token?: string, contentType?: string): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { error?: { message?: string } };
    return json.error?.message || text.slice(0, 500) || response.statusText;
  } catch {
    return text.slice(0, 500) || response.statusText;
  }
}

function normalizeOpenRouterUrl(url: string): string {
  return new URL(url, url.startsWith("/") ? OR_ORIGIN : OR_BASE).toString();
}

export async function listOpenRouterVideoModels(
  token?: string
): Promise<OpenRouterVideoModelInfo[]> {
  const response = await fetch(`${OR_BASE}/videos/models`, {
    headers: openRouterHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter 视频模型列表请求失败 (${response.status}): ${await parseError(response)}`);
  }
  const json = (await response.json()) as { data?: OpenRouterVideoModelInfo[] };
  return Array.isArray(json.data) ? json.data : [];
}

export async function submitOpenRouterVideo(
  token: string,
  request: OpenRouterVideoRequest
): Promise<OpenRouterVideoJob> {
  const response = await fetch(`${OR_BASE}/videos`, {
    method: "POST",
    headers: openRouterHeaders(token, "application/json"),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter 视频生成提交失败 (${response.status}): ${await parseError(response)}`);
  }
  return (await response.json()) as OpenRouterVideoJob;
}

export async function pollOpenRouterVideo(
  token: string,
  jobIdOrPollingUrl: string
): Promise<OpenRouterVideoJob> {
  const url = jobIdOrPollingUrl.startsWith("http")
    ? normalizeOpenRouterUrl(jobIdOrPollingUrl)
    : `${OR_BASE}/videos/${encodeURIComponent(jobIdOrPollingUrl)}`;
  const response = await fetch(url, {
    headers: openRouterHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter 视频状态查询失败 (${response.status}): ${await parseError(response)}`);
  }
  return (await response.json()) as OpenRouterVideoJob;
}

export function openRouterVideoDownloadUrl(
  job: Pick<OpenRouterVideoJob, "id" | "unsigned_urls">,
  index = 0
): string {
  return job.unsigned_urls?.[index] ?? `${OR_BASE}/videos/${encodeURIComponent(job.id)}/content?index=${index}`;
}

export function needsOpenRouterDownloadAuth(url: string): boolean {
  return normalizeOpenRouterUrl(url).startsWith(`${OR_BASE}/`);
}

export async function downloadOpenRouterVideo(
  token: string,
  job: Pick<OpenRouterVideoJob, "id" | "unsigned_urls">,
  index = 0
): Promise<Blob> {
  const url = openRouterVideoDownloadUrl(job, index);
  const response = await fetch(url, {
    headers: needsOpenRouterDownloadAuth(url) ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`OpenRouter 视频下载失败 (${response.status}): ${await parseError(response)}`);
  }
  return response.blob();
}
