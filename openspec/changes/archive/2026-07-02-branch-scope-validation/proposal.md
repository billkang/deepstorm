## Why

开发者在单个 git 分支中混入多个业务领域的变更是常见问题（如订单 + 支付 + 文档），导致代码审查困难、发布节奏混乱、回滚风险增加。团队要求每个分支只专注一个业务领域，但当前缺乏自动化的验证机制。需要在 `reef` 中引入分支范围验证能力，通过 AI 语义分析 diff 内容来检测分支跨越的业务领域，并在提交和 CI 阶段强制门禁。

## What Changes

- **新增** `scope-detection` 能力：AI 语义分析分支 diff，判定涉及哪些业务领域
- **新增** `scope-gate` 能力：git commit hook + CI/PR 强制门禁，多领域时阻止提交
- **新增** `branch-splitting` 能力：自动生成拆分方案，用户确认后直接创建分支、拆分文件并提交
- **修改** `packages/reef/` 下的相关技能和 hooks 配置

## Capabilities

### New Capabilities
- `scope-detection`: AI 语义分析分支 diff，识别涉及的业务领域并给出可信度评分
- `scope-gate`: git commit hook 和 CI/PR 阶段的门禁执行，多领域时阻断并给出拆分建议
- `branch-splitting`: 用户确认拆分方案后，自动创建新分支、拆分文件、执行 git commit

### Modified Capabilities
- （无 — 本变更为全新能力，不修改现有 spec 的 requirements）

## Impact

- `packages/reef/`：新增 skills、agents 或 hooks 实现三个新 capability
- `.claude/hooks/`：可能需要新增或修改 git hooks 配置
- 用户项目的 CI 配置：新增 CI 门禁检查步骤
- 与现有 `branch-naming-convention` spec 有交互关系：拆分出的新分支仍需遵循分支命名规范
