# Reef MCP Adaptation

## Why

Reef 套件中的 `reef-start` 和 `reef-gen-frontend` 等技能硬编码了特定的 MCP 服务名称（`jira`、`dingtalk-wiki`、`figma-developer`），与 Tide 在 MCP 适配改造前的问题完全相同。这导致：

1. **绑定特定实现** — 用户必须安装 Jira/DingTalk/Figma 才能使用 reef-start，无法选择其他 Issue Tracker（如 Linear、GitHub Issues）或知识库服务
2. **安装/配置死锁** — 未安装这些 MCP 服务时，reef-start 完全无法启动开发流程
3. **维护成本** — 每增加一个支持的 MCP 服务都需要修改所有引用处的 SKILL.md
4. **用户困惑** — 技能描述说"从 Jira issue 启动"，但团队实际使用其他 Issue Tracker 时不知如何适配

Tide 的 MCP 适配改造已经建立了基础设施（`buildMcpCapabilities`、`injectSkillCapabilities`、能力映射机制），Reef 需要沿同一思路完成改造。

## What Changes

### 新能力

1. **mcp-agnostic-startup-flow** — reef-start 的 Stage 1（需求获取阶段）根据运行时能力映射动态适配，不再假设 Jira/DingTalk/Figma 存在
2. **mcp-agnostic-references** — reef-start 的引用文件（PRD 上下文、设计稿处理、环境配置）改为通用描述，不绑定特定服务
3. **mcp-agnostic-gen-flow** — reef-gen-frontend 的 Figma 设计稿拉取改为动态设计工具能力检测

### 修改

4. **reef-start → SKILL.md.tmpl** — 将 reef-start 从静态 SKILL.md 转为模板 SKILL.md.tmpl，声明 mcpCapabilities（`issue_tracker`、`knowledge_base`、`design_tools`），注入 `{{reef_capabilities}}`
5. **reef-start 引用文件重写** — 4 个引用文件 (jira-start-*) 改为 MCP 无关的通用版本
6. **reef-gen-frontend 动态化** — figma-developer MCP 引用改为动态 design_tools 能力检测
7. **reef-pr 轻微调整** — GitHub MCP 引用改为通用 code-hosting 能力
8. **injectSkillCapabilities 泛化** — 将 `tide_capabilities` 变量名改为可配置（默认兼容），或新建 `reef_capabilities` 变体

## Capabilities

| Capability | 说明 |
|-----------|------|
| `mcp-agnostic-startup-flow` | reef-start Stage 1 动态适配 |
| `mcp-agnostic-references` | 引用文件 MCP 无关化 |

## Impact

| 文件 | 类型 | 说明 |
|------|------|------|
| `packages/reef/skills/reef-start/SKILL.md` → `.tmpl` | 新能力 | 核心改动：模板化 + mcpCapabilities + 动态流程 |
| `packages/reef/skills/reef-start/references/jira-start-dingtalk.md` | 修改 | 重写为通用 PRD 上下文获取 |
| `packages/reef/skills/reef-start/references/jira-start-figma.md` | 修改 | 重写为通用设计工具处理 |
| `packages/reef/skills/reef-start/references/jira-start-env.md` | 修改 | 重写为通用 MCP 环境配置 |
| `packages/reef/skills/reef-start/references/jira-start-subagent.md` | 修改 | 微小调整 |
| `packages/reef/skills/reef-gen-frontend/SKILL.md` | 修改 | Figma 引用动态化 |
| `packages/reef/skills/reef-pr/SKILL.md` | 修改 | GitHub MCP 引用通用化 |
| `packages/reef/skills/reef-commit/SKILL.md` | 修改 | JIRA URL 引用通用化 |
| `packages/cli/src/template/registry.ts` | 修改 | injectSkillCapabilities 变量名泛化 |
| `openspec/specs/mcp-capability-discovery/spec.md` | 参考 | 共享已有 spec（无需修改） |
