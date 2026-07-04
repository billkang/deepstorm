## Context

CLI 包的 `build-registry.ts` 负责在构建时将源码目录（`mcp/`、`env-examples/`、`mcp-skills/`）复制到 `dist/` 目录，setup 流程在运行时读取 `dist/` 中的内容来生成 `.mcp.json` 和 `.env`。

当前复制逻辑使用 `fs.existsSync(dest) continue` + `fs.cpSync(src, dest, { ... force: false })`，意味着如果目标文件已存在则跳过复制。这导致：

1. `mcp/` 目录下文件更新后，后续构建不会反映到 `dist/mcp/`
2. `env-examples/` 目录同样存在此问题
3. 当前 `dist/mcp/docs-reference/context7.json` 是旧版本，缺少 `mcpServers` 字段

## Goals / Non-Goals

**Goals:**
- 确保 `dist/mcp/` 始终与 `mcp/` 源目录同步（覆盖式更新）
- 确保 `dist/env-examples/` 始终与 `env-examples/` 源目录同步（覆盖式更新）
- 调整 setup 向导中 context7 的默认选中行为
- 新增 `playwright.env-example` 使 playwright 的环境变量能被写入 `.env`

**Non-Goals:**
- 不改变插件（packages/*/）级别的 mcp 构建逻辑（块 4a），保持原有的增量复制策略
- 不修改 setup 向导的其他交互逻辑

## Decisions

### D1: CLI 自有资源复制改为强制覆盖

**决策：** 移除 build-registry.ts 中块 4b（mcp）、4c（mcp-skills）、4d（env-examples）的 `fs.existsSync(dest) continue` 跳过检查，并将 `force: false` 改为 `force: true`。

- **为什么不是 addClean？** 在 build script 中增加 `rm -rf dist/mcp` 也可以，但现有代码结构中加 clean 步骤需要额外维护，且这些目录都很小（< 1KB 每个文件），覆盖复制性能成本可忽略
- **为什么不全量覆盖（含块 4a）？** 块 4a 处理的是各 plugin 包的 assets，这些包各自独立构建，增量跳过是预期行为。风险集中在 CLI 自有资源上

**变更文件：** `packages/cli/src/build-registry.ts`，三处循环：
- 块 4b（mcp 配置，行 351-363）：移除行 359，行 360 `force: false` → `force: true`
- 块 4c（mcp-skills，行 365-378）：移除行 374，行 375 `force: false` → `force: true`
- 块 4d（env-examples，行 380-393）：移除行 389，行 390 `force: false` → `force: true`

### D2: 移除 setup 向导中 context7 的默认选中

**决策：** 将 `runWizardFlow(reader, registry, ['context7'])` 改为 `runWizardFlow(reader, registry, [])`。

- **选项考虑：**
  - `[]`（空数组）：完全不预选，用户主动选择需要的工具。最简单、最中性
  - 不清除而只是改为其他默认值：目前没有合理的替代默认值，其他工具也应让用户自主选择
- **影响：** 用户进入 setup 交互界面时，初始没有任何 MCP 工具被选中，用户按需勾选

### D3: 新增 playwright.env-example

**决策：** 创建 `packages/cli/env-examples/playwright.env-example`，内容包含 `❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）`。

- 遵循与其他 env-example 文件一致的格式（装饰线 + 注释说明 + KEY= 占位值）
- playwright MCP 使用 `ws` 类型连接，环境变量不需要 `dotenv-cli` 包装，但需要在 shell 环境或 `.env` 中设置（Claude Code 的 MCP 客户端会解析 `${VAR}` 语法）

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| `force: true` 可能覆盖用户手动修改的 `dist/mcp/` 文件 | `dist/` 是构建产物，不应手动修改。CI 和 publish 流程都会重新构建，所以 `dist/` 只存在构建过程 |
| setup 移除 context7 默认后，用户可能不知道需要选择它 | context7 的 tool 卡片描述会显示在向导中，用户按需选择即可。另外 `<skill-trigger>` 机制在需要时会提示 |
| playwright 是 ws 类型，`${❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）}` 依赖环境变量 | env-example 中提供注释说明如何设置该变量。用户需要在自己的环境中确保该变量可用 |

## Migration Plan

1. 修改 `build-registry.ts`（三个块的复制逻辑）
2. 修改 `setup.ts`（默认值）
3. 新增 `playwright.env-example`
4. 运行 `pnpm build` 重新构建，验证 `dist/mcp/docs-reference/context7.json` 已包含 `mcpServers` 字段
5. 验证 `dist/env-examples/` 中包含新的 playwright 文件

## Open Questions

- 无
