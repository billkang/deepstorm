## Why

钉钉云文档在项目协作中存在 API 稳定性与生态适配上的限制，且团队已切换至飞书进行日常协作。将知识库 provider 从钉钉云文档统一替换为飞书知识库，可降低 MCP 集成维护成本，使发布/读取链路与团队实际协作工具一致。

## What Changes

- **新增** `feishu-wiki` MCP 服务配置（含读取与写入工具）
- **废弃** `dingtalk-wiki` MCP 服务（删除配置、技能文件、环境变量示例） **BREAKING**
- **新增** `DEEPSTORM_FEISHU_TOKEN` / `FEISHU_WEBHOOK_TOKEN` 环境变量支持
- **删除** `DEEPSTORM_DINGTALK_TOKEN` / `DINGTALK_WEBHOOK_TOKEN` 环境变量引用 **BREAKING**
- **重命名** MCP 技能：`deepstorm-mcp-dingtalk-wiki-read` → `deepstorm-mcp-feishu-wiki-read`
- **重命名** MCP 技能：`deepstorm-mcp-dingtalk-wiki-write` → `deepstorm-mcp-feishu-wiki-write`
- **更新** 各套件 `wizard.json` 中的 `mcpSkills` 引用
- **更新** 构建注册表 `build-registry.ts` 中的 MCP 依赖列表
- **更新** 所有 README、SKILL.md.tmpl、reference 文档中涉及钉钉云文档的说明
- **更新** 测试文件中的 provider 名称与断言
- **废弃** openspec/specs/ 下 `deepstorm-mcp-dingtalk-wiki-read` 与 `deepstorm-mcp-dingtalk-wiki-write` 两个 spec（标记为废弃，或替换为 feishu 对应 spec）

## Capabilities

### New Capabilities

- `feishu-wiki-read`: 飞书知识库文档搜索与读取能力，替换 dingtalk-wiki-read
- `feishu-wiki-write`: 飞书知识库文档创建与更新能力，替换 dingtalk-wiki-write

### Modified Capabilities

- `mcp-server-config`: 新增 feishu-wiki MCP server 配置项，移除 dingtalk-wiki 配置
- `feature-toggle`: `dingtalkUpload` feature toggle 替换为 `feishuUpload`
- `service-agnostic-data-format`: 数据格式中 dingtalkUrl 字段的映射关系更新为 feishuUrl
- `tide-core`: Tide 发布流程中知识库 provider 从钉钉云文档切换为飞书
- `setup-wizard`: 安装向导中 provider 选项列表从 dingtalk-wiki 替换为 feishu-wiki
- `dynamic-publish-flow`: 动态发布流程中 provider 选择逻辑更新

## Impact

| 领域 | 影响 |
|------|------|
| **MCP 配置** | 新增 `mcp/knowledge-base/feishu-wiki.json`，删除 `dingtalk-wiki.json` |
| **MCP 技能** | 2 个技能文件重命名 + 内容完全重写（飞书 API 替代钉钉 API） |
| **环境变量** | 新增 `FEISHU_WEBHOOK_TOKEN`，删除 `DINGTALK_WEBHOOK_TOKEN` |
| **CLI 源码** | `build-registry.ts`、`registry.ts` 中的 MCP 依赖列表更新 |
| **测试文件** | 5 个测试文件中的 provider 名称、断言、mock 数据更新 |
| **文档** | 4 个 README + 6 个 SKILL.md.tmpl + 多个 reference 文档 |
| **套件配置** | tide/reef/sweep 的 `wizard.json` 中 `mcpSkills` 更新 |
| **环境示例** | `env-examples/dingtalk-wiki.env-example` 替换为 `feishu-wiki.env-example` |
| **构建产物** | `dist/` 中对应的文件需重建 |
