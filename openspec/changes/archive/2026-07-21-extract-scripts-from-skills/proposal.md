## Why

Reef 和 Sweep 套件的 SKILL.md 中内嵌了大量机械性 bash 操作和规则判断逻辑（git 命令序列、配置文件的读写、目录/文件骨架生成、CLI 工具包装、交互选择等），这些内容当前以文本说明的形式让 LLM 每次重新执行，造成 token 浪费、执行稳定性差、错误率高。将确定性操作抽取为独立的 `.sh` 或 `.mjs` 脚本，SKILL.md 仅描述"何时调用哪个脚本"，可显著提升执行可靠性并减少 token 开销。

## What Changes

### 抽取为独立脚本的技能步骤

| 套件 | 技能 | 步骤 | 当前状态 | 目标 |
|------|------|------|---------|------|
| reef | reef-commit | 分支检查（Step 2） | 内嵌 bash + "由 LLM 自行推理" | `branch-check.mjs` |
| reef | reef-commit | 创建新分支（Step 3） | 内嵌 bash（stash/checkout/pull/pop） | `stash-and-switch.mjs` |
| reef | reef-commit | 收集上下文（Step 7） | 5 段分散 bash | `collect-git-context.mjs` |
| reef | reef-commit | 运行测试（Step 6） | 内嵌 bash | `run-tests.mjs` |
| reef | reef-commit | OpenSpec 状态检查（Step 6.5） | 内嵌 bash | `check-openspec-status.mjs` |
| reef | reef-pr | 上下文收集 + PR 创建（Step 1+4） | 内嵌 bash + gh 命令 | `create-pr.mjs` |
| reef | reef-harden | Change 目录发现（上下文约定） | 内嵌 bash + fallback 逻辑 | `find-change-dir.mjs` |
| sweep | sweep-init | 项目初始化（Step 2+3+8） | 内嵌 bash + 模板写入 | `init-project.mjs`（整合现有 flow-selector） |
| sweep | sweep-run | 报告生成（Step 8） | 内嵌模板 | `generate-report.mjs` |
| sweep | sweep-run | 路径导航（Step 1） | 内嵌 bash while 循环 | 整合到 `env-manager.mjs` |

### 修改已有脚本
- `packages/sweep/skills/sweep-run/scripts/env-manager.mjs`：扩展路径导航能力
- sweep-run 的 SKILL.md：将内嵌 bash 调用改为环境变量设置引用 `env-manager.mjs`

### 不变的内容
- `reef-scope`：已完全脚本化，不动
- `reef-testcase`：纯 LLM 推理，不适合脚本化，不动
- reef-harden 的五道筛逻辑：LLM 推理驱动，不动

## Capabilities

### New Capabilities

- `reef-commit-git-context`：git 上下文收集与分支管理脚本化
- `reef-pr-creation`：PR 上下文收集与创建脚本化
- `reef-harden-change-discovery`：OpenSpec change 目录自动发现
- `sweep-init-project`：E2E 测试项目初始化脚本化

### Modified Capabilities

（无——本变更不修改已有 spec 级别的行为要求）

## Impact

- **packages/reef/skills/reef-commit/SKILL.md**：内嵌 bash 大幅减少，改为脚本调用
- **packages/reef/skills/reef-pr/SKILL.md**：同前
- **packages/reef/skills/reef-harden/SKILL.md**：首段上下文约定部分改为脚本调用
- **packages/sweep/skills/sweep-init/SKILL.md**：机械步骤整合为脚本
- **packages/sweep/skills/sweep-run/SKILL.md**：路径导航部分改为调用脚本
- **packages/sweep/skills/sweep-run/scripts/env-manager.mjs**：扩展功能
- **packages/cli/dist/***：构建后需同步更新（由 pnpm build 自动处理）
- 新增 `scripts/` 目录：每个受影响技能下增加 `scripts/` 目录，存放抽取的脚本
