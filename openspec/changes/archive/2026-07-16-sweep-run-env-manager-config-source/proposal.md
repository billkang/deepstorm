## Why

`sweep-run` 的 `env-manager.mjs:readFramework()` 当前从 `.claude/settings.json` 的 `deepstorm.sweep.e2eFramework` 读取框架配置，但 DeepStorm 自身配置的规范存储位置是 `.deepstorm/settings.json`。早期 DeepStorm 配置嵌套在 `.claude/settings.json` 的 `deepstorm` 命名空间下，后续已迁移到独立文件，但 sweep-run 脚本未同步更新，导致配置读取源与实际存储位置不一致。

## What Changes

- 修改 `packages/sweep/skills/sweep-run/scripts/env-manager.mjs` 的 `readFramework()`：只从 `.deepstorm/settings.json` 读取 `sweep.e2eFramework`，移除 `.claude/settings.json` 回退
- 移除未使用的 `getSettingsPath()` 辅助函数
- 同步更新 `env-manager.test.mjs` 中的测试用例
- 清理 `packages/cli/src/merger/settings.ts` 中的向后兼容迁移代码（删除已废弃的 `mergeDeepStormConfig()` / `readDeepStormConfigFromPath()`）
- 更新所有 SKILL.md 和 playground 副本中的配置读取引用
- 不涉及 `checkMcpAvailable()` 的改动（仍读 `.mcp.json`，无需修改）

## Capabilities

### New Capabilities

无新能力引入。本次变更为现有能力的行为修复。

### Modified Capabilities

- `flow-execution`: 修改 `readFramework()` 的配置读取源，从 `.claude/settings.json` 改为 `.deepstorm/settings.json`
- `config-management`: 清理 merger/settings.ts 中的向后兼容代码

## Impact

- **影响文件**：`packages/sweep/skills/sweep-run/scripts/env-manager.mjs`、`packages/cli/src/merger/settings.ts`
- **测试文件**：`packages/sweep/skills/sweep-run/scripts/__tests__/env-manager.test.mjs`、`packages/cli/src/merger/__tests__/settings.test.ts`
- **文档**：sweep-run/SKILL.md、sweep-init/SKILL.md、tide-discuss references、MCP skills、playground 副本
- **无上下游依赖改动**：CLI setup 写入逻辑不变，`checkMcpAvailable()` 不变
