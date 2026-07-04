## Why

Tide 的发布流程（Step 4）当前硬编码了钉钉云文档（4a 知识库推送）和 Jira（4c 创建工单）。在 CLI 已经支持用户按领域配置 MCP 服务的架构下，Tide 无法感知用户实际安装了哪些外部服务——装了钉钉没装 Jira 时会报错，想用 GitHub Issues 替代 Jira 则不可能。Tide 需要从「硬编码具体服务」转变为「MCP 感知的动态流程」，根据用户实际安装的 MCP 服务自适应发布流程。

## What Changes

### New Capabilities

- **`mcp-capability-discovery`**: Skill 声明自身依赖的 MCP 能力领域（knowledge-base、project-management），安装时由 CLI 读取用户安装的 MCP 服务列表，按领域过滤后生成能力映射 JSON 注入到 SKILL.md 中。运行时 AI 通过交叉引用 `installedMcpServers` 确定当前可用的具体服务。
- **`dynamic-publish-flow`**: Step 4 发布流程不再假定钉钉和 Jira 存在，而是根据能力映射动态适配——知识库可用则执行 4a，否则跳过；工单系统可用则执行 4b+4c，否则跳过。当多个工单系统可用时，在 4b 入口询问用户选择。
- **`service-agnostic-data-format`**: Session JSON 新增 `services` 命名空间（含 `knowledgeBase`、`issueTracker`）统一记录外部服务链接和任务清单，取代原有硬编码的 `dingtalkUrl`、`jiraUrls`。`publishChecklist` 步骤名也改为通用名称。

### Modifications

- **tide-discuss SKILL.md → SKILL.md.tmpl**：从纯静态 Markdown 转换为模板文件，安装时注入能力映射
- **CLI setup 流程增强**：`installAllToolAssets` 增加解析 frontmatter → 按 `mcpCapabilities` 过滤 → 生成 `tide_capabilities` JSON 变量的逻辑
- **新增 `deepstorm config refresh` 命令**：用户增减 MCP 后，无需全量 `--reconfigure`，只需一次性刷新所有已安装工具的 .tmpl → SKILL.md
- **config-schema.json**：移除 `tide.issueTracker` 枚举（不再需要）

### Removals

- **BREAKING**: `publishChecklist` 步骤名 `dingtalk_push` → `knowledge_base_push`、`jira_task_split` → `issue_task_split`、`create_jira_issues` → `create_issues`（旧归档 session 读取时通过降级兼容）
- **BREAKING**: 新增 `services` 命名空间，`dingtalkUrl` / `jiraUrls` 字段保留为向后兼容别名

## Capabilities

### New Capabilities
- `mcp-capability-discovery`: Tide 在安装时声明所需的 MCP 能力领域，CLI 按领域过滤用户已安装的 MCP 服务，生成能力映射 JSON；运行时 AI 交叉读取 `installedMcpServers` 获取最新状态
- `dynamic-publish-flow`: Step 4 各步骤（knowledge_base_push、issue_task_split、create_issues）根据能力映射动态执行或跳过；多可选时由用户选择
- `service-agnostic-data-format`: 通用 `services` 命名空间持久化外部服务链接和任务清单

### Modified Capabilities
- `tide-core`: session 状态流转依赖的 `publishChecklist` 步骤名和服务链接字段改为通用化，新增 `services` 字段

## Impact

| 影响域 | 影响范围 |
|--------|---------|
| `packages/tide/skills/tide-discuss/SKILL.md` | 静态文件 → SKILL.md.tmpl，新增 frontmatter `mcpCapabilities` |
| `packages/tide/skills/tide-discuss/references/publish-flow.md` | 全部重写为 MCP 感知流程 |
| `packages/tide/skills/tide-discuss/references/data-format.md` | 扩展 `services` 命名空间，更新 `publishChecklist` 定义 |
| `packages/tide/skills/tide-discuss/references/session-ops.md` | 更新恢复路径适配新 publishChecklist 语义 |
| `packages/tide/wizard.json` | 新建（极简声明） |
| `packages/cli/src/template/registry.ts` | `buildTemplateVariables` 保持不动；新增 `buildMcpCapabilities` 工具函数 |
| `packages/cli/src/commands/setup.ts` | `installAllToolAssets` 增加 frontmatter 解析 + MCP 过滤 + JSON 生成 |
| `packages/cli/src/commands/config.ts` | 新增 `refresh` 子命令 |
| `packages/cli/config-schema.json` | 移除 `tide.issueTracker` |
| 旧归档 session 文件 | 向后兼容（降级读取 `dingtalkUrl` / `jiraUrls`） |
