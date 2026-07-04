## 1. 修复 `plugin-builder.ts` 中环境变量模板文件扩展名

- [ ] 1.1 修改 `packages/cli/src/engine/plugin-builder.ts` 第 102 行：将 `${mcpName}.md` 改为 `${mcpName}.env-example`
- [ ] 1.2 验证：`pnpm build && pnpm cli plugin build` 后检查 `.deepstorm/plugins/deepstorm/.env.example` 是否包含 figma、github、jira、context7 的 env stub

## 2. 为 `context7.json` 补充 MCP 服务启动配置

- [ ] 2.1 在 `packages/cli/mcp/docs-reference/context7.json` 中新增 `mcpServers` 字段，使用 `@upstash/context7-mcp` 的 npx 启动命令（与 jira/figma 相同的 dotenv-cli 模式）
- [ ] 2.2 验证：`pnpm build && pnpm cli plugin build` 后检查 `.deepstorm/plugins/deepstorm/.mcp.json` 是否包含 `deepstorm-context7` 条目
- [ ] 2.3 验证：`pnpm build` 后运行 `node dist/cli.js setup --non-interactive --tools reef --mcp context7` 检查根目录 `.mcp.json` 是否包含 `deepstorm-context7`

## 3. 补全 test-project 环境变量

- [ ] 3.1 在 `packages/cli/test-project/.env` 中添加 Playwright 配置段（`❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）`），格式与其他 MCP 服务一致

## 4. 回归验证

- [ ] 4.1 运行 `pnpm test` 确认 CLI 测试全部通过
- [ ] 4.2 `pnpm build:plugin` 完整构建插件，确认输出目录结构完整
