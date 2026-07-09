# Proposal: deepstorm update 命令配置驱动 tool 检测

## Why

`deepstorm update` 在执行资产同步（skills/agents/hooks）时，依赖 `installedSkills` 列表反向映射 tool 名称。当用户在 setup 时选择了某 tool 的配置选项（如 reef.frontend.framework: "angular"），但该 tool 的 skill 未被记录进 `installedSkills`（如 playground 的 setup 流程只安装了 sweep skills），update 命令完全跳过该 tool 的资产同步。

这导致：用户已配置并使用 reef，但 `deepstorm update` 从不更新 reef 的 hooks、agents 和 skills。

## What Changes

1. **新增** — `detectToolsFromConfig()` 函数，从 `deepstorm.*` 扁平配置的 key 前缀中检测已安装的 tool
2. **修改** — `syncToolAssets()` 中的 tool 检测逻辑，从单来源（`skillIdsToTools`）改为双来源合并（installedSkills + config）
3. **不变** — setup 命令、build 流程、registry 结构

## Capabilities

- `config-tool-detection` — 从 settings.json 的配置项前缀检测已安装的 tool

## Impact

| 模块 | 影响 |
|------|------|
| `packages/cli/src/commands/template-upgrade.ts` | 新增 1 个函数 + 修改 tool 检测逻辑 |
| `packages/cli/src/commands/update.ts` | 无改动（仅消费 syncToolAssets 的行为变化） |
| `packages/cli/src/commands/setup.ts` | 无改动 |
| 其他套件（tide/sweep/atoll） | 无影响 |
