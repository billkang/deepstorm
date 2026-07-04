# setup-wizard Specification

## MODIFIED Requirements

### Requirement: 工具套件选择（新 Step 1）

CLI SHALL 在 setup 流程的第一步展示所有可用工具套件的多选列表，用户通过空格切换选中、回车确认。工具选择完成后，再进入 MCP 服务和问卷步骤。

#### Scenario: 正常选择多个工具
- **WHEN** 用户运行 `npx @deepstorm/cli setup`
- **THEN** CLI 首先展示工具列表（tide / reef / sweep / atoll），每项带描述
- **THEN** 用户按空格选中 reef 和 tide，回车确认
- **THEN** CLI 进入 Step 2（MCP 服务选择），MCP 列表仅展示与已选工具相关的 MCP 选项

#### Scenario: 全部不选直接退出
- **WHEN** 用户运行 `setup` 且未选择任何工具直接回车
- **THEN** CLI SHALL 直接退出，不做任何操作，不创建任何文件

#### Scenario: 只选工具不选 MCP
- **WHEN** 用户选择了 reef 和 tide
- **AND** 在 MCP 选择步骤中未选择任何 MCP 服务
- **THEN** CLI 仅安装所选工具的 skills/agents/hooks
- **AND** 不生成 `.mcp.json` 和 MCP 相关的 env stub
- **AND** 进入 Step 3 问卷，仅展示已选工具的 wizard.json 问题

### Requirement: MCP 外部服务选择（新 Step 2）

CLI SHALL 在工具套件选择之后，根据已选工具动态展示可选的 MCP 外部服务列表（如 Jira、GitHub、Figma、钉钉云文档、Context7 等），每项标注来源工具。用户可通过空格切换选中、回车确认。

#### Scenario: 根据已选工具过滤 MCP 列表
- **WHEN** 用户在 Step 1 中选择了 tide 和 reef
- **THEN** MCP 选择列表展示 tide 和 reef 关联的 MCP 服务（Jira、钉钉云文档、Figma、GitHub、Context7）
- **AND** 每项标注来源（如 "Jira — 被 tide, reef 依赖"）
- **AND** 用户按空格切换选中状态，回车确认

#### Scenario: 选择 MCP 外部服务
- **WHEN** 用户选择了相应的 MCP 服务
- **THEN** 选中的服务中，含 `mcpServers` 的（如 Jira、GitHub）合并配置到 `.mcp.json`（以 `deepstorm-{name}` 命名避免冲突）
- **THEN** 选中的服务中，纯 env 类（如 Context7）仅生成环境变量 stub，不写入 `.mcp.json`
- **THEN** 选中的服务对应的 `mcp-skills/` 使用指南 skill 安装到 `.claude/skills/`
- **THEN** 选中的服务对应的环境变量 stub 追加到 `.env`
- **THEN** 全部不选则跳过 MCP 配置，不影响后续安装流程
- **THEN** `setup --non-interactive` 模式下通过 `--mcp-tools` 参数传递（如 `--mcp-tools jira,github,context7`）

#### Scenario: MCP 列表为空
- **WHEN** 用户选择了 atoll（仅关联 jira 和 dingding）
- **AND** 但 jira 和 dingding 尚未创建为 MCP 服务
- **THEN** MCP 选择步骤直接跳过，不展示空列表
- **AND** 进入 Step 3 问卷

### Requirement: 每个工具按 wizard.json 引导配置（新 Step 3）

每个工具的配置项由该工具包下的 `wizard.json` 定义，CLI SHALL 读取该文件并渲染问答。问卷仅展示已选工具的技术选型问题。

#### Scenario: 工具专属配置引导
- **WHEN** 用户选择了 reef 工具
- **THEN** CLI 读取 `registry.json` 中 reef 的 `wizard` 定义
- **THEN** CLI 按 `questions` 数组顺序渲染问题
- **THEN** multiselect（如 `reef.techs`）后的问题合并为 `p.group()` 表单一页展示全部子问题，支持条件依赖（`dependsOn`）控制可见性
- **THEN** 每个问题的选项来自 `options` 列表
- **THEN** 每个 `select` 问题 SHALL 包含 `value: "none"` 的兜底选项（label 为"不选择"/"不使用"/"不配置"），供用户反悔或跳过
- **THEN** 用户选择 `"none"` 表示该配置未启用，对应模板变量为空字符串，SKILL.md 中 `{{#if}}` 自动跳过该维度

#### Scenario: 仅展示已选工具的问卷
- **WHEN** 用户选择了 reef 和 sweep
- **THEN** CLI 只展示 reef 和 sweep 的 wizard.json 问题
- **AND** tide 和 atoll 的问题不展示

#### Scenario: 已在前置工具中配过的公共能力跳过
- **WHEN** tide 已配置了 Jira 集成
- **THEN** CLI 进入 atoll 配置时，跳过 Jira 相关的问题
- **THEN** CLI 提示 "Jira 已在 tide 中配置，跳过"

## ADDED Requirements

### Requirement: 工具→MCP 映射定义

CLI SHALL 维护工具套件到 MCP 服务的映射关系，用于在 Step 2 中根据已选工具动态过滤 MCP 列表。

#### Scenario: 映射规则生效
- **WHEN** 用户选择了 tide
- **THEN** MCP 选择列表包含：jira、dingding（钉钉云文档）、figma
- **WHEN** 用户选择了 reef
- **THEN** MCP 选择列表包含：jira、dingding、figma、github、context7
- **WHEN** 用户选择了 sweep
- **THEN** MCP 选择列表包含：jira、dingding、playwright
- **WHEN** 用户选择了 atoll
- **THEN** MCP 选择列表包含：jira、dingding

#### Scenario: 多个工具共享 MCP 服务
- **WHEN** 用户同时选择了 tide 和 reef
- **THEN** MCP 选择列表展示并集：jira、dingding、figma、github、context7
- **AND** jira 标注为"被 tide, reef 依赖"
- **AND** 去重展示（不重复列出同一个服务）

### Requirement: 非交互模式兼容新流程

CLI SHALL 在 `--non-interactive` 模式下支持新的三步流程，保持 `--tools` 和 `--mcp-tools` 参数兼容。

#### Scenario: 非交互模式新流程
- **WHEN** 用户运行 `deepstorm setup --non-interactive --tools reef,sweep --mcp-tools jira,github,playwright --set reef.frontend.framework=react`
- **THEN** CLI 按新三步流程处理：先识别工具 reef,sweep → 启用对应 MCP → 应用问卷配置
- **AND** 输出结果与原流程一致

#### Scenario: MCP 参数与工具不一致
- **WHEN** 用户运行 `--non-interactive --tools reef --mcp-tools playwright`
- **AND** Playwright 与 reef 无映射关系
- **THEN** CLI SHALL 忽略不与已选工具关联的 MCP 服务
- **AND** 输出警告："Playwright 与已选工具无关联，已忽略"
