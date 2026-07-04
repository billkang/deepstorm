## 1. MCP 基础设施 — 创建飞书知识库配置与技能

- [x] 1.1 创建 `packages/cli/mcp/knowledge-base/feishu-wiki.json` MCP server 配置文件
- [x] 1.2 创建 `packages/cli/mcp-skills/deepstorm-mcp-feishu-wiki-read/SKILL.md`（飞书文档搜索与读取指南）
- [x] 1.3 创建 `packages/cli/mcp-skills/deepstorm-mcp-feishu-wiki-write/SKILL.md`（飞书文档创建与更新指南）
- [x] 1.4 删除 `packages/cli/mcp/knowledge-base/dingtalk-wiki.json`
- [x] 1.5 删除 `packages/cli/mcp-skills/deepstorm-mcp-dingtalk-wiki-read/` 目录
- [x] 1.6 删除 `packages/cli/mcp-skills/deepstorm-mcp-dingtalk-wiki-write/` 目录
- [x] 1.7 替换 `packages/cli/env-examples/dingtalk-wiki.env-example` 为 `feishu-wiki.env-example`

## 2. 源码注册 — 更新 build-registry、registry、wizard.json

- [x] 2.1 更新 `packages/cli/src/build-registry.ts`（`mcpDependencies` 中的 `dingtalk-wiki` → `feishu-wiki`，4 个套件）
- [x] 2.2 更新 `packages/cli/src/template/registry.ts`（JSDoc 示例中的 `dingtalk-wiki`）
- [x] 2.3 更新 `packages/tide/wizard.json`（`mcpSkills` 数组）
- [x] 2.4 更新 `packages/reef/wizard.json`（`mcpSkills` 数组）
- [x] 2.5 更新 `packages/sweep/wizard.json`（`mcpSkills` 数组）

## 3. 文档更新 — README、SKILL.md.tmpl、reference

- [x] 3.1 更新根目录 README.md（Mermaid 图、配置表、环境变量、feature toggle 文档）
- [x] 3.2 更新 `playground/README.md`（MCP 能力表和 demo 指南）
- [x] 3.3 更新 `playground/guides/01-tide-demo.md`（钉钉云文档发布引用）
- [x] 3.4 更新 `packages/tide/README.md`（发布流程、env-stubs、feature toggle）
- [x] 3.5 更新 `packages/reef/README.md`（MCP 配置表）
- [x] 3.6 更新 `packages/sweep/README.md`（Mermaid 图、MCP 配置表）
- [x] 3.7 更新 `packages/tide/skills/tide-discuss/SKILL.md.tmpl`（MCP 技能路径引用）
- [x] 3.8 更新 `packages/reef/skills/reef-start/SKILL.md.tmpl`（MCP 操作指南路径）
- [x] 3.9 更新 `packages/sweep/skills/sweep-plan/SKILL.md.tmpl`（能力描述和技能路径）
- [x] 3.10 更新 `packages/tide/skills/tide-discuss/references/publish-flow.md`（provider 标签和技能路径映射）
- [x] 3.11 更新 `packages/tide/skills/tide-discuss/references/data-format.md`（provider 名、url 示例、字段映射）
- [x] 3.12 更新 `packages/tide/skills/tide-discuss/references/prd-template.md`（示例 PRD 决策引用）

## 4. 测试更新

- [x] 4.1 更新 `packages/cli/src/template/__tests__/registry.test.ts`（provider 标签、测试数组）
- [x] 4.2 更新 `packages/cli/src/commands/__tests__/config-refresh.test.ts`（provider 标签）
- [x] 4.3 更新 `packages/cli/src/commands/__tests__/setup.test.ts`（mock 技能文件名、断言）
- [x] 4.4 更新 `packages/cli/src/engine/__tests__/registry.test.ts`（mock 技能数组）
- [x] 4.5 更新 `packages/cli/src/wizard/__tests__/reconfigure.test.ts`（MCP server 键名、断言）

## 5. 验证与收尾

- [x] 5.1 运行 `pnpm build` 重建 dist/
- [x] 5.2 运行全量测试套件：`cd packages/cli && npx vitest run`
- [x] 5.3 GREP 全项目确认无 `dingtalk-wiki` / `dingtalkUrl` / `DEEPSTORM_DINGTALK` 残留引用
- [x] 5.4 确认 `build-registry.ts` 中 `feishu-wiki` 正确注册到 registry.json
