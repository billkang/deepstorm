## 1. 类型定义

- [x] 1.1 在 `packages/cli/src/types/config.ts` 的 `DeepStormConfig` 接口中添加 `mcpCapabilities` 可选字段

## 2. CLI 安装流程 — setup.ts

- [x] 2.1 在 `packages/cli/src/commands/setup.ts` 中添加 `parseFrontmatter` 导入
- [x] 2.2 在 `packages/cli/src/commands/setup.ts` 中添加 `buildMcpCapabilities` 导入（已在 registry 中导出）
- [x] 2.3 在 `packages/cli/src/commands/setup.ts` 中添加 `buildUnifiedMcpCapabilities()` 导出函数，遍历 `cliDir/skills/{skillId}/SKILL.md.tmpl` 的 frontmatter 收集 `mcpCapabilities` 声明，调用 `buildMcpCapabilities()` 生成统一映射
- [x] 2.4 在 `runSetup()` 的 Step 5b 处调用 `buildUnifiedMcpCapabilities()`，在 Step 6 写入配置时将结果写入 `deepstormConfig.mcpCapabilities`

## 3. CLI 刷新流程 — config-refresh.ts

- [x] 3.1 在 `packages/cli/src/commands/config-refresh.ts` 中添加 `parseFrontmatter` 导入
- [x] 3.2 在 `packages/cli/src/commands/config-refresh.ts` 中添加 `buildMcpCapabilities` 和 `mergeDeepStormConfig` 导入
- [x] 3.3 在 `packages/cli/src/commands/config-refresh.ts` 中添加私有 `buildUnifiedMcpCapabilities()` 函数（逻辑与 setup.ts 中一致）
- [x] 3.4 在 `refreshConfig()` 中添加第 3 步，在 skill 模板重新渲染后调用 `buildUnifiedMcpCapabilities()` 并通过 `mergeDeepStormConfig()` 写入 `deepstorm.mcpCapabilities`

## 4. Skill 模板 — 统一引用 deepstorm.mcpCapabilities

- [x] 4.1 `reef-start/SKILL.md.tmpl`：移除 `{{reef_capabilities}}` 占位符行，将能力发现指引从 `deepstorm.installedMcpServers` + 模板变量交叉引用改为直接读取 `deepstorm.mcpCapabilities`
- [x] 4.2 `reef-gen-frontend/SKILL.md.tmpl`：将 `deepstorm.installedMcpServers` 引用改为 `deepstorm.mcpCapabilities`
- [x] 4.3 `tide-discuss/SKILL.md.tmpl`：将 `{{tide_capabilities}}` / `deepstorm.installedMcpServers` 交叉引用改为直接读取 `deepstorm.mcpCapabilities`，简化 MCP 能力发现步骤
- [x] 4.4 `tide-discuss/references/publish-flow.md`：同上，更新能力发现描述和 provider 选择逻辑
- [x] 4.5 `sweep-plan/SKILL.md.tmpl`：将 `{{sweep_capabilities}}` 和 `deepstorm.installedMcpServers` 引用统一改为 `deepstorm.mcpCapabilities`
- [x] 4.6 `figma-read/SKILL.md`：将 `{{capabilities}}` 引用改为 `deepstorm.mcpCapabilities`
- [x] 4.7 `jira-read/SKILL.md`：将 `{{capabilities}}` 引用改为 `deepstorm.mcpCapabilities`

## 5. README 文档同步

- [x] 5.1 `tide/README.md`：将 MCP 配置说明从 `deepstorm.installedMcpServers` 更新为 `deepstorm.mcpCapabilities`
- [x] 5.2 `reef/README.md`：同上

## 6. 测试项目 gitignore

- [x] 6.1 `test-project/.gitignore`：添加 `tide-data/` 忽略规则
