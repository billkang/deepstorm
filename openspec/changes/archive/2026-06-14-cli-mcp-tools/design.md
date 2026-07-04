# Design: DeepStorm MCP 基础设施集成

## Context

DeepStorm CLI setup 流程已支持通过 `selectTools()` 选择套件（reef/tide/sweep/atoll）并安装对应 skills/agents/hooks，但缺少 MCP 服务器基础设施的标准化配置能力。`mergeMcpServers()` 函数已实现并测试，但从未在 setup 流程中被调用。

同时存在一个预存 bug：`doctor.ts` 中的 `loadValidConfigKeys()` 在 config-schema.json 中错误地查找 `deepstorm.properties`，而 schema 根级属性实际为 `tide/reef/sweep/atoll`，导致配置校验几乎从不生效。

## Goals / Non-Goals

### Goals

1. 用户在 `deepstorm setup` 中可以通过 Step 1 选择要集成的 MCP 服务（Jira、钉钉云文档、GitHub、Figma）
2. 选择后自动生成 `.mcp.json`，调用已有的 `mergeMcpServers()`
3. 按用户选择动态写入对应服务的 `DEEPSTORM_*` env stub 到 `.env`
4. 支持 `--reconfigure` 和 `uninstall` 正确清理 MCP 配置
5. 新增 `--mcp-tools` 非交互模式参数
6. 修复 doctor 配置校验 bug

### Non-Goals

1. 不涉及任何套件包（reef/tide/sweep/atoll）的修改 — MCP 是 DeepStorm 基础设施层
2. 不修改 `config set` 命令 — MCP 不走此路径
3. 不修改 `mergeMcpServers()` 函数本身
4. 不支持通过 `config set` 修改 MCP 选择

## Decisions

### D1: Setup 两步走架构

**决策**：setup 流程拆分为两个独立步骤，Step 1 选择 MCP 工具，Step 2 选择 DeepStorm 套件。

**理由**：MCP 是套件无关的基础设施。用户可能只配 MCP 不装套件，也可能跳过 MCP 只装套件。两步完全独立、互不强制。

### D2: MCP 配置 JSON 组织方式

**决策**：`packages/cli/mcp/{domain}/{service}.json`，每个服务一个独立 JSON 文件。

**理由**：
- 与 `skills/` 每个 skill 一个目录的模式一致
- 增删改查独立
- build-registry 已支持扫描任意层级的 `mcp/` 内容

### D3: MCP JSON 自包含元数据

**决策**：JSON 文件同时包含元数据和 `mcpServers` 配置，无需额外 metadata 文件。

```json
{
  "name": "jira",
  "domain": "project-management",
  "label": "Jira",
  "description": "任务跟踪与敏捷管理",
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "dotenv-cli", "-e", ".env", "--", "npx", "-y", "jira-mcp", "--stdio"]
    }
  }
}
```

### D4: MCP 合并策略（deepMerge）

**决策**：`deepMerge` 保留用户已有的 MCP server 配置，不覆盖。

**理由**：用户可能手动维护 `.mcp.json`，不会被工具暴力覆盖。`--reconfigure` 时通过 `cleanInstalled()` 清理后再重建。

### D5: `.mcp.json` 中 server 命名

**决策**：使用 `deepstorm-{service}` 前缀（如 `deepstorm-jira`）。

**理由**：
- 一眼可识别为 DeepStorm 管理
- `cleanInstalled()` 清理时不会误删用户自己配的同名 server
- 与 `DEEPSTORM_*` 环境变量风格一致

### D6: 安装记录

**决策**：通过 `deepstorm.installedMcpServers` 字段记录已安装的 MCP 服务名（如 `["jira", "github", "figma", "dingtalk-wiki"]`），存入 `.claude/settings.json`。

**幂等性**：写入前去重：`[...new Set([...existing, ...selected])]`

### D7: 凭据管理

**决策**：MCP server 统一通过 `dotenv-cli` 加载 `.env`，MCP JSON 中不声明 `env` 字段。

**env stub 命名规范**：`DEEPSTORM_{SERVICE}_TOKEN`

| 服务 | Env Var |
|------|---------|
| Jira | `DEEPSTORM_JIRA_TOKEN` |
| GitHub | `DEEPSTORM_GITHUB_TOKEN` |
| Figma | `DEEPSTORM_FIGMA_TOKEN` |
| 钉钉云文档 | `DEEPSTORM_DINGTALK_TOKEN` |

### D8: 注册表发现

**决策**：build-registry 新增 `mcpTools` 段，扫描 `mcp/**/*.json` 提取元数据（name、domain、label、description），聚合到 `registry.json`。

```json
{
  "mcpTools": {
    "jira": { "domain": "project-management", "label": "Jira", "description": "任务跟踪与敏捷管理" },
    "github": { "domain": "code-hosting", "label": "GitHub", "description": "源码托管与协作" },
    "figma": { "domain": "design-tools", "label": "Figma", "description": "原型设计与协作" },
    "dingtalk-wiki": { "domain": "knowledge-base", "label": "钉钉云文档", "description": "文档协作与知识库" }
  }
}
```

### D9: 非交互模式

**决策**：新增 `--mcp-tools` 参数。

```bash
deepstorm setup --non-interactive --mcp-tools jira,github --tools reef
```

### D10: env 动态生成

**决策**：按用户选择的 MCP 服务动态生成 env stub，仅写入需要的 token 占位符。

### D11: Config set 不处理 MCP

**决策**：MCP 仅在 `setup` / `setup --reconfigure` 中管理，不接受 `config set`。

### D12: 平台兼容

**决策**：使用 `npx -y` 而非 `npx.cmd`，Node.js 运行时自动处理平台差异。

### D13: MCP 服务实现来源

**决策**：复用 lc-toolkit 和 coral 项目的已验证 MCP server 命令：

| 服务 | MCP 包 | 来源 |
|------|--------|------|
| Jira | `jira-mcp` | lc-toolkit / coral |
| GitHub | `ghcr.io/github/github-mcp-server`（Docker） | lc-toolkit |
| Figma | `figma-developer-mcp` | lc-toolkit |
| 钉钉云文档 | `dingtalk-wiki@latest` | coral |

所有服务统一使用 `dotenv-cli` 加载 `.env`，MCP JSON 不声明 `env` 字段。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| GitHub MCP 需要 Docker | 无 Docker 环境的用户无法使用 GitHub MCP | 在 setup guide 中明确提示 Docker 依赖 |
| `dotenv-cli` 增加了启动命令复杂性 | 调试困难 | 保持与 lc-toolkit/coral 一致，已验证可运行 |
| Figma MCP 包名包含版本号风险 | 未来需更新 | 使用 `figma-developer-mcp`（无版本号，自动 latest） |
