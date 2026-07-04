## Context

Tide-discuss 的 SKILL.md.tmpl 经过多次迭代后，其描述的行为与对应的 specs（tide-core、mcp-capability-discovery、dynamic-publish-flow）之间出现了一些 gap 和不一致。本次 change 旨在通过修改 spec 文档来消除这些偏差，使 spec 始终反映当前实现和行为约定。

## Goals / Non-Goals

**Goals:**
- tide-core spec 覆盖 Step 2 全部约束规则（一次一问、不替用户决策、上下文隔离）
- tide-core spec 明确 MCP 能力发现在 Step 3 即需执行（而非 Step 4 才做）
- tide-core spec 包含 references 文件表和 Feature ID 字数限制 scenario
- mcp-capability-discovery / dynamic-publish-flow spec 统一 MCP skill 路径格式

**Non-Goals:**
- 不修改任何代码或配置文件
- 不新增 spec 文件
- 不修改 SKILL.md.tmpl 本身

## Decisions

1. **MCP skill 路径格式统一为 `deepstorm-mcp-{provider-id}-{read|write}`** — 对照实际 spec 目录命名和 SKILL.md.tmpl / publish-flow.md 中的引用，确认此格式为正确格式。tide-core 和 dynamic-publish-flow 中写为 `mcp-{id}` 的需修正。
2. **tide-core 中新增 scenario 而非新增 capability** — 这些 gap 属于已有 requirement 的补充场景，不需要新建 spec 文件。在 "Step 2 BMAD 角色讨论" 和 "MCP 集成" 等 requirement 下添加 scenario 即可。

## Risks / Trade-offs

- 本次为纯文档更新，无实施风险
- MCP skill 路径格式统一后，后续新 skill 开发可遵循一致路径
