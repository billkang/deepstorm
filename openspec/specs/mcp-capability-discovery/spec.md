# MCP 能力发现

## Purpose

Tide 在安装时声明所需的 MCP 能力领域（knowledge-base、project-management），CLI 按领域过滤用户已安装的 MCP 服务，生成能力映射 JSON 注入到 SKILL.md 中。运行时 AI 通过交叉引用 `installedMcpServers` 确定当前可用的具体服务。

## Requirements

### Requirement: SKILL.md.tmpl 声明 MCP 能力依赖

tide-discuss 的 SKILL.md.tmpl SHALL 在 frontmatter 中以 `mcpCapabilities` 字段声明本 skill 额外依赖的 MCP 能力领域，每个能力包含 domain 映射名称，供安装时过滤使用。其中 `domain` 值对应 registry.json 中 MCP 工具的 `domain` 字段。

#### Scenario: 声明 knowledge-base 依赖

- **WHEN** SKILL.md.tmpl 的 frontmatter 包含 `mcpCapabilities.knowledge_base.domain: "knowledge-base"`
- **THEN** setup 流程在渲染该 skill 时，SHALL 只从 `installedMcpServers` 中选取 domain 为 `knowledge-base` 的 MCP 服务

#### Scenario: 声明 project-management 依赖

- **WHEN** SKILL.md.tmpl 的 frontmatter 包含 `mcpCapabilities.issue_tracker.domain: "project-management"`
- **THEN** setup 流程在渲染该 skill 时，SHALL 只从 `installedMcpServers` 中选取 domain 为 `project-management` 的 MCP 服务

#### Scenario: 声明 domain 与 registry 中 mcpTools.domain 不匹配时

- **WHEN** `mcpCapabilities` 中声明的 domain 值在 `registry.mcpTools` 中没有任何 MCP 服务属于该 domain
- **THEN** 该能力对应的 provider 列表为空，`buildMcpCapabilities` 输出空数组

---

### Requirement: 安装时计算 tide_capabilities JSON

CLI 的 `installAllToolAssets` 在渲染 SKILL.md.tmpl 前 SHALL 调用 `buildMcpCapabilities` 函数，根据 frontmatter 声明的 `mcpCapabilities` 和当前 `installedMcpServers` 计算过滤后的能力映射 JSON。

#### Scenario: 单 MCP 服务匹配

- **WHEN** frontmatter 声明 `knowledge_base` 依赖 domain `knowledge-base`，且 `installedMcpServers` 包含 `feishu-wiki`（domain = knowledge-base）
- **THEN** 生成的 JSON 中 `knowledge_base` 数组包含 `{"id":"feishu-wiki","name":"飞书知识库","skill":"mcp-feishu-wiki"}`
- **THEN** 该 JSON SHALL 作为 `tide_capabilities` 模板变量注入 SKILL.md.tmpl

#### Scenario: 多 MCP 服务匹配

- **WHEN** frontmatter 声明 `issue_tracker` 依赖 domain `project-management`，且 `installedMcpServers` 包含 `jira` 和 `linear`（均属于 project-management）
- **THEN** 生成的 JSON 中 `issue_tracker` 数组包含两个 provider 条目
- **THEN** `buildMcpCapabilities` 按 `registry.mcpTools` 中的顺序返回

#### Scenario: 无 MCP 服务匹配

- **WHEN** frontmatter 声明了 `knowledge_base` 和 `issue_tracker` 两个能力，但 `installedMcpServers` 为空
- **THEN** 生成的 JSON 中两个能力的 provider 数组均为空数组 `[]`
- **THEN** `tide_capabilities` 变量的值仍为合法的 JSON 结构

#### Scenario: 无关 MCP 服务被过滤

- **WHEN** frontmatter 只声明了 `issue_tracker`（project-management），但 `installedMcpServers` 包含 `figma`（design-tools）、`github`（code-hosting）
- **THEN** 生成的 JSON 中不包含 `figma` 和 `github`
- **THEN** 生成的 JSON 中 `issue_tracker` 数组为空（因无 project-management 服务匹配）

---

### Requirement: 运行时交叉引用 installedMcpServers

SKILL.md SHALL 指示 AI 在进入 Step 4 发布流程前，读取 `.claude/settings.json` 中 `deepstorm.installedMcpServers` 数组，与渲染的能力映射 JSON 交叉匹配，确定当前每个 provider 的实际可用性。

#### Scenario: 安装时渲染的 provider 当前仍在 installedMcpServers 中

- **WHEN** 能力映射 JSON 中含有 `{"id":"jira","name":"Jira","skill":"mcp-jira"}`
- **AND** `deepstorm.installedMcpServers` 当前包含 `"jira"`
- **THEN** AI 判定 Jira provider 当前可用

#### Scenario: 安装时渲染的 provider 已从 settings.json 中移除

- **WHEN** 能力映射 JSON 中含有 `{"id":"jira","name":"Jira","skill":"mcp-jira"}`
- **AND** `deepstorm.installedMcpServers` 当前不包含 `"jira"`
- **THEN** AI 判定 Jira provider 当前不可用
- **THEN** AI 不引用 mcp-jira skill，不尝试调用 Jira MCP 工具

#### Scenario: settings.json 读取失败

- **WHEN** `.claude/settings.json` 文件不存在、格式错误或 `deepstorm.installedMcpServers` 字段缺失
- **THEN** AI SHALL 降级为「无 MCP 服务安装」，后续所有步骤跳过
- **THEN** AI SHALL 提示用户"无法读取 MCP 配置，发布流程将跳过需外部服务的步骤"

---

### Requirement: buildMcpCapabilities 工具函数

CLI SHALL 在 `packages/cli/src/template/registry.ts` 中提供 `buildMcpCapabilities` 导出函数，接收 `frontmatterMcpCapabilities`、`installedMcpServers`、`registry.mcpTools` 三个参数，返回序列化的 JSON 字符串。

#### Scenario: 正常调用

- **WHEN** 传入 `frontmatterMcpCapabilities = {knowledge_base: {domain: "knowledge-base"}}`，`installedMcpServers = ["feishu-wiki"]`，且有对应的 `registry.mcpTools` 条目
- **THEN** 返回 `{"knowledge_base":[{"id":"feishu-wiki","name":"飞书知识库","skill":"mcp-feishu-wiki"}]}`
- **THEN** 返回值为合法的 JSON 字符串

#### Scenario: frontmatterMcpCapabilities 为空对象

- **WHEN** `frontmatterMcpCapabilities` 为 `{}`
- **THEN** 返回 `"{}"`

#### Scenario: installedMcpServers 为空数组

- **WHEN** `installedMcpServers` 为 `[]`
- **THEN** 返回的 JSON 中每个能力的 provider 数组均为空
