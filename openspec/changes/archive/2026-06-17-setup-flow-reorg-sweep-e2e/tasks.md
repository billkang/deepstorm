## 1. Registry 改造——工具→MCP 映射

- [x] 1.1 在 `types/registry.ts` 中 `ToolDefinition` 类型新增 `mcpDependencies?: string[]` 字段
- [x] 1.2 在 `build-registry.ts` 中为每个工具（tide/reef/sweep/atoll）添加 `mcpDependencies` 数据
- [x] 1.3 在 `engine/registry.ts` 中新增 `getMcpDeps(tools: string[]): string[]` 方法（求并集）

## 2. CLI Setup 流程重组

- [x] 2.1 **`commands/setup.ts`** 重排 `runSetup()` 执行顺序：`selectTools` → `selectMcpTools(selectedTools)` → `runQuestionnaire(selectedTools)`
- [x] 2.2 **`wizard/mcp-select.ts`** 修改 `selectMcpTools()` 函数签名，接收 `selectedTools: string[]` 参数；内部调用 `registry.getMcpDeps()` 过滤 MCP 选项列表，每项标注来源工具
- [x] 2.3 **`wizard/non-interactive.ts`** 更新非交互模式解析：`--mcp-tools` 与 `--tools` 交叉验证，忽略不匹配的 MCP 服务并输出 warning

## 3. Playwright MCP 服务定义

- [x] 3.1 创建 `mcp/e2e-testing/playwright.json`（含 MCP server 配置、env vars、领域分组 e2e-testing）
- [x] 3.2 创建 `mcp-skills/deepstorm-mcp-playwright-read/SKILL.md`（Playwright MCP 使用指南 skill）

## 4. Sweep E2E 框架配置

- [x] 4.1 **`sweep/wizard.json`** 新增 `e2eFramework` select 问题，选项为 `playwright`（可扩展）
- [x] 4.2 **`sweep/skills/sweep-init/SKILL.md`** Playwright 配置改为 `{{#if}}` 条件包裹；MCP 检查改为读取 `.mcp.json` 而非 `.claude/settings.json`
- [x] 4.3 **`sweep/skills/sweep-plan/SKILL.md.tmpl`** Playwright MCP 的 `mcpCapabilities` 声明改为动态引用（No-op，已动态）
- [x] 4.4 **`sweep/skills/sweep-run/SKILL.md`** Playwright MCP 引用从 `.claude/settings.json` 改为 `.mcp.json`

## 5. 验证与构建

- [x] 5.1 运行 `@deepstorm/cli build` 确认构建通过
- [x] 5.2 补充测试并全部通过（372 tests, 38 files）
- [x] 5.3 运行 `openspec verify` 验证 artifact 完整性
