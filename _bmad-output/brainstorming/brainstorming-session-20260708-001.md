# Brainstorming Session — reef-commit 分支相关性检查

- **日期：** 2026-07-08
- **主题：** reef-commit skill 增加分支名与任务相关性检查能力
- **参与角色：** User (Dev) / Claude (AI)

## 讨论内容

### 背景

reef-commit skill 在提交代码时，没有检查当前分支是否与待提交任务相关。可能导致：
- 在 `main`/`master` 上直接提交变更
- 在临时分支上提交重要变更
- 分支名与变更内容不匹配，代码管理和追溯困难

### 需求

在 reef-commit 工作流中增加分支相关性检查步骤，当分支不相关时自动创建新分支。

### 决策

| # | 事项 | 结论 |
|---|------|------|
| 1 | 新分支基于什么创建？ | **基于 main 创建**，先切到 main（尝试拉取最新），再创建新分支，stash 的数据自动带到新分支 |
| 2 | 相关性判断方式？ | **LLM 自行推理判断**，依据 staged + unstaged 全部变更内容匹配最合适的 OpenSpec 任务 |
| 3 | main/master 时怎么办？ | **直接创建新分支**，不询问用户 |
| 4 | 临时分支名（temp/wip/test）？ | 提示用户建议创建新分支，但不强制 |
| 5 | OpenSpec 任务优先级？ | LLM 从所有 `openspec/changes/*/` 中查找与变更内容最匹配的任务 |
| 6 | 分支名生成规则？ | OpenSpec 任务名 → LLM 根据变更内容推导 kebab-case 分支名（含前缀如 `feat/`、`fix/`） |
| 7 | 步骤位置？ | 在「审查待提交文件」之前，作为最早的分支检查步骤 |

### 影响范围

- **直接：** `packages/reef/skills/reef-commit/SKILL.md` — 新增步骤 2.1-2.2
- **间接：** 用户项目中的 reef-commit 行为变更
