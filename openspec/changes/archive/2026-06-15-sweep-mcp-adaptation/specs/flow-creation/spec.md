## MODIFIED Requirements

### Requirement: Skill 通过 issue_tracker + knowledge_base 能力域动态获取验收标准

Flow-creation skill（`/sweep:plan`）SHALL 不在 SKILL.md 中硬编码特定 MCP 服务名称，而是通过 SKILL.md.tmpl 的 `mcpCapabilities` frontmatter 声明 `issue_tracker` 和 `knowledge_base` 两个能力域。运行时 AI 通过 `.claude/settings.json` 的 `deepstorm.installedMcpServers` 交叉匹配已渲染的能力映射 JSON，根据可用的 MCP 服务动态适配测试需求获取路径。

#### Scenario: 通过 Issue 链接获取（issue_tracker 可用）

- **WHEN** 用户执行 `/sweep:plan`
- **AND** 项目已通过 setup 初始化
- **AND** 用户提供 Issue 链接
- **AND** 能力映射中 `issue_tracker.available === true`
- **THEN** AI SHALL 读取 `.claude/skills/mcp-{provider.id}/SKILL.md` 了解工具调用方式
- **AND** AI SHALL 使用该 MCP 工具的 get_issue（或等效）方法获取 Issue 内容
- **AND** AI SHALL 从 Issue 中提取功能描述、验收标准和关联的 PRD 链接
- **AND** 如 Issue 中包含知识库 PRD 链接，继续按 Scenario: 通过知识库获取 PRD（knowledge_base 可用）流程处理

#### Scenario: 通过知识库获取 PRD（knowledge_base 可用）

- **WHEN** AI 从 Issue 中提取到 PRD 链接
- **AND** 能力映射中 `knowledge_base.available === true`
- **THEN** AI SHALL 从 Issue 描述中搜索知识库链接
- **AND** AI SHALL 使用可用 knowledge_base MCP 工具读取文档内容
- **AND** AI SHALL 提取验收标准列表、业务规则、功能范围定义等上下文

#### Scenario: 知识库 MCP 不可用

- **WHEN** 能力映射中 `knowledge_base.available === false`
- **THEN** AI SHALL 告知用户"未检测到知识库服务，将基于 Issue/用户输入生成测试需求"
- **AND** AI SHALL 提示用户手动提供 PRD 关键内容（验收标准、业务规则）作为后备输入

#### Scenario: issue_tracker 不可用

- **WHEN** 能力映射中 `issue_tracker.available === false`
- **THEN** AI SHALL 提示用户"未检测到 Issue 跟踪服务"
- **AND** AI SHALL 请求用户直接描述业务场景和测试需求，或手动粘贴需求描述

#### Scenario: 无链接直接描述

- **WHEN** 用户没有 Issue 或 PRD 链接
- **AND** 所有能力域均不可用
- **THEN** AI SHALL 提示用户直接描述业务场景和测试需求

#### Scenario: 项目未初始化

- **WHEN** 用户执行 `/sweep:plan`
- **AND** 项目尚未通过 setup 初始化
- **THEN** AI SHALL 提示"当前目录尚未初始化为 Sweep 测试项目。请先运行 /sweep:init 初始化。"并退出

#### Scenario: SKILL.md.tmpl 声明能力域

- **WHEN** SKILL.md.tmpl 的 frontmatter 包含 `mcpCapabilities`
- **AND** 声明 `issue_tracker.domain` 和 `knowledge_base.domain`
- **THEN** setup 流程在安装 sweep-plan 时 SHALL 按这两个域过滤已安装 MCP 服务
- **AND** 构建的能力映射 JSON SHALL 包含 `issue_tracker` 和 `knowledge_base` 的可用 provider 信息
- **AND** 模板变量 `{{sweep_capabilities}}` 渲染为能力映射 JSON
