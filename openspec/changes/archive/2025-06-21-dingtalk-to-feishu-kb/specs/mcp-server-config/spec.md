## MODIFIED Requirements

### Requirement: 知识管理 — 飞书知识库

**From**: 钉钉云文档 **To**: 飞书知识库

- **SHALL** domain 为 `knowledge-base`
- **SHALL** 配置名为 `feishu-wiki`
- **SHALL** MCP 包为 `feishu-wiki`（或对应 npm 包名）
- **SHALL** 要求用户配置 `DEEPSTORM_FEISHU_TOKEN` 环境变量
- **SHALL** env stub 注释为 "飞书机器人 Token — 从飞书开放平台 > 应用凭证获取"

#### Scenario: 飞书知识库 MCP 启动
- **WHEN** 飞书知识库 MCP server 被启动
- **THEN** 执行命令为 `npx -y dotenv-cli -e .env -- npx -y feishu-wiki`
- **AND** 从 `.env` 中读取 `DEEPSTORM_FEISHU_TOKEN` 映射为 `FEISHU_TOKEN`

### Requirement: 知识管理 — 钉钉云文档（废弃）

**Reason**: 钉钉云文档知识库 provider 已由飞书知识库替代。
**Migration**: 配置项 `dingtalk-wiki` 变更为 `feishu-wiki`；环境变量 `DEEPSTORM_DINGTALK_TOKEN` 变更为 `DEEPSTORM_FEISHU_TOKEN`；MCP 技能从 `deepstorm-mcp-dingtalk-wiki-{read,write}` 迁移至 `deepstorm-mcp-feishu-wiki-{read,write}`。

## ADDED Requirements

### Requirement: 注册表构建更新

build-registry SHALL 在扫描 MCP 配置时同时支持 `feishu-wiki`，不再注册 `dingtalk-wiki`。

#### Scenario: 构建后 registry 中不包含 dingtalk-wiki
- **WHEN** 运行 `node scripts/build-registry.mjs`
- **THEN** registry.json 的 `mcpTools` 字段中包含 `feishu-wiki` 替代 `dingtalk-wiki`
- **AND** registry.json 的 `mcpTools` 中不包含 `dingtalk-wiki`
