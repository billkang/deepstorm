## MODIFIED Requirements

### Requirement: MCP 外部服务选择（新 Step 2）

**Modified**: MCP 服务列表中"钉钉云文档"替换为"飞书知识库"；provider ID 从 `dingding` 变更为 `feishu-wiki`。

CLI SHALL 在工具套件选择之后，根据已选工具动态展示可选的 MCP 外部服务列表（如 Jira、GitHub、飞书知识库、Context7 等），每项标注来源工具。

#### Scenario: 根据已选工具过滤 MCP 列表
- **WHEN** 用户在 Step 1 中选择了 tide 和 reef
- **THEN** MCP 选择列表展示 tide 和 reef 关联的 MCP 服务（Jira、飞书知识库、Figma、GitHub、Context7）
- **AND** 每项标注来源（如 "飞书知识库 — 被 tide, reef 依赖"）
- **AND** 用户按空格切换选中状态，回车确认

## ADDED Requirements

### Requirement: 工具→MCP 映射定义更新

**Modified mapping**: provider ID 从 `dingding` 变更为 `feishu-wiki`。

#### Scenario: 映射规则生效
- **WHEN** 用户选择了 tide
- **THEN** MCP 选择列表包含：jira、feishu-wiki（飞书知识库）、figma
- **WHEN** 用户选择了 reef
- **THEN** MCP 选择列表包含：jira、feishu-wiki、figma、github、context7
- **WHEN** 用户选择了 sweep
- **THEN** MCP 选择列表包含：jira、feishu-wiki、playwright
- **WHEN** 用户选择了 atoll
- **THEN** MCP 选择列表包含：jira、feishu-wiki

#### Scenario: 多个工具共享 MCP 服务
- **WHEN** 用户同时选择了 tide 和 reef
- **THEN** MCP 选择列表展示并集：jira、feishu-wiki、figma、github、context7
- **AND** 去重展示（不重复列出同一个服务）
