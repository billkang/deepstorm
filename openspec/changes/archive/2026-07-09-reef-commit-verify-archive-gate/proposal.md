## Why

deepstorm-commit 在生成提交信息和执行提交时，仅检查了变更文件、运行测试、收集 OpenSpec 上下文，但没有验证关联的 OpenSpec change 是否已完成 /opsx:verify 和 /opsx:archive。这导致可能出现「代码已提交但 OpenSpec 变更未归档」的不一致状态，以及「未经 verify 的变更被提交」的质量风险。

## What Changes

- 在 `deepstorm-commit` SKILL.md 的步骤 5（运行测试）与步骤 6（收集上下文）之间，新增「OpenSpec 验证与归档检查」步骤
- 该步骤自动检测当前分支关联的活跃 OpenSpec change
- 未完成 verify 时自动调用 `/opsx:verify`
- 未完成 archive 时自动调用 `/opsx:archive`
- 确保 verify 和 archive 均已完成才放行到后续提交流程
- **同步更新** `packages/reef/skills/reef-commit/SKILL.md.tmpl`（deepstorm-commit 的上游模板），保持两份技能一致

## Capabilities

### New Capabilities
- `verify-archive-gate`: 在代码提交前自动执行 OpenSpec 验证与归档检查的能力

### Modified Capabilities
- `deepstorm-commit`（自身技能）: 新增提交流程中的 verify/archive 门禁步骤

## Impact

- `.claude/skills/deepstorm-commit/SKILL.md` — 新增 step 5.5
- `packages/reef/skills/reef-commit/SKILL.md.tmpl` — 同步新增对应步骤（reef-commit 通用框架）
