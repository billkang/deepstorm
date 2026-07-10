## Context

当前 `deepstorm-commit` skill 的提交流程止于第 9 步（执行 commit）和第 10 步（可选推送）。用户完成提交后，还需要手动 `git push`、打开 GitHub 创建 PR、点击 squash merge。对于 DeepStorm 自身开发场景，这个模式每天重复多次。

GitHub CLI（`gh`）已通过 MCP 工具可用，且 `gh pr create` 和 `gh pr merge --auto --squash` 提供了完整的 PR 生命周期管理能力。本设计将这些步骤嵌入同一个流程中，让一次 `/deepstorm-commit` 调用的产出从「一个 commit」升级为「一个合并到 main 的 PR」。

## Goals / Non-Goals

**Goals:**
- commit 执行后自动推送到远程
- 自动创建 Pull Request（target: main）
- 自动启用 squash merge auto-merge
- Amend 场景仅推送、不创建 PR（因为 amend 表示变更尚未完成）
- 与现有 OpenSpec 验证门禁（步骤 5.5）无缝衔接

**Non-Goals:**
- 不引入新的 CLI 命令或配置项
- 不修改 reef-commit（通用模板），仅改 deepstorm-commit（DeepStorm 本地版）
- 不修改已归档的 OpenSpec 验证/归档逻辑
- 不支持非 main 目标分支（始终 main）
- 不处理 PR review 流程（auto-merge 在 CI 通过后自动合并，不需要人工 approve）

## Decisions

### Decision 1: 使用 `gh` CLI 而非 GitHub API
- **选择**：`gh` CLI
- **理由**：
  - `gh` 已在 MCP 工具可用，环境大概率已配置
  - `gh pr create` 和 `gh pr merge --auto --squash` 一行命令完成 PR 创建和 auto-merge
  - 相比直接调用 GitHub API，`gh` 处理了认证、base url、错误提示等细节
  - 与 DeepStorm 现有的 GitHub 集成一致（release 流程已使用 `gh`）
- **备选方案**：GitHub REST API via `curl` — 需要手动处理认证和错误；❌ 不引入新依赖

### Decision 2: Push 从「可选」改为「自动」
- **选择**：Push 作为流程的第 10 步，自动执行
- **理由**：
  - PR 创建和 auto-merge 的前提是分支已在远程
  - 当前「仅用户要求时推送」的设计在实践中导致用户经常忘记 push
  - DeepStorm 是单人开发场景，推送风险低
- **异常处理**：push 失败（如网络问题、权限问题）时提示用户手动处理，中止流程

### Decision 3: Squash Merge 而非 Merge Commit 或 Rebase
- **选择**：`--squash` 模式
- **理由**：用户明确要求 squash merge；这也是 DeepStorm monorepo 推荐的合并策略（保持 main 历史线性）
- **实施**：`gh pr merge <pr-url> --auto --squash`

### Decision 4: Amend 场景仅推送、跳过 PR
- **选择**：amend 后只执行 `git push --force-with-lease`，不创建 PR
- **理由**：Amend 通常发生在「发完 PR 后发现需要微调」或「不想新建 PR」的场景。如果用户 amend 了，假设 PR 已存在或即将手动创建

### Decision 5: 不要拆分步骤，追加到现有工作流末尾
- **选择**：新增步骤 10/11/12 插入当前的步骤 10 位置
- **理由**：
  - 现有步骤 1-9 的逻辑完全不变
  - 新的推送/PR/合并步骤是纯追加，不改变提交信息生成、测试、OpenSpec 验证等核心逻辑
  - 用户仍然可以通过在确认步骤放弃来中止流程（不选「就这样提交」就没后续）

## Risks / Trade-offs

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| `gh` 未安装/未认证 | 在某些环境中 `gh` 不可用 | push 仍然执行，提示用户手动创建 PR |
| 并发推送冲突 | 多人同时推送到同名分支（极低概率） | 提示用户 pull 后再试 |
| CI 耗时过长 | auto-merge 等待 CI 可能需要较长时间 | 告知用户 PR 链接，auto-merge 已启用，CI 通过后自动合并 |
| 合并冲突 | PR 与 main 存在冲突 | gh 会在 auto-merge 时报告；提示用户手动解决 |
| OpenSpec 归档后无活跃 change | 新步骤可能无 OpenSpec 上下文可用 | 仍然创建 PR，使用 commit title 作为 PR title |
