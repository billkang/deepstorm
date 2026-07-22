## ADDED Requirements

### Requirement: Claude Agent SDK 初始化模板
Claude Agent SDK 集成层 SHALL 提供标准化的 Agent 初始化模板，包括 SDK 配置和基础 Agent 骨架代码。

#### Scenario: Agent 初始化代码生成
- **WHEN** 用户启用了 Claude Agent SDK
- **THEN** 生成的 `AgentModule` SHALL 提供 `AgentService.ask(question: string)` 方法
- **THEN** Agent 初始化 SHALL 使用 `process.env.ANTHROPIC_API_KEY` 读取 API Key
- **THEN** Agent 配置 SHALL 支持自定义 `model`、`maxTokens`、`temperature` 参数
- **THEN** 生成的代码 SHALL 包含一个可运行的 Health Check 示例

### Requirement: Tool 定义规范
Claude Agent SDK 集成 SHALL 提供 Tool 定义的规范和模板，指导用户如何为 Agent 注册自定义工具。

#### Scenario: Tool 定义结构
- **WHEN** 用户创建一个新的 Tool
- **THEN** Tool SHALL 使用类型安全的函数签名定义工具（`name`、`description`、`input_schema`）
- **THEN** Tool 的 `input_schema` SHALL 使用 Zod schema 或 TypeScript 类型定义输入参数
- **THEN** Tool 实现 SHALL 包含完整的错误处理（try/catch 和友好的错误返回）

#### Scenario: Tool 注册到 Agent
- **WHEN** 用户定义了一个或多个 Tool
- **THEN** Tool SHALL 通过 `tools` 参数注册到 Agent 实例
- **THEN** Agent 调用 Tool 后 SHALL 正确处理 Tool 结果

### Requirement: MCP Server 集成规范
Claude Agent SDK 集成 SHALL 提供 MCP Server 的配置和使用规范。

#### Scenario: MCP Client 配置
- **WHEN** 用户需要在 Agent 中连接 MCP Server
- **THEN** MCP Server 配置 SHALL 通过环境变量管理连接参数
- **THEN** MCP Client 初始化 SHALL 包含连接失败重试逻辑

#### Scenario: NestJS 集成模式
- **WHEN** 在 NestJS 项目中使用 Claude Agent SDK
- **THEN** MCP Client SHALL 作为 Provider 注入到 NestJS 的 DI 容器中
- **THEN** Agent 调用 SHALL 通过 Service 层封装，不暴露原始 SDK 调用到 Controller

### Requirement: Claude Agent SDK 开发 Skill
Claude Agent SDK SHALL 提供独立的开发 skill，指导用户在项目中开发和调试 Agent。

#### Scenario: Skill 内容覆盖
- **WHEN** 用户在启用 Claude Agent SDK 后查看 skill 文档
- **THEN** skill SHALL 包含 Agent 初始化步骤
- **THEN** skill SHALL 包含 Tool 定义和注册的示例
- **THEN** skill SHALL 包含 MCP Server 集成的步骤
- **THEN** skill SHALL 包含常见错误排查指南

#### Scenario: Skill 放置位置
- **WHEN** CLI 完成安装
- **THEN** Claude Agent SDK 开发 skill SHALL 放置在 `.claude/skills/reef-claude-agent-sdk/SKILL.md`
- **THEN** skill SHALL 使用 `SKILL.md.tmpl` 模板渲染生成
