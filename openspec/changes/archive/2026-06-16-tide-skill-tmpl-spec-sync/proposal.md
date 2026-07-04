## Why

SKILL.md.tmpl（tide-discuss 的模板文件）中描述了 MCP 能力发现时机、Step 2 角色讨论规则、上下文隔离等关键行为，但现有 specs（tide-core、mcp-capability-discovery、dynamic-publish-flow）未完整覆盖这些内容，部分描述存在不一致。

## What Changes

- 在 tide-core spec 中补充 MCP 能力发现在 Step 3 即需执行的描述（当前仅提及 Step 4）
- 在 tide-core spec 中补充 Step 2 角色讨论的多条行为约束规则
- 在 tide-core spec 中补充上下文隔离规则和 references 文件表
- 统一 MCP skill 路径格式描述（SKILL.md.tmpl 与 specs 间的不一致）
- 在 mcp-capability-discovery spec 中补充 MCP skill 路径规则

## Capabilities

### New Capabilities
- 无（均为对已有 capability 的修改）

### Modified Capabilities
- `tide-core`: 补充 Step 2 规则、Step 3 MCP 发现、上下文隔离、references 文件表、Feature ID 约束
- `mcp-capability-discovery`: 统一 MCP skill 路径格式
- `dynamic-publish-flow`: 统一 MCP skill 路径格式（`mcp-{id}` → `deepstorm-mcp-{id}-{read|write}`）

## Impact

仅影响 spec 文档本身，无代码、API 或依赖变更。
