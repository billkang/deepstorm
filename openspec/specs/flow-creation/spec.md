## ADDED Requirements

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

---

### Requirement: Skill 根据功能模块拓扑定位放置位置

Flow-creation skill SHALL 在生成 .flow.md 前读取 topology.yaml，根据 PRD/Jira 内容推荐放置的模块目录，用户确认或手动选择。

#### Scenario: 读取拓扑文件
- **WHEN** skill 获取到测试需求上下文后
- **THEN** skill SHALL 读取 `flows/topology.yaml` 了解当前功能模块结构
- **AND** skill SHALL 根据 PRD/Jira 内容分析所属功能模块
- **AND** skill SHALL 向用户推荐放置位置

#### Scenario: 推荐位置
- **WHEN** skill 分析出合适的模块目录
- **THEN** skill SHALL 向用户展示推荐路径
- **AND** 用户确认后使用该路径

#### Scenario: 无合适位置
- **WHEN** skill 无法从 topology.yaml 中找到合适的模块目录
- **THEN** skill SHALL 列出 topology.yaml 中的所有可用模块
- **AND** 提供选项：放入现有模块 / 新建模块 / 按 Jira 任务名新建平级目录
- **AND** 如新建模块，SHALL 同步更新 topology.yaml

#### Scenario: .flow.md 文件命名
- **WHEN** skill 确定放置路径
- **THEN** skill SHALL 按功能模块名或 Jira Issue 键名命名文件（kebab-case）
- **AND** 如基于功能模块，命名如 `register.flow.md`
- **AND** 如基于 Jira 任务，命名如 `LC-1234-user-auth.flow.md`

---

### Requirement: Skill 交互式生成 .flow.md 测试意图文档

Flow-creation skill SHALL 通过结构化对话引导测试工程师逐步定义测试流程，并将结果输出为 .flow.md 格式的测试意图文档。

#### Scenario: 结构化场景挖掘
- **WHEN** skill 获取到 PRD 上下文后
- **THEN** skill SHALL 按以下维度逐项引导用户讨论测试场景：
  - 功能正常流程：用户最常用的路径
  - 边界条件：输入限制、状态切换、时限条件
  - 异常场景：网络超时、重复提交、权限不足等
- **AND** skill SHALL 在每个维度引导用户补充业务判断

#### Scenario: 生成 .flow.md 文件
- **WHEN** 场景讨论完成
- **THEN** skill SHALL 生成完整的 .flow.md 文件，包含：
  - 场景清单（ID、场景名、类型、优先级）
  - 每个场景的完整执行流程（前置条件、步骤、验证点）
  - 环境要求说明
- **AND** skill SHALL 将文件写入 `flows/` 目录

---

### Requirement: Skill 支持场景 Review

Flow-creation skill SHALL 在生成 .flow.md 后，通过 grill-me 方式挑战遗漏场景，确保覆盖完整。

#### Scenario: 质疑遗漏场景
- **WHEN** .flow.md 生成完成
- **THEN** skill SHALL 以 grill-me 方式逐项追问：
  - "这个场景的边界情况有哪些？"
  - "如果用户操作顺序颠倒会怎样？"
  - "数据量达到极限时表现如何？"
- **AND** 根据用户确认补充新的场景到 .flow.md

---

### Requirement: .flow.md 格式规范

.flow.md 文件 SHALL 遵循统一的 Markdown 格式规范，顶部包含场景清单表格，随后按 Flow 分组列出详细执行步骤。

#### Scenario: 场景清单格式
- **WHEN** .flow.md 文件生成
- **THEN** 顶部 SHALL 包含场景清单表格，至少包含：ID、场景名、类型、优先级
- **AND** 表格 SHALL 使用标准的 Markdown 表格语法

#### Scenario: Flow 执行步骤格式
- **WHEN** .flow.md 文件生成
- **THEN** 每个场景 SHALL 使用 `## Flow: {ID} - {标题}` 的二级标题开始
- **AND** 执行步骤 SHALL 使用有序列表
- **AND** 每个验证点 SHALL 使用 `✅ 验证点：{预期结果}` 格式
