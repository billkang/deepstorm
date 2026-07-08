## Why

reef-commit 在提交代码时没有检查当前分支是否与待提交任务相关，容易导致：
- 在 `main`/`master` 分支上直接提交变更，污染主干
- 在临时命名分支（temp/wip/test）上提交重要代码，代码管理混乱
- 分支名与变更内容不匹配，后续追溯困难

## What Changes

- **reef-commit 工作流新增「分支相关性检查」步骤**：在审查待提交文件之前，先检查当前分支名是否与任务内容相关
- **分支不相关时自动创建新分支**：基于当前分支创建、stash 自动保持、不询问用户
- **分支名生成规则**：按 OpenSpec 任务名 → LLM 根据变更内容推导 kebab-case 分支名（含 `feat/`、`fix/` 等前缀）

## Capabilities

### New Capabilities
- `branch-relevance`: reef-commit 在执行提交流程时自动检查当前分支是否与待提交任务匹配，并在不匹配时创建新分支

### Modified Capabilities
<!-- No existing specs modified -->

## Impact

- `packages/reef/skills/reef-commit/SKILL.md`：新增步骤 2.1-2.2，调整后续步骤编号
- 所有使用 reef-commit skill 的项目提交行为改变：自动增加分支检查和创建环节
