## Context

reef-commit SKILL.md 当前的工作流步骤顺序为：

1. 检测变更 → 2. 审查待提交文件 → 2.4 分支范围检查 → 2.5 运行测试 → 3. 收集上下文 → ... 

没有独立的分支相关性检查环节。用户可能在 main/master、临时命名分支上直接提交代码，导致分支管理混乱。

本次改动只在 SKILL.md 中新增两个步骤（2.1-2.2），不涉及代码实现，不新增外部依赖。

## Goals / Non-Goals

**Goals:**
- 在「审查待提交文件」步骤之前增加分支相关性检查
- 在 main/master 上自动创建新分支（基于 main）
- 临时分支名（temp/wip/test）时提示用户创建新分支
- 新分支名按 OpenSpec 任务 → LLM 推导的规则生成
- stash → checkout main → checkout -b → stash pop 的完整流程

**Non-Goals:**
- 不修改 reef-commit 的其他步骤
- 不修改其他 SKILL.md 或代码文件
- 不涉及 reef-scope 的现有逻辑

## Decisions

### 1. 步骤插入位置：在「审查待提交文件」之前

**选择：** 2.1-2.2 插入到现有第 2 步（审查待提交文件）之前
**理由：** 如果分支不对，审查文件没有意义。先确保在正确分支上，再审查更改内容。也避免在错误分支上执行范围检查（2.4）浪费资源。
**备选：** 放在 2.4 之后。驳回——与「先确认分支再处理内容」的原则不符。

### 2. 新分支基于 main 创建

**选择：** `git checkout main` → `git pull origin main`（尝试）→ `git checkout -b <new-branch>`
**理由：** 确保新分支从最新的主干开始，而不是从当前脏分支开始。避免将脏分支的历史带到新分支。
**备选：** 基于当前分支。驳回——用户已明确要求基于 main。

### 3. 分支名包含 Conventional Commit 前缀

**选择：** 分支名如 `feat/add-user-auth`、`fix/login-timeout`
**理由：** 与 DeepStorm 分支名前缀规范一致
**备选：** 不加前缀的纯 kebab-case。驳回——与项目规范冲突。

### 4. 采用 LLM 推理判断而非脚本

**选择：** 在 SKILL.md 中以步骤指令形式让 LLM 自行判断分支相关性、生成分支名
**理由：** SKILL.md 是 LLM 指令文件，没有运行时脚本。分支相关性判断需要理解变更语义，适合 LLM 处理而非静态规则。且不需要新增文件。
**备选：** 编写 shell 脚本自动判断。驳回——语义判断需要 AI 能力，shell 脚本无法准确理解变更内容语义。

### 5. 变更保存策略

**选择：** `git stash push -m "reef-commit-auto-stash"` → 切换到 main → 创建新分支 → `git stash pop`
**理由：** stash 会将 staged + unstaged 的所有变更暂存，stash pop 在新分支恢复，保持工作区干净。带 -m 标签方便识别。
**风险：** 如果有已有 stash 条目，pop 可能冲突。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| stash pop 可能产生合并冲突 | 在 SKILL.md 中注明：如果冲突，提示用户手动解决后再继续 |
| git pull origin main 可能失败（无远程、网络不通） | 使用 `2>/dev/null \|\| true` 忽略失败，基于本地 main 创建 |
| 用户已经在功能分支上，分支名合理但变更跨领域 | 此场景由已有的 scope check（2.4）处理，不冲突 |
| 用户有多个 stash 条目 | stash pop 只弹出最新的一条（当前创建的），不影响其他 stash |

## Migration Plan

无迁移步骤。变更仅影响 SKILL.md，下次运行 reef-commit 时自动生效。
