## Purpose

定义 DeepStorm 统一的 MCP 能力映射发现机制。CLI 在安装/刷新时从所有 skill 模板文件的 frontmatter 中收集 `mcpCapabilities` 声明，构建统一的能力映射写入 `.claude/settings.json` → `deepstorm.mcpCapabilities`，各套件（tide、reef、sweep）在运行时直接读取该字段感知 MCP 服务可用性，不再通过模板变量注入或运行时交叉引用。

---

## Requirements

### Requirement: CLI 安装时自动构建统一 MCP 能力映射

DeepStorm CLI 在 `setup` 安装流程中 SHALL 从所有 skill 模板文件的 frontmatter 中收集 `mcpCapabilities` 声明，构建统一的能力映射并写入 `.claude/settings.json` → `deepstorm.mcpCapabilities`。

#### Scenario: 安装时扫描所有 skill 模板的 frontmatter
- **WHEN** 用户执行 `npx @deepstorm/cli setup` 且至少选择了一个工具
- **THEN** CLI 遍历 `dist/skills/{skillId}/SKILL.md.tmpl`，对每个文件使用 `parseFrontmatter()` 解析 YAML frontmatter，提取 `mcpCapabilities` 声明并合并到统一的声明集合

#### Scenario: 根据已安装 MCP 服务生成可用性映射
- **WHEN** 所有声明收集完成后
- **THEN** CLI 调用 `buildMcpCapabilities(allDeclarations, installedMcpTools, mcpTools)` 生成按能力域分组的结果，每个域包含 `available`（boolean）和 `providers`（`Array<{id, label}>`）

#### Scenario: 写入 settings.json 的 deepstorm 命名空间
- **WHEN** 能力映射构建完成且非空
- **THEN** CLI 将 `{ mcpCapabilities: <映射对象> }` 合并到 `deepstormConfig`，并通过 `mergeDeepStormConfig()` 写入 `.claude/settings.json`

#### Scenario: 无 skill 模板或所有模板无 mcpCapabilities 声明时返回空对象
- **WHEN** `dist/skills/` 目录不存在，或所有 SKILL.md.tmpl 均无 `mcpCapabilities` frontmatter 声明
- **THEN** `buildUnifiedMcpCapabilities()` 返回空对象 `{}`，`deepstormConfig.mcpCapabilities` 不会被设置

---

### Requirement: CLI 配置刷新时重建统一 MCP 能力映射

DeepStorm CLI 在 `config-refresh` 刷新流程中 SHALL 从所有 skill 模板文件重建统一 MCP 能力映射并通过 `mergeDeepStormConfig` 写入 settings.json。

#### Scenario: refresh 时重建能力映射
- **WHEN** 用户执行 `npx @deepstorm/cli config-refresh` 且 `.claude/settings.json` 中存在 installedSkills
- **THEN** CLI 在完成所有 skill 模板的 SKILL.md 重新渲染后，执行 `buildUnifiedMcpCapabilities(cliDir, installedMcpServers, mcpTools)` 扫描 `dist/skills/` 中的模板 frontmatter，构建能力映射
- **AND** 非空时通过 `mergeDeepStormConfig(settingsPath, { mcpCapabilities })` 写入 settings.json

#### Scenario: refresh 时 settings.json 不存在直接返回
- **WHEN** 执行 `config-refresh` 且 `.claude/settings.json` 不存在
- **THEN** CLI 立即返回空结果，不创建或写入任何文件

---

### Requirement: 各套件 skill 运行时统一从 deepstorm.mcpCapabilities 读取能力

所有 DeepStorm 套件（tide、reef、sweep）的 SKILL.md MUST 在运行时直接读取 `.claude/settings.json` → `deepstorm.mcpCapabilities` 来感知 MCP 服务可用性，不再使用 `{{xxx_capabilities}}` 模板变量。

#### Scenario: tide-discuss 在 PRD 发布时使用 deepstorm.mcpCapabilities
- **WHEN** tide-discuss 进入 Step 4（PRD 发布流程）
- **THEN** AI 读取 `.claude/settings.json` → `deepstorm.mcpCapabilities` 确定 `knowledge_base` 和 `issue_tracker` 的可用性，不再读取 `{{tide_capabilities}}`

#### Scenario: reef-start 在启动时使用 deepstorm.mcpCapabilities
- **WHEN** reef-start 进入 Stage 1（MCP 服务发现）
- **THEN** AI 读取 `.claude/settings.json` → `deepstorm.mcpCapabilities` 确定可用 provider，不再读取 `{{reef_capabilities}}`

#### Scenario: sweep-plan 在获取测试需求上下文时使用 deepstorm.mcpCapabilities
- **WHEN** sweep-plan 进入步骤 2（获取测试需求上下文）
- **THEN** AI 读取 `.claude/settings.json` → `deepstorm.mcpCapabilities` 确认 `issue_tracker` 和 `knowledge_base` 可用性，不再读取 `{{sweep_capabilities}}`

#### Scenario: MCP skill 文件检查能力可用性改用 deepstorm.mcpCapabilities
- **WHEN** figma-read 或 jira-read SKILL.md 需要确认 MCP 服务可用性
- **THEN** AI 检查 `.claude/settings.json` → `deepstorm.mcpCapabilities` 中对应能力域的 `available` 和 `providers`，不再使用 `{{capabilities}}` 或检查 `deepstorm.installedMcpServers`

#### Scenario: deepstorm.mcpCapabilities 缺失时降级
- **WHEN** `.claude/settings.json` 不存在、格式错误、或 `deepstorm.mcpCapabilities` 字段缺失
- **THEN** AI SHALL 按"无 MCP 服务安装"模式降级运行，所有能力视为 `available: false`

---

### Requirement: mcpCapabilities 类型定义

DeepStormConfig 接口 MUST 包含 `mcpCapabilities` 可选字段，其类型为 `Record<string, { available: boolean; providers: Array<{ id: string; label: string }> }>`。

#### Scenario: 类型定义正确编译
- **WHEN** TypeScript 编译 `packages/cli/src/types/config.ts`
- **THEN** `DeepStormConfig` 接口包含可选字段 `mcpCapabilities?: Record<string, { available: boolean; providers: Array<{ id: string; label: string }> }>`

#### Scenario: 旧配置不设置 mcpCapabilities 也不报错
- **WHEN** 读取不包含 `mcpCapabilities` 字段的旧版本 `.claude/settings.json`
- **THEN** 类型系统允许该字段为 `undefined`，业务代码按降级模式处理
