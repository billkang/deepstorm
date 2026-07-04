## 1. MCP 配置 JSON 文件

## 1. MCP 配置 JSON 文件（✅ 全部完成）

- [x] 1.1 创建 `packages/cli/mcp/project-management/jira.json` — Jira MCP server 配置
- [x] 1.2 创建 `packages/cli/mcp/code-hosting/github.json` — GitHub MCP server 配置
- [x] 1.3 创建 `packages/cli/mcp/design-tools/figma.json` — Figma MCP server 配置
- [x] 1.4 创建 `packages/cli/mcp/knowledge-base/dingtalk-wiki.json` — 钉钉云文档 MCP server 配置

## 2. Registry 类型和扫描（✅ 全部完成）

- [x] 2.1 在 `packages/cli/src/types/registry.ts` 中新增 `McpToolEntry` 接口和 `mcpTools` 字段
- [x] 2.2 在 `scripts/build-registry.mjs` 中新增 `mcpTools` 段扫描逻辑
- [x] 2.3 验证构建后 `registry.json` 包含正确的 `mcpTools`

## 3. Schema 和 Doctor 修复（✅ 全部完成）

- [x] 3.1 更新 `packages/cli/config-schema.json`，新增 `mcp.installedMcpServers` 字段
- [x] 3.2 修复 `packages/cli/src/commands/doctor.ts` 中 `loadValidConfigKeys()` 的路径 bug

## 4. Setup 流程 — MCP 选择（✅ 全部完成）

- [x] 4.1 新增 `packages/cli/src/wizard/mcp-select.ts` — MCP 工具选择 UI（展示 label + domain + description）
- [x] 4.2 新增 `packages/cli/src/wizard/mcp-env.ts` — 根据选中 MCP 服务动态生成 env stub（TDD）
- [x] 4.3 修改 `packages/cli/src/commands/setup.ts` — Step 1: 插入 MCP 选择并调用 `mergeMcpServers()`
- [x] 4.4 修改 `packages/cli/src/commands/setup.ts` — Step 1c: 写入 env stub（仅选中服务）
- [x] 4.5 修改 `packages/cli/src/commands/setup.ts` — 安装记录去重：`deepstorm.installedMcpServers`

## 5. 非交互模式（✅ 全部完成）

- [x] 5.1 修改 `packages/cli/src/commands/setup.ts` — 在非交互路径中解析 `--mcp-tools` 参数
- [x] 5.2 修改 `packages/cli/src/commands/setup.ts` — 非交互模式整合 MCP 选择和 env 写入

## 6. Guide 输出（✅ 全部完成）

- [x] 6.1 修改 `packages/cli/src/wizard/guide.ts` — 输出 MCP 安装摘要和环境变量提示

## 7. Reconfigure 和 Uninstall 验证（✅ TDD）

- [x] 7.1 验证 `cleanInstalled()` 能正确清理 `deepstorm-*` MCP server 条目（已有测试覆盖）
- [x] 7.2 验证 `uninstall` 流程正确清理 MCP（已有测试覆盖）

## 8. 测试（✅ 全部通过）

- [x] 8.1 为 `mcp-env.ts` 编写单元测试（4 tests）
- [x] 8.2 回归测试：90 tests 全部通过
- [x] 8.3 构建验证：`registry.json` 包含 4 个 MCP 工具
- [x] 8.4 回归测试：现有 16 个测试文件均不受影响
