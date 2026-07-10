## Why

reef 的 `reef-auto-format.sh` 在每次 Write/Edit 后自动运行 `eslint --fix`，但这只覆盖了 ESLint 规则层面的修复。实际项目中 VS Code 的 "format on save" 会额外执行 Prettier 格式化和 `source.organizeImports`，导致 Claude Code 生成的代码在用户首次保存时 import 语句发生变化，产生不必要的 diff 和体验断裂。

## What Changes

- 在 `reef-auto-format.sh.tmpl` 中为 TypeScript/JavaScript/TypeScript React 文件增加 `prettier --write` 步骤（如果项目配置了 Prettier）
- 在 `reef-auto-format.sh.tmpl` 中为 TypeScript/TypeScript React 文件增加 organize imports 步骤
- 在 `reef-auto-format.sh.tmpl` 中为 Python 文件增加 `isort` 步骤（Python 的 import 排序等价物）
- 新增 VS Code 配置检测能力：自动读取 `.vscode/settings.json` 来决定启用哪些格式化命令
- 在 `wizard.json` 中增加相关配置项，作为 VS Code 配置检测的 fallback

## Capabilities

### New Capabilities

- `prettier-support`: 在 reef-auto-format 中集成 Prettier 格式化能力，支持检测 prettier 配置（`.prettierrc`、`prettier.config.js` 等）并执行 `prettier --write`
- `organize-imports-support`: 在 reef-auto-format 中集成 import 排序能力，TypeScript/JS 使用 organize imports，Python 使用 isort
- `vscode-config-detection`: 自动读取 `.vscode/settings.json` 判断项目使用的 formatter 和 codeActionsOnSave 配置，据此决定格式化策略

### Modified Capabilities

（无 — 这是新能力，不修改现有 spec）

## Impact

| 影响范围 | 说明 |
|---------|------|
| `packages/reef/hooks/reef-auto-format.sh.tmpl` | 主要改造点：在各语言分支中增加 Prettier、organizeImports、isort 调用；新增 VS Code 配置检测逻辑 |
| `packages/reef/wizard.json` | 可能新增 `prettier.enabled`、`organizeImports.enabled` 等配置项 |
| `packages/cli/src/commands/setup/` | CLI 安装逻辑需同步新钩子配置 |
| `packages/cli/src/commands/update/` | update 命令需同步新配置到安装副本 |
| `playground/.deepstorm/` | playground 配置需同步验证 |
