export type GoalStatus = "active" | "complete" | "blocked" | "stalled";

export type GoalAssessmentStatus = "in_progress" | "complete" | "blocked";

export interface GoalAssessment {
  status: GoalAssessmentStatus;
  summary: string;
  evidence: string[];
  missingDependencies: string[];
  resolvableDependencies: string[];
  userDependencies: string[];
  resolvedDependencies: string[];
  blocker: string;
  nextAction: string;
}

export interface GoalState {
  objective: string;
  status: GoalStatus;
  summary: string;
  evidence: string[];
  missingDependencies: string[];
  resolvableDependencies: string[];
  userDependencies: string[];
  resolvedDependencies: string[];
  blocker: string;
  nextAction: string;
  noProgressCount: number;
  lastProgressFingerprint: string;
  updatedAt: number;
}

export type GoalContinuationAction =
  | "continue"
  | "stop-complete"
  | "stop-blocked"
  | "stop-stalled";

export interface GoalContinuationDecision {
  action: GoalContinuationAction;
  reason:
    | "needs-verification"
    | "needs-next-action"
    | "complete"
    | "blocked"
    | "no-progress";
  goal: GoalState;
}

const TASK_REQUEST_PATTERN =
  /(?:帮我|请(?:帮我)?|创建|生成|画|绘制|写|设计|修改|编辑|实现|修复|制作|导出|整理|完成|执行|安装|删除|添加|构建|发布|改成|create|generate|draw|write|design|edit|fix|build|make|export|organize|complete|implement|install|delete|add|publish|help me)/iu;

const QUESTION_ONLY_PATTERN =
  /^(?:什么|为什么|怎么|如何|哪里|哪个|是否|能否|可以吗|请解释|解释一下|what|why|how|where|which|can you|could you|is it)\b[\s\S]*[？?。.!！]?$/iu;

export function isTaskLikeRequest(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  if (QUESTION_ONLY_PATTERN.test(normalized) && !TASK_REQUEST_PATTERN.test(normalized)) {
    return false;
  }
  return TASK_REQUEST_PATTERN.test(normalized);
}

export function isGoalContinuationRequest(text: string): boolean {
  const normalized = text.trim();
  return (
    /^(?:继续|继续做|继续处理|继续完成|继续刚才的任务)[\s\S]*$/iu.test(normalized) ||
    /^(?:continue|keep going|go on|resume|finish it)\b[\s\S]*$/iu.test(normalized)
  );
}

export function createGoalState(objective: string, now = Date.now()): GoalState {
  return {
    objective: objective.trim(),
    status: "active",
    summary: "",
    evidence: [],
    missingDependencies: [],
    resolvableDependencies: [],
    userDependencies: [],
    resolvedDependencies: [],
    blocker: "",
    nextAction: "",
    noProgressCount: 0,
    lastProgressFingerprint: "",
    updatedAt: now,
  };
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAssessmentValue(value: unknown): GoalAssessment | null {
  if (!value || typeof value !== "object") return null;
  const goal = value as Record<string, unknown>;
  const status = goal.status;
  if (status !== "in_progress" && status !== "complete" && status !== "blocked") {
    return null;
  }
  return {
    status,
    summary: cleanString(goal.summary),
    evidence: cleanStringList(goal.evidence),
    missingDependencies: cleanStringList(goal.missingDependencies),
    resolvableDependencies: cleanStringList(goal.resolvableDependencies),
    userDependencies: cleanStringList(goal.userDependencies),
    resolvedDependencies: cleanStringList(goal.resolvedDependencies),
    blocker: cleanString(goal.blocker),
    nextAction: cleanString(goal.nextAction),
  };
}

export function parseGoalAssessment(content: string | null | undefined): GoalAssessment | null {
  if (!content) return null;
  const candidates: string[] = [];
  const fenced = content.matchAll(/```(?:json|goal)?\s*([\s\S]*?)```/giu);
  for (const match of fenced) candidates.push(match[1].trim());
  candidates.push(content.trim());

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      const root = parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
      const assessment = parseAssessmentValue(root?.goal ?? parsed);
      if (assessment) return assessment;
    } catch {
      /* Try the next candidate. */
    }
  }
  return null;
}

export function applyGoalAssessment(
  goal: GoalState,
  assessment: GoalAssessment,
  now = Date.now()
): GoalState {
  const hasEvidence = assessment.evidence.length > 0;
  const hasMissingDependencies = assessment.missingDependencies.length > 0;
  const hasUserDependency = assessment.userDependencies.length > 0;
  const hasExplicitBlocker = Boolean(assessment.blocker);
  const status: GoalStatus =
    hasUserDependency ||
      (assessment.status === "blocked" &&
        (hasMissingDependencies || hasExplicitBlocker))
      ? "blocked"
      : assessment.status === "complete" && hasEvidence && !hasMissingDependencies
        ? "complete"
        : "active";

  return {
    ...goal,
    status,
    summary: assessment.summary || goal.summary,
    evidence: assessment.evidence,
    missingDependencies: assessment.missingDependencies,
    resolvableDependencies: assessment.resolvableDependencies,
    userDependencies: assessment.userDependencies,
    resolvedDependencies: assessment.resolvedDependencies,
    blocker:
      assessment.blocker ||
      (status === "blocked"
        ? [...assessment.userDependencies, ...assessment.missingDependencies].join("、")
        : ""),
    nextAction:
      status === "active" && assessment.status === "complete" && !hasEvidence
        ? "提供可检查的完成证据后再结束目标"
        : assessment.nextAction ||
          (status === "active" && assessment.resolvableDependencies.length > 0
            ? `解决依赖：${assessment.resolvableDependencies.join("、")}`
            : ""),
    noProgressCount: goal.noProgressCount,
    lastProgressFingerprint: goal.lastProgressFingerprint,
    updatedAt: now,
  };
}

export function decideGoalContinuation(input: {
  goal: GoalState;
  responseFingerprint: string;
  maxNoProgress?: number;
  now?: number;
}): GoalContinuationDecision {
  const maxNoProgress = Math.max(1, input.maxNoProgress ?? 2);
  const now = input.now ?? Date.now();
  const goal = input.goal;

  if (goal.status === "complete") {
    return { action: "stop-complete", reason: "complete", goal };
  }
  if (goal.status === "blocked") {
    return { action: "stop-blocked", reason: "blocked", goal };
  }
  if (goal.status === "stalled") {
    return { action: "stop-stalled", reason: "no-progress", goal };
  }

  const repeated =
    Boolean(input.responseFingerprint) &&
    input.responseFingerprint === goal.lastProgressFingerprint;
  const noProgressCount = repeated ? goal.noProgressCount + 1 : 1;
  const nextGoal: GoalState = {
    ...goal,
    noProgressCount,
    lastProgressFingerprint: input.responseFingerprint,
    updatedAt: now,
  };

  if (noProgressCount >= maxNoProgress) {
    return {
      action: "stop-stalled",
      reason: "no-progress",
      goal: { ...nextGoal, status: "stalled" },
    };
  }

  return {
    action: "continue",
    reason: /evidence|证据|verify|验证|check|检查/iu.test(goal.nextAction)
      ? "needs-verification"
      : "needs-next-action",
    goal: nextGoal,
  };
}
