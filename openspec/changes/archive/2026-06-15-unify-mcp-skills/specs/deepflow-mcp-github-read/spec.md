## ADDED Requirements

### Requirement: GitHub 代码浏览

deepstorm-mcp-github-read skill SHALL 提供通过 GitHub MCP 浏览代码仓库的操作指南。

#### Scenario: 查看仓库信息
- **WHEN** 需要获取仓库的元信息（描述、语言、Star 数、License 等）
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的查看仓库工具

#### Scenario: 查看文件内容
- **WHEN** 需要读取仓库中指定路径的文件内容
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的文件读取工具

#### Scenario: 列出分支
- **WHEN** 需要查看仓库的所有分支列表
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的列出分支工具

### Requirement: GitHub 代码搜索

deepstorm-mcp-github-read skill SHALL 提供通过 GitHub MCP 搜索代码的操作指南。

#### Scenario: 搜索代码片段
- **WHEN** 需要在仓库范围内搜索包含特定关键词的代码
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的代码搜索工具

#### Scenario: 搜索 Issue 和 PR
- **WHEN** 需要按关键词、状态、作者等条件搜索 Issue 或 PR
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的 Issue/PR 搜索工具

### Requirement: GitHub Issue 与 PR 查看

deepstorm-mcp-github-read skill SHALL 提供查看 GitHub Issue 和 PR 详情的操作指南。

#### Scenario: 查看 PR 详情
- **WHEN** 需要查看 PR 的描述、变更文件列表、评论和检查状态
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的获取 PR 详情工具

#### Scenario: 查看 Issue 详情
- **WHEN** 需要查看 Issue 的描述和全部评论
- **THEN** skill 指南 SHALL 说明如何调用 GitHub MCP 的获取 Issue 详情工具

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-github-read skill SHALL 提供 GitHub MCP 代码托管不可用时的降级方式说明。

#### Scenario: 降级处理
- **WHEN** `code-hosting.available === false`
- **THEN** skill 指南 SHALL 说明降级为使用 `gh` CLI 命令替代
