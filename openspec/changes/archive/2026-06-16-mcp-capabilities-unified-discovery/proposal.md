## Why

当前 DeepStorm 各套件（tide、reef、sweep）在运行时感知 MCP 服务可用性的方式不一致且冗余：每个套件在安装时通过 `{{xxx_capabilities}}` 模板变量注入各自的能力映射，运行时再与 `deepstorm.installedMcpServers` 交叉引用来判断可用 provider。这种分散维护的方式导致：
- 每次新增 skill 时需手动维护模板变量
- 运行时发现逻辑在各 SKILL.md 中重复，易出错
- 无法统一管理跨套件共享的 MCP 能力依赖

需要一个统一的 MCP 能力发现机制，在 CLI 安装/刷新时从所有 skill 模板的 frontmatter 自动收集 `mcpCapabilities` 声明，构建完整的能力映射写入 settings.json，各套件直接读取即可。

## What Changes

1. **CLI 安装流程增强（`setup.ts`）**：新增 `buildUnifiedMcpCapabilities()` 函数，扫描 `skills/{skillId}/SKILL.md.tmpl` 的 frontmatter 收集 `mcpCapabilities` 声明，合并后写入配置的 `deepstorm.mcpCapabilities` 字段
2. **CLI 配置刷新增强（`config-refresh.ts`）**：同步新增 `buildUnifiedMcpCapabilities()`，在 `npx @deepstorm/cli config-refresh` 时重建能力映射并通过 `mergeDeepStormConfig` 写入 settings.json
3. **类型系统扩展**：在 `DeepStormConfig` 接口新增 `mcpCapabilities` 字段
4. **各套件 skill 模板更新**：将 `{{tide_capabilities}}`、`{{reef_capabilities}}`、`{{sweep_capabilities}}` 等模板变量引用统一替换为 `deepstorm.mcpCapabilities`
5. **README 文档同步更新**：tide、reef 的 README 中关于 MCP 能力发现的描述从 `deepstorm.installedMcpServers` 统一指向 `deepstorm.mcpCapabilities`
6. **MCP skill 引用文件**：figma-read、jira-read 的 SKILL.md 中检查 MCP 可用性的方式从 `{{capabilities}}` 改为 `deepstorm.mcpCapabilities`
7. **测试项目 gitignore（次要）**：新增 `tide-data/` 忽略规则

## Capabilities

### New Capabilities
- `mcp-capabilities-discovery`: 统一的 MCP 能力映射发现机制，在 CLI 安装/刷新时自动构建并写入 settings.json

### Modified Capabilities
- N/A（本次改动不修改现有 spec 级别的行为要求，仅改变实现机制）

## Impact

- **`packages/cli/src/commands/setup.ts`**：新增 `buildUnifiedMcpCapabilities` 导出函数，在 Step 6 写入配置前构建能力映射
- **`packages/cli/src/commands/config-refresh.ts`**：新增 `buildUnifiedMcpCapabilities` 私有函数，在 refresh 第三步通过 `mergeDeepStormConfig` 写入 settings.json
- **`packages/cli/src/types/config.ts`**：`DeepStormConfig` 新增 `mcpCapabilities?` 字段
- **`packages/cli/src/template/registry.ts`**：导出 `buildMcpCapabilities`（已存在，仅调整导出）
- **`packages/cli/src/utils/frontmatter.ts`**：导出 `parseFrontmatter`（已存在，仅调整导入）
- **6 个 skill 模板文件**：引用路径统一更新
- **2 个 README 文件**：文档描述更新
- **向后兼容**：新增字段可选（`?`），旧版本 settings.json 无此字段时，skill 应降级为无 MCP 服务模式
