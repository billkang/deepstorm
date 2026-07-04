## ADDED Requirements

### Requirement: 飞书文档创建与更新

deepstorm-mcp-feishu-wiki-write skill SHALL 提供通过飞书知识库 MCP 创建和更新文档的操作指南。

#### Scenario: 创建新文档
- **WHEN** 需要将 PRD 推送到知识库（如 tide-discuss 发布 PRD）
- **THEN** skill 指南 SHALL 说明如何调用飞书知识库 MCP 的创建文档工具，指定知识库或目录、标题和 Markdown 内容

#### Scenario: 更新已有文档
- **WHEN** 需要修改已有文档的内容
- **THEN** skill 指南 SHALL 说明如何调用飞书知识库 MCP 的更新文档工具

### Requirement: 多 Provider 选择

deepstorm-mcp-feishu-wiki-write skill SHALL 说明当有多个知识库 provider 时的选择逻辑。

#### Scenario: 单一 provider 自动推送
- **WHEN** `knowledge_base.available === true` 且只有一个 provider
- **THEN** skill 指南 SHALL 说明自动使用该 provider 执行推送，无需用户选择

#### Scenario: 多 provider 用户选择
- **WHEN** `knowledge_base.available === true` 且有 2 个或以上 provider
- **THEN** skill 指南 SHALL 说明展示可用列表供用户选择

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-feishu-wiki-write skill SHALL 提供知识库 MCP 不可用时的降级方式说明。

#### Scenario: 降级处理
- **WHEN** `knowledge_base.available === false`
- **THEN** skill 指南 SHALL 说明跳过知识库写入操作，在 checklist 中记录为 skipped
