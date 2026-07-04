> **⚠️ DEPRECATED**: This spec describes `deepstorm-mcp-dingtalk-wiki-read`, which has been replaced by `deepstorm-mcp-feishu-wiki-read` (see `openspec/specs/deepstorm-mcp-feishu-wiki-read/spec.md`). Retained for historical reference only.

## ADDED Requirements

### Requirement: 钉钉文档搜索

deepstorm-mcp-dingtalk-wiki-read skill SHALL 提供通过钉钉云文档 MCP 搜索文档的操作指南。

#### Scenario: 按关键词搜索文档
- **WHEN** 需要查找与某需求相关的 PRD 或设计文档
- **THEN** skill 指南 SHALL 说明如何调用钉钉云文档 MCP 的搜索工具，传入关键词并获取匹配结果列表和摘要

### Requirement: 钉钉文档内容读取

deepstorm-mcp-dingtalk-wiki-read skill SHALL 提供读取钉钉云文档内容的操作指南。

#### Scenario: 通过链接读取文档
- **WHEN** 用户或 Issue 描述中提供了钉钉云文档链接
- **THEN** skill 指南 SHALL 说明如何从链接中提取文档标识符，调用钉钉云文档 MCP 的读取工具获取完整内容（Markdown 格式）

#### Scenario: 通过文档 ID 读取
- **WHEN** 搜索结果的文档 ID 可直接用于读取
- **THEN** skill 指南 SHALL 说明如何使用文档 ID 调用读取工具

### Requirement: PRD 上下文提取

deepstorm-mcp-dingtalk-wiki-read skill SHALL 指导如何从读取到的 PRD 文档中提取关键上下文信息。

#### Scenario: 提取结构化信息
- **WHEN** 文档内容已读取
- **THEN** skill 指南 SHALL 说明提取以下结构：需求背景和目标、功能范围定义、验收标准、关键决策记录

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-dingtalk-wiki-read skill SHALL 提供知识库 MCP 不可用时的降级方式说明。

#### Scenario: 降级处理
- **WHEN** `knowledge_base.available === false`
- **THEN** skill 指南 SHALL 说明如何询问用户是否手动提供 PRD 内容
