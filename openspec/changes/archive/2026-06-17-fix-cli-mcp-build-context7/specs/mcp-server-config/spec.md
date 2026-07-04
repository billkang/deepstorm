# mcp-server-config — Delta Specification

## MODIFIED Requirements

### Requirement: 文档参考 — Context7

The system SHALL provide MCP configuration for Context7 documentation reference service.

- **SHALL** domain 为 `docs-reference`
- **SHALL** 配置名为 `context7`
- **SHALL** 包含 `mcpServers` 字段，通过 `@upstash/context7-mcp` 启动
- **SHALL** 通过 `envStubs` 字段声明 `CONTEXT7_API_KEY`
- **SHALL** env stub 注释为 "Context7 API Key（ctx7sk_ 开头）— 从 https://context7.com/dashboard 获取"
- **SHALL NOT** 在 setup 多选页面中默认勾选

#### Scenario: Context7 在 build-registry 中可被解析
- **WHEN** build-registry 扫描 `packages/cli/mcp/docs-reference/context7.json`
- **THEN** 注册到 `registry.mcpTools["context7"]`，domain 为 `docs-reference`
- **AND** 在 setup 多选页面以 `文档参考 · Context7` 展示
- **AND** 生成 `deepstorm-context7` 的 `.mcp.json` 条目
- **AND** 用户选中后生成 `CONTEXT7_API_KEY=...` 的 env stub

#### Scenario: Context7 MCP 启动
- **WHEN** Context7 MCP server 被启动
- **THEN** 执行命令为 `npx -y dotenv-cli -e .env -- npx -y @upstash/context7-mcp`
- **AND** 从 `.env` 中读取 `CONTEXT7_API_KEY`

#### Scenario: Context7 不再默认勾选
- **WHEN** 用户运行 `deepstorm setup` 进入 MCP 多选页面
- **THEN** Context7 初始处于未选中状态
- **AND** 用户可以手动勾选
- **AND** 不勾选时不会写入任何 env stub 和 `.mcp.json` 条目
