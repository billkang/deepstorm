## ADDED Requirements

### Requirement: GitHub Issue 创建与更新

deepstorm-mcp-github-write skill SHALL 提供通过 GitHub MCP 创建和更新 Issue 的操作指南。

#### Scenario: 创建 Issue
- **WHEN** 需要创建新的 Issue，附带标题、描述、标签和 Assignee
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的创建 Issue 工具

#### Scenario: 更新 Issue
- **WHEN** 需要修改 Issue 的标题、描述、标签或状态
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的更新 Issue 工具

### Requirement: GitHub Pull Request 创建

deepstorm-mcp-github-write skill SHALL 提供创建和更新 Pull Request 的操作指南。

#### Scenario: 创建 PR
- **WHEN** 需要将当前分支的变更创建为 Pull Request
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的创建 PR 工具，指定源分支、目标分支、标题和描述，支持 Draft PR

#### Scenario: 更新 PR 描述
- **WHEN** 需要修改已有 PR 的描述
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的更新 PR 工具

### Requirement: GitHub 评论操作

deepstorm-mcp-github-write skill SHALL 提供在 Issue 和 PR 上提交评论的操作指南。

#### Scenario: Issue 评论
- **WHEN** 需要在 Issue 上添加或回复评论
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的添加评论工具

#### Scenario: PR Review 评论
- **WHEN** 需要在 PR 上提交 Review Comment
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的 PR Review Comment 工具

### Requirement: GitHub 文件操作

deepstorm-mcp-github-write skill SHALL 提供通过 GitHub MCP 创建和更新文件的操作指南。

#### Scenario: 创建/更新文件
- **WHEN** 需要通过 API 直接提交文件变更
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的创建/更新文件工具，指定文件路径、内容和提交信息

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-github-write skill SHALL 提供 GitHub MCP 不可用时的降级方式说明。

#### Scenario: 降级处理
- **WHEN** `code-hosting.available === false`
- **THEN** skill 指南 SHALL 说明降级为使用 `gh` CLI 命令替代
