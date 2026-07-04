# Reef MCP Adaptation — Design

## Context

Tide 已完成 MCP 适配改造，建立了以下基础设施：

1. `buildMcpCapabilities()` — 按 domain 过滤 installedMcpServers，返回能力映射 JSON
2. `injectSkillCapabilities()` — 读取 SKILL.md.tmpl frontmatter 的 mcpCapabilities，注入模板变量
3. `installAllToolAssets()` — 已集成 injectSkillCapabilities 调用，对所有 .tmpl 文件生效
4. 运行时交叉引用 — AI 读取 `deepstorm.installedMcpServers` 与渲染的能力映射匹配

Reef 需要沿同一机制完成改造，但区别在于：

- **Tide 是"写"流程**（发布 PRD、创建 Issue），需要多 provider 选择和持久化
- **Reef 是"读"流程**（获取 Issue、读取 PRD、拉取设计），AI 自动选择 provider 即可

## Goals

1. reef-start 的 Stage 1 不再硬编码特定 MCP 服务
2. 引用文件内容 MCP 无关化
3. reef-gen-frontend 的 Figma 引用动态化
4. 向后兼容：现有用户无感知

## Non-Goals

1. 不改 reef-review 及其 agent（已模板化、不依赖特定 MCP 服务）
2. 不改 reef-gen-backend（不依赖 MCP 服务）
3. 不改 reef-testcase、reef-migrate、reef-harden（不依赖 MCP 服务）
4. 不改 reef-start 的引用文件名（避免破坏内部交叉引用）

## Decisions

### D1: reef-start → SKILL.md.tmpl

**决定:** 将 `packages/reef/skills/reef-start/SKILL.md` 转为 `SKILL.md.tmpl`，在 frontmatter 声明 mcpCapabilities。

**理由:** 这是 Tide 的 D1 决策的直接复用。通过 .tmpl 模板化后，CLI 的 `installAllToolAssets()` 会自动调用 `injectSkillCapabilities()` 注入能力映射，无需额外配置。

**mcpCapabilities 声明:**
```yaml
mcpCapabilities:
  issue_tracker:
    domain: project-management
  knowledge_base:
    domain: knowledge-base
  design_tools:
    domain: design-tools
```

### D2: 模板变量名 → reef_capabilities

**决定:** `injectSkillCapabilities()` 需要支持可配置的变量名，对 Reef 产出 `{{reef_capabilities}}`，Tide 仍然使用 `{{tide_capabilities}}`（默认值）。

**备选方案:**
- 方案 A（选）：`injectSkillCapabilities` 新增可选参数 `variableName`，默认 `"tide_capabilities"`，向下兼容
- 方案 B：所有 skill 共用 `tide_capabilities` 变量名
- 方案 C：根据 skill 的 tool 属性自动推断变量名前缀

**理由:** 方案 A 改动最小，向后兼容，明确区分不同套件的能力映射。

### D3: reef-start Stage 1 动态适配

**决定:** Stage 1 的 4 个子步骤全部根据能力映射动态执行：

| 子步骤 | 原实现 | 新实现 |
|--------|--------|--------|
| 1.1 解析 Issue 编号 | 无变化 | 无变化（独立于 MCP） |
| 1.2 获取 Issue 详情 | 硬编码 `jira` MCP | 动态检测 issue_tracker provider |
| 1.3 获取 PRD 上下文 | 硬编码 `dingtalk-wiki` MCP | 动态检测 knowledge_base provider |
| 1.4 澄清需求 | 无变化 | 无变化（独立于 MCP） |
| 1.5 获取设计稿 | 硬编码 `figma-developer` MCP | 动态检测 design_tools provider |

**理由:** 每个子步骤独立可用性检查，不相互阻塞。Issue 跟踪器可用就获取 Issue，知识库可用就获取 PRD，设计工具可用就获取设计稿。

### D4: 与 Tide 的多 provider 选择策略不同

**决定:** Reef 在多个同域 provider 时 AI 自动选择，不需要用户选择（与 Tide 不同）。

**理由:**
- Reef 是"读操作"—AI 自动选择第一个可用的 issue_tracker 或 design_tools，没有"选错"的风险
- Tide 是"写操作"—用户需要决定 PRD 推送到哪个知识库、Issue 创建到哪个工单系统
- 自动推断失败时才询问用户

### D5: 引用文件内容重写，文件名不变

**决定:** 4 个引用文件内容完全重写为 MCP 无关版本，但文件名保持不变。

**理由:** 避免破坏 SKILL.md 内部的交叉引用（`references/jira-start-dingtalk.md` 等）。旧文件名并不影响功能，只是命名不反映通用性。

### D6: reef-gen-frontend 动态化

**决定:** `reef-gen-frontend/SKILL.md` 中 Step 3 的 `figma-developer` MCP 引用改为动态 design_tools 能力检测。

**理由:** gen-frontend 读取设计稿的需求不限于 Figma，其他设计工具也可提供布局数据。

### D7: reef-pr 和 reef-commit MCP 引用

**决定:** reef-pr 的 "GitHub MCP 已配置" 改为通用描述（检出 code-hosting 能力）；reef-commit 的 JIRA URL 引用改为通用 issue_tracker URL 引用。

**理由:** 这些引用不影响核心功能，但统一为 MCP 无关表述有助于一致性。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 引用文件名(jira-start-*)与内容不匹配 | 内容重写内先标注"This reference covers any MCP service"，文件名后续变更处理 |
| reef-gen-frontend 的 design_tools 检测失败时回退 | 保持"如果 Figma 不可用则跳过"逻辑 |
| 向后兼容：旧 session 的 `jira` 元数据字段 | 保持 `jira` 字段名不变（与 Tide 的 services 命名空间对齐后续处理） |
| injectSkillCapabilities 修改影响 Tide | 默认参数兼容，Tide 不传新参数时行为不变 |
