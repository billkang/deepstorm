## ADDED Requirements

### Requirement: 项目初始化脚本化
sweep-init 的 Step 2（创建目录结构）和 Step 3（生成配置文件）SHALL 通过 `init-project.mjs` 脚本执行，取代 SKILL.md 中的内嵌 bash 和模板写入描述。

#### Scenario: 指定目标目录
- **WHEN** 调用 `node scripts/init-project.mjs --dir e2e --framework playwright`
- **THEN** 在 `e2e/` 下创建 `flows/`、`flows/reports/`、`scripts/` 目录，并生成 `package.json`、`playwright.config.ts`、`tsconfig.json` 文件

#### Scenario: 当前目录作为目标
- **WHEN** 调用 `node scripts/init-project.mjs --dir . --framework playwright`
- **THEN** 在当前目录下创建上述目录和文件

#### Scenario: 框架未配置
- **WHEN** 调用时不传 `--framework` 参数
- **THEN** 生成不含 Playwright 依赖的 `package.json`，输出提示"框架未配置"

#### Scenario: 目标目录已存在
- **WHEN** 目标目录中已有 `flows/` 子目录
- **THEN** 跳过目录创建，仅写入配置文件，输出警告

### Requirement: 配置文件读写操作
sweep-init 中所有对 `.deepstorm/settings.json` 的读写操作 SHALL 通过已有的 `env-manager.mjs` 或新增的配置工具函数完成，取代 SKILL.md 中的 `grep | cut` 管道。

#### Scenario: 读取框架配置
- **WHEN** 调用 `env-manager.mjs --framework`
- **THEN** 从 settings.json 的 `sweep.e2eFramework` 读取框架名并输出 JSON

#### Scenario: 写入 e2eProjectPath
- **WHEN** 初始化完成写入配置
- **THEN** 调用 `env-manager.mjs --set-e2e-path e2e`，将 `sweep.e2eProjectPath` 写入 settings.json

### Requirement: MCP 配置检查
sweep-init 的 Step 7 SHALL 通过已有的 `env-manager.mjs --check-mcp` 检查 MCP 服务配置状态。

#### Scenario: MCP 已配置
- **WHEN** `.mcp.json` 中存在 `deepstorm-playwright`
- **THEN** 输出 `{ "available": true, "mcpName": "deepstorm-playwright" }`

#### Scenario: MCP 未配置
- **WHEN** `.mcp.json` 中不存在 `deepstorm-playwright`
- **THEN** 输出 `{ "available": false }`，不阻塞流程
