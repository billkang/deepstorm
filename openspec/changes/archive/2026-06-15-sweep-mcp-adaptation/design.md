## Context

sweep-plan（`/sweep:plan`）是 Sweep 套件中负责生成 .flow.md 测试意图文档的 skill。当前实现硬编码了「Jira MCP」和「钉钉 MCP」作为 Issue 和 PRD 的唯一获取途径。

Reef 已通过 `reef-mcp-adaptation` 完成了类似的 MCP 无关化改造，其机制为：
1. SKILL.md → SKILL.md.tmpl 模板化，frontmatter 声明 `mcpCapabilities`
2. 模板变量 `{{tool_capabilities}}` 注入运行时能力映射 JSON
3. AI 在运行时通过 `.claude/settings.json` 的 `deepstorm.installedMcpServers` 交叉匹配

sweep-plan 可复用这套机制，不引入新架构。

## Goals / Non-Goals

**Goals:**
- sweep-plan 不再硬编码 Jira MCP 和钉钉 MCP 名称
- 复用已有的 `issue_tracker` / `knowledge_base` 能力域声明和 `deriveVariableName` 机制
- 运行时动态检测可用 MCP 服务，自动适配获取路径
- 保持与现有用户流程完全兼容（安装 Jira + 钉钉时行为不变）

**Non-Goals:**
- 不改变 sweep-init 和 sweep-run（sweep-init 是项目初始化工具，sweep-run 的核心是 Playwright MCP 浏览器自动化，不属于文档源获取范畴）
- 不创建新的 MCP 能力域（复用已有的 `issue_tracker` / `knowledge_base`）
- 不修改 reference 文件（sweep-plan 无类似 reef-start 的 `jira-start-dingtalk.md` 等引用文件）

## Decisions

### D1: 复用 `issue_tracker` / `knowledge_base` 域而非创建新域

sweep-plan 所需的 MCP 能力与 reef-start 完全一致（读取 Issue + 读取 PRD 文档）。复用已有域可以避免重复注册，安装向导也能自动覆盖两类 suite 的需求。

**备选方案：** 创建 `sweep-issue-tracker` / `sweep-knowledge-base` 专有域
**理由：** 拆分会增加维护负担，无实际收益。同一套能力域跨 suite 复用是设计意图。

### D2: SKILL.md.tmpl 使用 `deepstorm.tool: sweep`

`deriveVariableName` 从 `deepstorm.tool` 自动推导变量名：`sweep` → `sweep_capabilities`。与 tide（`tide_capabilities`）和 reef（`reef_capabilities`）保持一致。

### D3: Step 2（需求获取阶段）整体动态化

当前 Step 2 的 2.2（Jira Issue 链接）、2.3（PRD 钉钉链接）、2.5（后备处理）三个子步骤将合并为动态能力检测路径，参照 reef-start 的 Stage 1 模式。不再按来源分步骤，而是按能力可用性分路径：

```
用户输入 Issue 链接
  → issue_tracker available?
    → 是：使用 MCP 读取 Issue → 提取 PRD 链接
    → 否：请求用户手动输入
      → knowledge_base available?
        → 是：使用 MCP 读取 PRD
        → 否：请求用户手动粘贴 PRD 内容
      → 无 Issue 无 PRD：直接描述
```

### D4: 保留 Step 2.4（直接描述）作为最低保障

当所有能力域均不可用时，用户仍可通过口述功能需求来完成 .flow.md 生成。这与当前行为一致，仅更新描述语言。

## Risks / Trade-offs

- **[兼容性]** 用户当前配置了 Jira + 钉钉 MCP 的，升级后行为不变，无风险
- **[识别度]** AI 需根据 Issue 链接格式自动判断使用哪个 provider（多 provider 场景）。沿用 reef-start 已定义的「AI 自动判断 + 推测失败时询问用户」模式
- **[模板缺失]** 如果用户跳过 setup 流程直接修改 SKILL.md，template 中的 `{{sweep_capabilities}}` 不会被渲染。这与 reef-start 相同，属于正常降级
