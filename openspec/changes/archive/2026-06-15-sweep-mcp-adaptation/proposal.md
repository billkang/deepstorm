## Why

sweep-plan（flow-creation）当前硬编码了 Jira MCP 和钉钉 MCP 作为 Issue 和 PRD 的获取来源，与 reef-start 已完成的 MCP 无关化改造不一致。sweep-plan 应复用已有的 mcpCapabilities 机制，通过 `issue_tracker` / `knowledge_base` 能力域动态检测可用 MCP 服务，实现与 reef-start 一致的运行时能力发现流程。

## What Changes

- **sweep-plan SKILL.md 模板化**：将 `SKILL.md` 重命名为 `SKILL.md.tmpl`，添加 `deepstorm.tool: sweep` 和 `mcpCapabilities` frontmatter 声明
- **硬编码 MCP 替换**：将 SKILL.md 中的「Jira MCP」「钉钉 MCP」等特定服务名称替换为基于 `issue_tracker` / `knowledge_base` 能力域的运行时动态检测
- **flow-creation spec 更新**：将 Requirement 1 中的 Jira + 钉钉 MCP 引用改为通用能力描述

## Capabilities

### Modified Capabilities
- `flow-creation`: 将「Skill 通过 Jira + 钉钉 MCP 获取验收标准」改为基于 `issue_tracker` / `knowledge_base` 能力域的运行时动态检测。Scenarios 中特定 MCP 服务名称替换为通用能力引用。

### New Capabilities
- （无新增能力 — 本变更仅修改已有能力的 spec）

## Impact

- **packages/sweep/skills/sweep-plan/SKILL.md** — 主体改造，改名 + 模板化 + 动态能力检测
- **openspec/specs/flow-creation/spec.md** — Requirement 1 内容更新
- **packages/cli/src/template/registry.ts** — 无需修改，`deriveVariableName` 已支持 `deepstorm.tool: sweep` → `sweep_capabilities`
