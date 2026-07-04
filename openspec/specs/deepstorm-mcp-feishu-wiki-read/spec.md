## ADDED Requirements

### Requirement: 飞书文档搜索

deepstorm-mcp-feishu-wiki-read skill SHALL 提供通过飞书知识库 MCP 搜索文档的操作指南。

#### Scenario: 按关键词搜索文档
- **WHEN** 需要查找与某需求相关的 PRD 或设计文档
- **THEN** skill 指南 SHALL 说明如何调用飞书知识库 MCP 的搜索工具，传入关键词并获取匹配结果列表和摘要

### Requirement: 飞书文档内容读取

deepstorm-mcp-feishu-wiki-read skill SHALL 提供读取飞书知识库文档内容的操作指南。

#### Scenario: 通过链接读取文档
- **WHEN** 用户或 Issue 描述中提供了飞书文档链接
- **THEN** skill 指南 SHALL 说明如何从链接中提取文档标识符，调用飞书知识库 MCP 的读取工具获取完整内容（Markdown 格式）

#### Scenario: 通过文档 ID 读取
- **WHEN** 搜索结果的文档 ID 可直接用于读取
- **THEN** skill 指南 SHALL 说明如何使用文档 ID 调用读取工具

### Requirement: PRD 上下文提取

deepstorm-mcp-feishu-wiki-read skill SHALL 指导如何从读取到的 PRD 文档中提取关键上下文信息。

#### Scenario: 提取结构化信息
- **WHEN** 文档内容已读取
- **THEN** skill 指南 SHALL 说明提取以下结构：需求背景和目标、功能范围定义、验收标准、关键决策记录
