## Context

Tide 的发布流程（Step 4）当前在 tide-discuss SKILL.md 中直接硬编码了「4a 推送到钉钉云文档」和「4c 创建 Jira Issue」两个外部服务交互步骤，publishChecklist 步骤名和服务链接字段也使用了 `dingtalk_*`、`jira_*` 等专属名称。

CLI 侧已经完成了 MCP 服务注册和安装的基础设施：
- `packages/cli/mcp/` 下按领域组织 MCP JSON 定义（jira、dingtalk-wiki、github、figma）
- `setup` 流程已支持用户选择 MCP 服务，安装对应的 `.mcp.json` server 配置和 `.claude/skills/mcp-{name}/SKILL.md` 使用指南
- `buildTemplateVariables()` 已生成 `mcp.{serviceName}` / `mcp.{domain}` 模板变量
- 但 tide-discuss 是纯静态 SKILL.md，无法接收模板变量，也无法感知用户装了哪些 MCP

核心矛盾：Tide 的发布流程需要感知「用户装了哪些外部服务」，但当前架构无法传递这个信息。

## Goals / Non-Goals

**Goals:**
- Tide 发布流程不再硬编码具体 MCP 服务，根据实际安装的服务动态适配
- Skill 声明自身依赖的 MCP 领域（knowledge-base、project-management），避免无关 MCP 污染
- 安装时注入能力映射 JSON，运行时 AI 交叉读取 `installedMcpServers` 获取最新状态
- Session JSON 采用通用 `services` 命名空间，publishChecklist 步骤名通用化
- 增减 MCP 后无需全量重新安装

**Non-Goals:**
- 不涉及 Step 2 角色讨论中 UX Designer 引用 Figma 设计稿的能力（后续可扩展）
- 不改变 tide-core 的基本状态流转（active → prd_ready → published → completed 保持不变）
- 不涉及 reef/sweep/atoll 的 MCP 适配
- 不改变 `mcp-{name}/SKILL.md` 的内容结构（只作为运行时 Read 引用）

## Decisions

### D1. SKILL.md → SKILL.md.tmpl + frontmatter mcpCapabilities

将 tide-discuss 从纯静态 SKILL.md 转换为模板文件 SKILL.md.tmpl。frontmatter 中新增 `mcpCapabilities` 字段声明本 skill 依赖的 MCP 领域：

```yaml
capabilities:
  knowledge_base:
    domain: knowledge-base
  issue_tracker:
    domain: project-management
```

安装时，CLI 解析 frontmatter，按声明的 domain 过滤 `installedMcpServers`，生成 `tide_capabilities` JSON 变量注入。详见 D2。

**Alternatives considered:**
- 「运行时全量读 registry，不依赖模板」→ AI 需要知道所有 MCP 服务的 domain 归属和 skill 文件路径，不可靠
- 「声明具体 MCP 服务 ID（如 jira、dingtalk-wiki）」→ 粒度太细，新增 MCP 服务类型需要改 frontmatter
- **选定方案**：声明**domain 领域**，与 registry 中 MCP 工具的 `domain` 字段对照过滤，粒度适中且自发现

### D2. tide_capabilities 的计算和注入时机

在 `installAllToolAssets()` 渲染 .tmpl 之前，新增一步处理：

```
① 读 SKILL.md.tmpl frontmatter → 提取 mcpCapabilities 中的 domain 列表
② 遍历 installedMcpServers，查 registry.mcpTools 获取每个服务的 domain/label
③ 按 domain 分组，只保留 mcpCapabilities 中声明的 domain
④ 序列化为 JSON 字符串 → tide_capabilities 变量
⑤ 传入 renderTemplate → {{tide_capabilities}} 被替换为 JSON
```

渲染后 SKILL.md 中能力映射只包含当前已安装且 tide 需要的 provider：

```json
{
  "knowledge_base": [
    {"id": "dingtalk-wiki", "name": "钉钉云文档", "skill": "mcp-dingtalk-wiki"}
  ],
  "issue_tracker": [
    {"id": "jira", "name": "Jira", "skill": "mcp-jira"}
  ]
}
```

**Alternatives considered:**
- 「渲染所有已知 provider，AI 运行时过滤」→ 被 grill 否决，用户不希望在 SKILL.md 中看到未安装的服务
- 「不渲染，全部运行时确定」→ AI 无法可靠推断 provider → skill 文件路径的映射
- **选定方案**：安装时一次性计算 JSON，避免运行时推断错误

### D3. 运行时交叉验证 installedMcpServers

SKILL.md 指令要求 AI 在进入 Step 4 时，读取 `.claude/settings.json` 中的 `deepstorm.installedMcpServers` 数组，与渲染的能力映射做交叉匹配：

- 能力映射中的 provider 在 `installedMcpServers` 中存在 → **可用**
- 能力映射中的 provider 在 `installedMcpServers` 中不存在 → **不可用**
- 某能力所有 provider 均不可用 → **跳过该步骤**

这解决了「安装后增减 MCP 导致快照过期」的问题——能力映射中的 provider 列表即使包含新增的服务（安装了但安装时未生成），跨域 `installedMcpServers` 的检查也能确保**新增的服务对旧 SKILL.md 不可见**，不会误报不可用的 provider。

反之，如果用户新装了某 MCP 且该 MCP 属于 tide 声明的 domain，需要运行 `deepstorm config refresh` 重新渲染才能看到。

### D4. deepstorm config refresh

新增 `config refresh` 子命令，无参数，全局刷新所有已安装工具的 .tmpl 文件：

```
deepstorm config refresh
  ① 读 settings.json → deepstorm.installedSkills
  ② 对每个 skill 检查 registry.skills[].hasTemplate
  ③ 有 .tmpl 的 → 重读最新 installedMcpServers → 重新 buildTemplateVariables → rerender
```

与 `setup --reconfigure` 的区别：

| | `--reconfigure` | `config refresh` |
|---|---|---|
| 范围 | 全量清理 + wizard 重答 | 仅重渲染 .tmpl |
| 用户交互 | 重新回答问题 | 静默执行 |
| MCP 变更 | 感知 | 感知 |
| wizard 配置变更 | 感知 | 不感知 |
| 执行时间 | 秒级 | 毫秒级 |

### D5. 多工单系统选择策略

当 issue_tracker 能力下有多个可用 provider（如 Jira + GitHub Issues 都已安装）：

1. 4b 入口时询问用户"检测到多个工单系统，本次使用哪个？"
2. 用户选择后持久化到 `services.issueTracker.provider`
3. 后续恢复时直接读取已持久化的 provider，不再询问

同一 session 内不切换工单系统。

### D6. 无 MCP 时的端到端路径

用户安装了 tide 但未安装任何相关 MCP 服务时：

```
Step 3 生成 PRD → status: prd_ready
  ↓ 进入 Step 4
4a knowledge_base_push → 无可用 KB → publishChecklist 记 skipped: true, done: true
4b issue_task_split → 无可用工单系统 → 跳过（不展示任务拆分给用户）
4c create_issues → 无可用工单系统 → publishChecklist 记 skipped: true, done: true
  ↓ status: completed → 归档
```

PRD 照常生成，后续用户装了 MCP 后可通过 `deepstorm config refresh` 重渲染，再打开 session 重新走发布流程。

### D7. 异常恢复路径

| 场景 | 恢复策略 |
|------|---------|
| 4a 失败（MCP 调用出错） | 重试 `knowledge_base_push`，publishChecklist[0].done = false |
| 4c 部分失败（N/M 成功） | 从 `services.issueTracker.taskBreakdown` 重建 + `failedItems` 重试 |
| 4c 全部失败（0/M） | 提示检查 MCP 连接后全部重试 |
| 某步已 skipped | 恢复时跳过该步（`skipped: true`） |

### D8. 向后兼容

写操作全用新格式（`services` 命名空间、通用 publishChecklist 步骤名），读操作优先新格式、降级旧格式：

```
读 services.knowledgeBase.url → 不存在则读 dingtalkUrl
读 services.issueTracker.urls → 不存在则读 jiraUrls
```

### D9. 运行时 MCP Skill 引用

当需要执行 MCP 交互时（如创建 Jira Issue），SKILL.md 指令如下：

```
1. 根据能力映射确定当前 provider（如 Jira）
2. 读取 .claude/skills/mcp-{provider.id}/SKILL.md 了解工具调用方式
3. 按指南执行操作
```

不使用 Skill 工具加载，因为 mcp skill 是静态参考文档，用 Read 工具更轻量。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 安装后增减 MCP 导致 SKILL.md 快照过期 | `deepstorm config refresh` 全局重渲染；运行时 `installedMcpServers` 交叉验证避免错误引用不存在的 provider |
| 新 MCP 服务类型加入 registry 但现存 SKILL.md 未包含 | 需要用户运行 `config refresh` 或重新 setup 才能可见；版本 upgrade 流程中可自动触发 refresh |
| 旧归档 session 文件字段名为 `dingtalkUrl`/`jiraUrls` | 读操作双路径降级（services 优先 → 旧字段兜底），写操作全用新格式 |
| AI 在运行时读 settings.json 可能遇到文件不存在或格式错误 | SKILL.md 指令包含异常降级：无法读取时视同「无 MCP 安装」，全部跳过 |
