# Reef — 开发侧套件

> 🪨 珊瑚礁群由无数珊瑚虫经年构建——Reef 为代码开发提供模块化生成、风格约束与架构合规保障。

提供代码生成（前后端）、Git 工作流（commit/pr）、Jira 集成、代码审查、规格加固等全流程能力。

## 安装

```bash
# 通过 CLI 安装向导（推荐）
npx @deepstorm/cli setup

# 或手动从本地复制 skill 文件：
# Reef 的 skills/agents/hooks 在 packages/reef/ 下
```

## 安装后的 skill 列表

启动 Claude Code 后，Reef 的 skill 会自动在 `/help` 中列出。

## 多维 Code-Style 配置

setup 向导提供多维配置项，用户按需选择后自动生成对应的编码规范：

### 前端维度

| 维度 | 配置项 | 可选值 |
| --- | --- | --- |
| 框架 | `reef.frontend.framework` | Angular (默认)、React、Vue、无 |
| TypeScript | `reef.frontend.tsConfig` | Strict 严格模式、Standard 标准模式、不配置 |
| CSS | `reef.frontend.css` | Tailwind CSS、SCSS、CSS Modules、不使用 |
| 测试 | `reef.frontend.test` | Jest、Cypress、Playwright、不使用 |

### 后端维度

| 维度 | 配置项 | 可选值 | 依赖条件 |
|------|--------|-------|---------|
| 语言 | `reef.backend.language` | **Java** (默认)、**Python**、**Node.js (NestJS)**、无 | — |
| Java Web 框架 | `reef.backend.java.framework` | Spring Boot | language=java |
| Java ORM | `reef.backend.java.orm` | Hibernate | language=java |
| Java 数据库迁移 | `reef.backend.java.dbMigration` | Liquibase | language=java |
| Java AI 框架 | `reef.backend.java.ai` | Spring AI | language=java |
| Java 测试 | `reef.backend.java.test` | JUnit 5 | language=java |
| Python Web 框架 | `reef.backend.python.framework` | FastAPI | language=python |
| Python ORM | `reef.backend.python.orm` | SQLAlchemy | language=python |
| Python 数据库迁移 | `reef.backend.python.dbMigration` | Alembic | language=python |
| Python AI 框架 | `reef.backend.python.ai` | LangChain | language=python |
| Python 测试 | `reef.backend.python.test` | pytest | language=python |
| Python 类型检查 | `reef.backend.python.typeChecker` | mypy | language=python |
| Python 格式化 | `reef.backend.python.formatter` | ruff | language=python |
| Node.js Web 框架 | `reef.backend.nodejs.framework` | NestJS | language=nodejs |
| Node.js ORM | `reef.backend.nodejs.orm` | Prisma | language=nodejs |
| Node.js AI 框架 | `reef.backend.nodejs.ai` | Claude Agent SDK | language=nodejs |
| Node.js 测试 | `reef.backend.nodejs.test` | Jest | language=nodejs |

### 非交互式配置

```bash
# Java 后端
npx @deepstorm/cli setup --non-interactive \
  --tools reef \
  --set reef.frontend.framework=angular \
  --set reef.frontend.tsConfig=strict \
  --set reef.frontend.css=tailwind \
  --set reef.backend.language=java \
  --set reef.backend.java.ai=spring-ai

# Python 后端
npx @deepstorm/cli setup --non-interactive \
  --tools reef \
  --set reef.techs=backend \
  --set reef.backend.language=python \
  --set reef.backend.python.framework=fastapi \
  --set reef.backend.python.orm=sqlalchemy \
  --set reef.backend.python.dbMigration=alembic \
  --set reef.backend.python.ai=langchain \
  --set reef.backend.python.test=pytest \
  --set reef.backend.python.typeChecker=mypy \
  --set reef.backend.python.formatter=ruff
```

### Node.js 后端

```bash
npx @deepstorm/cli setup --non-interactive \
  --tools reef \
  --set reef.techs=backend \
  --set reef.backend.language=nodejs \
  --set reef.backend.nodejs.framework=nestjs \
  --set reef.backend.nodejs.orm=prisma \
  --set reef.backend.nodejs.ai=claude-agent-sdk \
  --set reef.backend.nodejs.test=jest
```

### 配置迁移

如果已有旧版扁平配置，CLI 自动迁移到新版嵌套结构，缺失维度默认值为 `"none"`。每次 CLI 命令（`config-view`、`config-set`、`doctor` 等）都会触发自动迁移。

## 组件

### Skills

| Skill | 说明 |
|-------|------|
| `reef:reef-style-backend` | 后端编码规范 — quick-reference + examples，供 code-gen/code-audit 引用 |
| `reef:reef-style-frontend` | 前端编码规范 — quick-reference + examples，供 code-gen/code-audit 引用 |
| `reef:reef-gen-backend` | 后端代码编写流程，引用后端 style 获取规范详情。含数据库迁移生成工作流（按配置按需显示） |
| `reef:reef-gen-frontend` | 前端代码编写流程，引用前端 style 获取规范详情 |
| `reef:reef-commit` | CI 工作流辅助 |
| `reef:reef-pr` | PR 工作流辅助 |
| `reef:reef-start` | Jira 任务启动工作流 |
| `reef:reef-harden` | 规格文档强化 |
| `reef:reef-testcase` | 基于 Jira Issue 和 PRD 上下文生成结构化测试用例清单，覆盖正常流程/边界条件/异常场景/验收标准四维，输出兼容 superpowers |
| `reef:reef-scope` | 分支范围检查与拆分 — AI 语义分析 diff，检测是否涉及多业务领域，commit/CI 门禁阻断 + 自动拆分 |

### Agents

| Agent | 说明 |
|-------|------|
| `reef:reef-review-backend` | 后端代码审查（Java: 多租户安全／Spring Boot 规范；Python: 安全／FastAPI 规范；Node.js: NestJS 架构／Prisma 查询／TypeScript 规范） |
| `reef:reef-review-frontend` | 前端代码审查（Signal Forms、PrimeNG、UI 体验） |
| `reef:reef-review-infra` | 基础设施代码审查（CI/CD、构建配置） |
| `reef:reef-review-security` | 安全专项审查（多租户隔离、OWASP、越权、注入） |
| `reef:reef-scope-analysis` | 分支范围分析 — 检测分支涉及的业务领域，判断是否跨领域 |

### Commands

| Command | 说明 |
|---------|------|
| `/reef:reef-review` | 代码审计（自动检测变更范围，并行派发对应 agents） |
| `/reef:reef-commit` | Git CI 操作 |
| `/reef:reef-pr` | Git PR 操作 |

### Hooks

- `auto-format` — 在文件编辑后自动格式化代码（Python → ruff format，TS/HTML → eslint；Java 按 code-style 人工控制）
- `block-dangerous` — 拦截危险的 Bash 命令（rm -rf /、管道到 shell 等）
- `protect-files` — 保护敏感文件不被修改（.env、lock 文件、node_modules 等）
- `run-tests` — 关闭前自动运行前后端测试，确保测试通过
- `scope-check` — AI 语义分析分支 diff，检测业务领域范围（scope-detection 核心）
- `scope-gate` — commit/CI 门禁，多领域时阻断并输出拆分建议
- `scope-split` — 用户确认后自动创建子分支、拆分文件并提交
- `scope-setup` — 安装/卸载 pre-commit hook 和配置文件

### MCP 服务器依赖

所有 MCP 配置在**项目根目录**统一管理，通过 CLI 安装向导选择所需服务（参见根目录 [README](../../README.md#mcp-服务器配置)）。

| 服务器 | 域 | 所需环境变量 | 用途 |
|--------|-----|-------------|------|
| `figma` | design-tools | `DEEPSTORM_FIGMA_TOKEN` | Figma 设计集成 |
| `jira` | project-management | `DEEPSTORM_JIRA_TOKEN` | Jira 项目管理 |
| `github` | code-hosting | `DEEPSTORM_GITHUB_TOKEN` | GitHub API 集成 |
| `feishu-wiki` | knowledge-base | `DEEPSTORM_FEISHU_TOKEN` | 读取 Jira issue 中关联的 PRD 文档 |

> Reef 的 skill 引用文件已改为 MCP 无关化格式。运行时通过 `deepstorm.mcpCapabilities` 确定可用服务，不再绑定特定 MCP 实现。

## 开发

```bash
# 本地测试
npx @deepstorm/cli setup  # 通过 CLI 将 Reef skill 安装到 .claude/skills/
```

> 注意：Reef 的 skills/agents/hooks 由 `packages/cli/src/build-registry.ts` 在构建时聚合，非手动复制。

## 项目结构

```
reef/
├── agents/                 # 代码审查代理
├── hooks/                  # 事件钩子（代码格式化等）
├── skills/                 # 技能定义
├── wizard.json             # 向导配置（setup 时按维度引导用户选择）
├── CHANGELOG.md            # 变更日志
├── LICENSE                 # MIT 许可证
├── README.md               # 本文件
└── package.json            # 工作区包配置
```

> 注意：`.mcp.json` 已从各 package 中移除，MCP 服务器配置统一集中在 `packages/cli/mcp/`。

## License

MIT
