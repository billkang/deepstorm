## Why

当前 `deepstorm setup` 的流程为「MCP 选择 → 工具选择 → 问卷」，用户在未选定工具套件时就要面对一长串 MCP 服务列表，缺乏决策上下文；同时 MCP 和工具的选择相互独立，用户可能遗漏关键 MCP 或选了不需要的 MCP。此外，Sweep 套件缺少 E2E 框架选择能力，Playwright 在 skill 中硬编码，无法适应不同团队的框架选型。

本变更将 setup 流程重组为「工具选择 → MCP 选择（按工具过滤）→ 问卷」的新顺序，并为 Sweep 增加可扩展的 E2E 框架选择能力。

## What Changes

### Setup 流程重组
- **流程顺序变更**：将工具套件选择（Step 1）移到 MCP 服务选择（Step 2）之前
- **MCP 过滤**：MCP 选择列表根据已选工具动态过滤展示，每项标注来源工具
- **问卷优化**：问卷（Step 3）仅展示已选工具对应的技术选型问题
- **非交互模式兼容**：保持 `--non-interactive`、`--tools`、`--mcp-tools`、`--set` 参数兼容

### Sweep E2E 框架选择
- **wizard.json 新增问题**：Sweep 增加 `e2eFramework` 问卷问题，当前唯一选项为 `playwright`
- **SKILL.md 改造**：sweep-init / sweep-plan / sweep-run 从配置读取框架选择，替代硬编码
- **Playwright MCP**：Playwright MCP 服务由 CLI wizard 统一管理配置，不再由 sweep-init 单独处理
- **可扩展设计**：框架选择接口预留扩展点，后续新增框架只需改 wizard.json + SKILL.md

## Capabilities

### New Capabilities
- `mcp-playwright`：Playwright MCP 服务定义（JSON 配置、env stub、使用指南 skill）

### Modified Capabilities
- `setup-wizard`：修改 setup 流程顺序为「工具选择 → MCP 选择（过滤）→ 问卷」，MCP 选择逻辑改为按工具过滤，问卷只展示已选工具的问题
- `mcp-tool-selection`：MCP 工具选择步骤移至工具套件选择之后，展示列表根据已选工具动态过滤，新增 playwright 作为 MCP 选项
- `e2e-setup`：E2E 项目初始化（sweep-init）中 Playwright 从硬编码改为从 wizard 配置读取；同时 sweep-plan 和 sweep-run 中引用的 Playwright MCP 配置改为从 `.env` 读取

## Impact

| 范围 | 影响 |
|------|------|
| `packages/cli/src/commands/setup.ts` | 主流程顺序重排 |
| `packages/cli/src/wizard/mcp-select.ts` | 新增按工具过滤 MCP 选项逻辑 |
| `packages/cli/src/types/registry.ts` | 可能需要新增工具→MCP 映射类型 |
| `packages/cli/src/engine/registry.ts` | 可能需要提供工具→MCP 映射查询方法 |
| `packages/cli/mcp/` | 新增 `playwright/` 目录（MCP 服务定义） |
| `packages/cli/mcp-skills/` | 新增 `deepstorm-mcp-playwright-*` 使用指南 |
| `packages/sweep/wizard.json` | 新增 `e2eFramework` 问卷问题 |
| `packages/sweep/skills/sweep-init/SKILL.md` | Playwright 配置改为从配置读取 |
| `packages/sweep/skills/sweep-plan/SKILL.md.tmpl` | MCP 能力声明改为动态读取 |
| `packages/sweep/skills/sweep-run/SKILL.md` | MCP 引用改为动态配置 |
