import assert from "node:assert/strict";
import test from "node:test";

import { localizePlatformErrorMessage } from "./platform-errors.ts";

test("localizes known platform errors by exact message", () => {
  assert.equal(
    localizePlatformErrorMessage("项目备份缺少作品信息（meta.md），无法恢复作品", "en"),
    "The project backup is missing project metadata (meta.md) and cannot be restored."
  );
});

test("localizes known platform error prefixes while preserving details", () => {
  assert.equal(
    localizePlatformErrorMessage("模板资产加载失败: assets/logo.png", "en"),
    "Failed to load template asset: assets/logo.png"
  );
});

