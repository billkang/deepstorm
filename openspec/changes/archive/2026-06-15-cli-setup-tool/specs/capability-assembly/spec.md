## ADDED Requirements

### Requirement: 源目录结构标准

每个工具包 `packages/<tool>/` 下 SHALL 直接包含以下可选子目录（无 `capabilities/` 中间层级）：

```
packages/<tool>/
├── skills/     ← {tool}-{name}/SKILL.md（带 deepstorm frontmatter）
├── agents/     ← agent 定义
├── hooks/      ← hooks 配置
└── mcp/        ← MCP JSON 片段
```

#### Scenario: 目录结构验证
- **WHEN** `deepstorm doctor` 运行时
- **THEN** CLI 检查 `packages/<tool>/` 下的目录结构是否符合标准
- **THEN** CLI 输出每个工具包的 `skills/`、`agents/`、`hooks/`、`mcp/` 目录存在性

### Requirement: SKILL.md frontmatter 规范

每个可安装的 skill 的 SKILL.md SHALL 在 YAML frontmatter 中包含 `deepstorm:` 字段，声明其配置映射和依赖。

#### Scenario: frontmatter 结构
- **WHEN** CLI 解析 SKILL.md 的 frontmatter
- **THEN** `deepstorm.tool` 字段 SHALL 声明所属工具（如 `reef`）
- **THEN** `deepstorm.configKey` 字段 SHALL 声明对应的配置路径（如 `reef.frontend.framework`）
- **THEN** `deepstorm.configValue` 字段 SHALL 声明触发此 skill 的配置值（如 `react`）
- **THEN** `deepstorm.dependencies` 字段 SHALL 声明依赖的其他 skill（如 `["deepstorm-jira-parser"]`）
- **THEN** 没有 `deepstorm:` 字段的 SKILL.md 不被 CLI 识别为可安装 skill

#### Scenario: 共享 skill 命名
- **WHEN** skill 位于 `packages/shared/skills/` 下
- **THEN** 目录名称 SHALL 以 `deepstorm-` 开头（如 `deepstorm-jira-parser`）
- **THEN** 其 frontmatter 中的 `deepstorm.tool` 字段值 SHALL 为 `shared`

### Requirement: wizard.json 规范

每个工具包 SHALL 在根目录包含 `wizard.json`，定义该工具的问答流程。

#### Scenario: wizard.json 结构
- **WHEN** CLI 读取 `wizard.json`
- **THEN** `tool` 字段 SHALL 声明对应的工具名称
- **THEN** `questions` 数组 SHALL 按顺序定义问答项
- **THEN** 每个 question 的 `key` 字段 SHALL 对应配置路径
- **THEN** 每个 question 的 `options` 数组 SHALL 列出可选值

#### Scenario: 选项值对应 skill 映射
- **WHEN** 用户选择了 `wizard.json` 中的选项（如 `frontend.framework: react`）
- **THEN** CLI 将该配置值存入 `deepstorm` 命名空间，用于模板渲染时的变量注入（`{{configKey.field}}`）
- **THEN** 该选项的 `wizard.json` 中声明的 `template` 字段和 `affectedTemplates` 在 `config set` 重新渲染时使用
- **THEN** skill 的**安装**不做 configKey+configValue 精确匹配筛选，所选工具下的所有 skill 全量安装

### Requirement: registry.json 生成规范

Release 时 SHALL 通过构建脚本（`scripts/build-registry.mjs`）自动聚合生成 `registry.json`，同时复制运行时数据到 `packages/cli/dist/`。

#### Scenario: 聚合 frontmatter
- **WHEN** `node scripts/build-registry.mjs` 运行
- **THEN** 扫描 `packages/*/skills/*/SKILL.md`（含 .tmpl）的 frontmatter
- **THEN** 提取 `deepstorm:` 字段生成 skills 索引

#### Scenario: 聚合 wizard.json
- **WHEN** `node scripts/build-registry.mjs` 运行
- **THEN** 扫描 `packages/*/wizard.json` 文件
- **THEN** 合并到 registry 的 `wizards` 段

#### Scenario: 复制源文件到 CLI 包
- **WHEN** `node scripts/build-registry.mjs` 运行
- **THEN** 从各 `packages/<tool>/skills/` 复制所有 skill 目录到 `packages/cli/dist/skills/`
- **THEN** 从 `packages/shared/skills/` 复制共享 skill 到 `packages/cli/dist/skills/`
- **THEN** 从各 `packages/<tool>/agents/` 复制 agent 到 `packages/cli/dist/agents/`
- **THEN** 从各 `packages/<tool>/mcp/` + `packages/shared/mcp/` + `packages/cli/mcp/` 复制 MCP 到 `packages/cli/dist/mcp/`
- **THEN** 从各 `packages/<tool>/hooks/` 复制 hooks 到 `packages/cli/dist/hooks/`
- **THEN** CLI 包自身的 `mcp-skills/` 也复制到 `packages/cli/dist/mcp-skills/`

### Requirement: 装配引擎

Setup 时 CLI SHALL 读取 registry.json，根据用户选择的工具全量安装 skill，并通过模板渲染实现配置感知。

#### Scenario: 全量安装
- **WHEN** 用户选择了工具（如 reef）
- **THEN** CLI 在 registry 中查找该工具下的**所有** skill
- **THEN** 所有 skill 全量安装到 `.claude/skills/`
- **THEN** 不做按 configKey+configValue 的精确匹配筛选

#### Scenario: 模板渲染
- **WHEN** skill 使用 `SKILL.md.tmpl` 模板文件
- **THEN** CLI 读取用户配置值，将 `{{configKey.field}}` 占位符替换为实际值
- **THEN** 渲染后的 `SKILL.md` 写入 `.claude/skills/<skill>/`
- **THEN** 未匹配的占位符保留原样并输出 warning

#### Scenario: variants 变体复制
- **WHEN** skill 的 `variants/` 目录中存在与用户配置值匹配的子目录
- **THEN** CLI 将该子目录下的文件复制到 skill 的目标目录
- **THEN** 不匹配的配置值静默跳过（输出 debug 日志）

#### Scenario: 从本地源复制
- **WHEN** 安装列表确定
- **THEN** CLI 从 CLI 包内的 `skills/` 目录中查找对应 skill 目录
- **THEN** CLI 执行 `cp -r` 复制到 `.claude/skills/`
