import assert from "node:assert/strict";
import test from "node:test";

import {
  applyGoalAssessment,
  applySetGoalToolInput,
  createGoalState,
  decideGoalContinuation,
  isGoalContinuationRequest,
  isTaskLikeRequest,
  pauseGoalAfterContinuationLimit,
  parseGoalAssessment,
} from "./goalMode.ts";

test("recognizes task requests but leaves factual questions outside goal mode", () => {
  assert.equal(isTaskLikeRequest("帮我画个人"), true);
  assert.equal(isTaskLikeRequest("请修改这一章的结尾"), true);
  assert.equal(isTaskLikeRequest("中国的首都是哪里？"), false);
  assert.equal(isTaskLikeRequest("解释一下这个文件"), false);
});

test("recognizes explicit requests to resume an unfinished goal", () => {
  assert.equal(isGoalContinuationRequest("继续"), true);
  assert.equal(isGoalContinuationRequest("继续处理刚才的任务"), true);
  assert.equal(isGoalContinuationRequest("keep going"), true);
  assert.equal(isGoalContinuationRequest("这个结果是什么意思？"), false);
});

test("parses the structured goal assessment from the assistant response", () => {
  const assessment = parseGoalAssessment(
    [
      "已经完成。",
      "```json",
      JSON.stringify({
        goal: {
          status: "complete",
          summary: "生成了人物立绘",
          evidence: ["工具返回了图片资源 ID"],
          missingDependencies: [],
          resolvableDependencies: [],
          userDependencies: [],
          resolvedDependencies: ["人物外观采用了默认设定"],
          nextAction: "",
        },
      }),
      "```",
    ].join("\n")
  );

  assert.deepEqual(assessment, {
    status: "complete",
    summary: "生成了人物立绘",
    evidence: ["工具返回了图片资源 ID"],
    missingDependencies: [],
    resolvableDependencies: [],
    userDependencies: [],
    resolvedDependencies: ["人物外观采用了默认设定"],
    blocker: "",
    nextAction: "",
  });
});

test("does not accept complete without evidence and asks the agent to verify", () => {
  const goal = createGoalState("帮我画个人", 100);
  const assessment = parseGoalAssessment(
    '```json\n{"goal":{"status":"complete","summary":"好了","evidence":[]}}\n```'
  );
  assert.ok(assessment);

  const next = applyGoalAssessment(goal, assessment);
  assert.equal(next.status, "active");
  assert.match(next.nextAction, /evidence|证据/i);

  const decision = decideGoalContinuation({
    goal: next,
    responseFingerprint: "same-answer",
    maxNoProgress: 2,
  });
  assert.equal(decision.action, "continue");
  assert.equal(decision.reason, "needs-verification");
});

test("does not accept completion while a user dependency is still missing", () => {
  const next = applyGoalAssessment(
    createGoalState("发布作品", 100),
    {
      status: "complete",
      summary: "构建完成",
      evidence: ["构建日志通过"],
      missingDependencies: ["发布平台授权"],
      resolvableDependencies: [],
      userDependencies: ["发布平台授权"],
      resolvedDependencies: [],
      blocker: "需要用户授权发布平台",
      nextAction: "",
    }
  );

  assert.equal(next.status, "blocked");
  assert.equal(next.blocker, "需要用户授权发布平台");
});

test("continues when a missing dependency is solvable by the agent", () => {
  const goal = createGoalState("帮我画个人", 100);
  const assessment = parseGoalAssessment(
    [
      "```json",
      JSON.stringify({
        goal: {
          status: "in_progress",
          summary: "还缺少人物国籍",
          evidence: [],
          missingDependencies: ["人物国籍"],
          resolvableDependencies: ["人物国籍"],
          userDependencies: [],
          resolvedDependencies: [],
          nextAction: "使用中性默认设定继续生成",
        },
      }),
      "```",
    ].join("\n")
  );
  assert.ok(assessment);

  const next = applyGoalAssessment(goal, assessment);
  assert.equal(next.status, "active");
  assert.deepEqual(next.missingDependencies, ["人物国籍"]);
  assert.equal(
    decideGoalContinuation({
      goal: next,
      responseFingerprint: "different-answer",
      maxNoProgress: 2,
    }).action,
    "continue"
  );
});

test("stops after repeated no-progress responses instead of looping forever", () => {
  const goal = createGoalState("帮我画个人", 100);
  const first = decideGoalContinuation({
    goal,
    responseFingerprint: "same-answer",
    maxNoProgress: 2,
  });
  assert.equal(first.action, "continue");

  const second = decideGoalContinuation({
    goal: first.goal,
    responseFingerprint: "same-answer",
    maxNoProgress: 2,
  });
  assert.equal(second.action, "stop-stalled");
  assert.equal(second.goal.status, "stalled");
});

test("counts repeated structured assessments as no progress", () => {
  const goal = createGoalState("完成任务", 100);
  const assessment = {
    status: "in_progress" as const,
    summary: "仍在处理中",
    evidence: [],
    missingDependencies: [],
    resolvableDependencies: [],
    userDependencies: [],
    resolvedDependencies: [],
    blocker: "",
    nextAction: "继续尝试同一个动作",
  };

  const firstAssessment = applyGoalAssessment(goal, assessment, 101);
  const first = decideGoalContinuation({
    goal: firstAssessment,
    responseFingerprint: "same-assessment",
    maxNoProgress: 2,
  });
  const secondAssessment = applyGoalAssessment(first.goal, assessment, 102);
  const second = decideGoalContinuation({
    goal: secondAssessment,
    responseFingerprint: "same-assessment",
    maxNoProgress: 2,
  });

  assert.equal(second.action, "stop-stalled");
});

test("stops a verified complete goal and a real blocker", () => {
  const complete = applyGoalAssessment(
    createGoalState("生成一个角色", 100),
    {
      status: "complete",
      summary: "已生成",
      evidence: ["工具返回 asset_id"],
      missingDependencies: [],
      resolvableDependencies: [],
      userDependencies: [],
      resolvedDependencies: [],
      blocker: "",
      nextAction: "",
    }
  );
  assert.equal(complete.status, "complete");
  assert.equal(
    decideGoalContinuation({
      goal: complete,
      responseFingerprint: "done",
      maxNoProgress: 2,
    }).action,
    "stop-complete"
  );

  const blocked = applyGoalAssessment(
    createGoalState("发布作品", 100),
    {
      status: "blocked",
      summary: "无法发布",
      evidence: ["本地构建已通过"],
      missingDependencies: ["用户尚未授权发布平台"],
      resolvableDependencies: [],
      userDependencies: ["用户尚未授权发布平台"],
      resolvedDependencies: [],
      blocker: "需要用户授权发布平台",
      nextAction: "",
    }
  );
  assert.equal(blocked.status, "blocked");
  assert.equal(
    decideGoalContinuation({
      goal: blocked,
      responseFingerprint: "blocked",
      maxNoProgress: 2,
    }).action,
    "stop-blocked"
  );
});

test("pauses an unfinished goal when automatic continuation is no longer available", () => {
  const goal = {
    ...createGoalState("修复登录表单"),
    nextAction: "补充可验证的完成证据",
  };

  const paused = pauseGoalAfterContinuationLimit(goal, "needs-verification", 1000);

  assert.equal(paused.status, "stalled");
  assert.equal(paused.noProgressCount, goal.noProgressCount);
  assert.equal(paused.updatedAt, 1000);
  assert.match(paused.blocker, /自动继续|automatic continuation/iu);
  assert.match(paused.nextAction, /补充可验证的完成证据/);
});

test("applies set_goal tool input to the local goal state", () => {
  const started = applySetGoalToolInput(
    null,
    {
      objective: "整理章节结构",
      status: "in_progress",
      summary: "正在读取章节",
      nextAction: "读取剩余文件",
    },
    "用户原始请求",
    100
  );

  assert.equal(started.objective, "整理章节结构");
  assert.equal(started.status, "active");
  assert.equal(started.summary, "正在读取章节");
  assert.equal(started.nextAction, "读取剩余文件");

  const completed = applySetGoalToolInput(
    started,
    {
      status: "complete",
      summary: "章节结构已整理",
      evidence: ["写入了 chapter-001/meta.md"],
    },
    "用户原始请求",
    200
  );

  assert.equal(completed.objective, "整理章节结构");
  assert.equal(completed.status, "complete");
  assert.deepEqual(completed.evidence, ["写入了 chapter-001/meta.md"]);
  assert.equal(completed.updatedAt, 200);
});
