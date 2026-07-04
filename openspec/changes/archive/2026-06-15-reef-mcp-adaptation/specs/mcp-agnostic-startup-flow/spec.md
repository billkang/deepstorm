# MCP 无关启动流程

## Purpose

reef-start 的 Stage 1（需求获取阶段）不再假设 Jira、DingTalk、Figma 这三个特定 MCP 服务存在，而是根据能力映射动态适配——运行时检查 issue_tracker / knowledge_base / design_tools 三个能力域的可用 provider，按可用性决定执行路径。

## Requirements

### Requirement: SKILL.md.tmpl 声明 reef-start 的 MCP 能力依赖

reef-start 的 SKILL.md SHALL 通过 frontmatter 声明其所需的 MCP 能力领域，注册为 `.tmpl` 模板文件。声明的能力包括 issue_tracker、knowledge_base、design_tools 三个域。

#### Scenario: 声明三个能力域

- **WHEN** SKILL.md.tmpl 的 frontmatter 包含 `mcpCapabilities`，且声明 `issue_tracker.domain: "project-management"`、`knowledge_base.domain: "knowledge-base"`、`design_tools.domain: "design-tools"`
- **THEN** setup 流程在安装 reef-start 时 SHALL 按这三个域过滤已安装 MCP 服务
- **THEN** 构建的能力映射 JSON SHALL 包含这三个能力的可用 provider 信息

#### Scenario: 部分域无可用服务

- **WHEN** 用户只安装了 Jira（project-management），未安装知识库和设计工具
- **THEN** 能力映射中 `issue_tracker` 包含可用 provider
- **THEN** 能力映射中 `knowledge_base` 和 `design_tools` 的 provider 数组为空

---

### Requirement: Stage 1 运行时动态获取需求

reef-start 的 Stage 1 SHALL 在启动时读取 `.claude/settings.json` 中的 `deepstorm.installedMcpServers`，与渲染后的能力映射 JSON 交叉匹配，根据可用的 MCP 服务动态适配需求获取路径。

#### Scenario: issue_tracker 可用时正常获取 Issue

- **WHEN** 能力映射中发现有可用的 issue_tracker provider
- **THEN** AI SHALL 读取 `.claude/skills/mcp-{provider.id}/SKILL.md` 了解工具调用方式
- **THEN** AI SHALL 使用该 MCP 工具的 get_issue（或等效）方法获取需求详情
- **THEN** 提取的 Issue 元数据写入 `jira` 字段（保持向后兼容）

#### Scenario: 无可用 issue_tracker 时降级

- **WHEN** 能力映射中 issue_tracker 的 provider 数组为空
- **THEN** AI SHALL 提示用户"未检测到 Issue 跟踪服务"
- **THEN** AI SHALL 请求用户手动粘贴需求描述和链接
- **THEN** 流程继续执行 Stage 1 的后续步骤（需求澄清等）

#### Scenario: knowledge_base 可用时读取 PRD

- **WHEN** 能力映射中发现有可用的 knowledge_base provider
- **THEN** AI SHALL 从 Issue 描述中搜索知识库链接
- **THEN** AI SHALL 使用该 MCP 工具的文档读取方法获取 PRD 上下文
- **THEN** PRD 上下文整合到 proposal 文档中

#### Scenario: 无可用 knowledge_base 时跳过 PRD

- **WHEN** 能力映射中 knowledge_base 的 provider 数组为空
- **THEN** AI SHALL 跳过 PRD 上下文获取
- **THEN** AI SHALL 告知用户"未检测到知识库服务，将基于 Issue 描述生成 proposal"

#### Scenario: design_tools 可用时获取设计稿

- **WHEN** 能力映射中发现有可用的 design_tools provider
- **THEN** AI SHALL 从 Issue 的 Design 字段或描述中提取设计工具链接
- **THEN** AI SHALL 使用该 MCP 工具的设计数据获取方法拉取设计信息
- **THEN** 设计数据整合到 design.md 中

#### Scenario: 无可用 design_tools 时跳过设计稿

- **WHEN** 能力映射中 design_tools 的 provider 数组为空
- **THEN** AI SHALL 跳过设计稿获取
- **THEN** AI SHALL 告知用户"未检测到设计工具服务，将不生成设计稿摘要"

---

### Requirement: 多个同域 provider 时由 AI 自动处理

当某能力域有多个可用 provider 时，AI SHALL 根据 Issue 或用户输入自动判断使用哪个，而非要求用户选择（与 Tide 的多 provider 选择不同，Reef 是"读"而非"写"，不应增加用户负担）。

#### Scenario: 多 issue_tracker

- **WHEN** 能力映射中 issue_tracker 有 2 个可用 provider（如 jira 和 linear）
- **THEN** AI SHALL 从用户输入中推断使用哪个（如用户提到 "Jira"、"linear"、"Jira issue LC-1234" 等关键词）
- **THEN** 推断不出时 SHALL 询问用户使用哪个
- **THEN** 选择结果在整个 session 中无需重复询问

#### Scenario: 多 design_tools

- **WHEN** 能力映射中 design_tools 有 2 个可用 provider
- **THEN** AI SHALL 从 Issue 的 Design 字段中推断使用哪个
- **THEN** 推断不出时 SHALL 询问用户
