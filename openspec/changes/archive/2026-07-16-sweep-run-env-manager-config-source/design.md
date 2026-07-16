## Context

`sweep-run` 的 `env-manager.mjs:readFramework()` 当前从 `.claude/settings.json` 的 `deepstorm.sweep.e2eFramework` 路径读取 E2E 框架配置。但 DeepStorm 配置体系已演进为以 `.deepstorm/settings.json` 为规范存储位置（见 `packages/cli/src/merger/settings.ts` 的 `writeDeepStormConfig` / `readDeepStormConfig` 函数），`.claude/settings.json` 中的 `deepstorm` 命名空间是旧位置。

`sweep-run` 的 env-manager 是 sweep 套件中唯一残留的读取旧位置消费者，需同步更新。同时清理 merger/settings.ts 中的向后兼容迁移代码。

## Goals / Non-Goals

**Goals:**
- `readFramework()` 只从 `.deepstorm/settings.json` 读取 `sweep.e2eFramework`
- 移除 `merger/settings.ts` 中的 `.claude/settings.json` 迁移和已废弃函数
- 同步更新 `env-manager.test.mjs` 的测试用例
- 更新所有 SKILL.md 文档引用

**Non-Goals:**
- 不修改 `checkMcpAvailable()`（仍读 `.mcp.json`，无需变更）
- 不影响 `env-manager.mjs` 的其他功能（环境解析、MCP 检查）
- CLI setup 的写入逻辑不变（已正确写入 `.deepstorm/settings.json`）

## Decisions

### 1. 读源路径：只读 `.deepstorm/settings.json` → `sweep.e2eFramework`

`.deepstorm/settings.json` 的结构中 config 键是顶层的（如 `sweep`、`reef`），没有 `deepstorm` 嵌套。因此 `e2eFramework` 的路径为 `sweep.e2eFramework`（JSON 中的 `config.sweep.e2eFramework`）。

**备选方案：**
- **A（选中）**：只读 `.deepstorm/settings.json` 的 `sweep.e2eFramework`，不提供回退
- **B**：读 `.deepstorm/settings.json`，回退 `.claude/settings.json` — **否决**。无需考虑向后兼容

### 2. 移除 `getSettingsPath()`（死亡代码）

`getSettingsPath()` 返回 `.claude/settings.json` 路径，在移除回退后不再被任何代码调用，一并删除。

### 3. source 返回值精简

当前 return 的 `source` 字段仅 `"settings"` / `"default"` / `"missing-file"`，精简为：
- `"deepstorm-settings"` — 从 `.deepstorm/settings.json` 成功读取
- `"missing-file"` — `.deepstorm/settings.json` 文件不存在
- `"not-configured"` — 文件存在但未配置 e2eFramework
- `"parse-error"` — JSON 格式错误

移除 `"claude-settings"` 和 `"default"` 值。

### 4. 测试策略

- 更新 `env-manager.test.mjs` 中现有 `readFramework` 测试用例
- 覆盖 `.deepstorm/settings.json` 存在且包含配置的场景
- 覆盖 `.deepstorm/settings.json` 不存在的场景
- 覆盖 `.deepstorm/settings.json` 格式错误的场景
- 覆盖文件存在但未配置的场景

### 5. 清理 merger/settings.ts

- 移除 `readDeepStormConfig()` 中的 `.claude/settings.json` 迁移逻辑
- 删除已废弃的 `mergeDeepStormConfig()` 和 `readDeepStormConfigFromPath()` 函数

## Risks / Trade-offs

- **[规范一致]** 所有 DeepStorm 配置统一从 `.deepstorm/settings.json` 读取，消除歧义
- **[测试覆盖]** `.deepstorm/settings.json` 的读取涉及文件系统操作 → 通过临时目录 + 模拟文件的方式测试，避免对外部文件的依赖
