# DeepStorm

DeepStorm 是一套 AI 协同工具集，覆盖产品→开发→测试→运维全链路，包含五个套件、一个 CLI 和一个 Harness Agent：

| 套件 | 定位 | 类型 |
| --- | --- | --- |
| `@deepstorm/tide` | 产品侧 — BMAD 需求讨论、PRD、Jira | 套件（纯 skill） |
| `@deepstorm/reef` | 开发侧 — 规范生成、代码实现 | 套件（skills + agents + hooks） |
| `@deepstorm/sweep` | 测试侧 — 测试生成、覆盖率、CI | 套件（skills） |
| `@deepstorm/atoll` | 运维侧 — 部署辅助、监控、故障排查 | 套件（skills） |
| `@deepstorm/pilot` | 领航 — OpenSpec 自动实现 Harness Agent | 套件（daemon + CLI） |
| `@deepstorm/cli` | 安装入口 — 安装向导、配置、模板、诊断 | npm 包 |

## 关键约定

- **套件组织**：各套件的 skills/agents/mcp/hooks 分布在 `packages/*/` 下，`pnpm build` 时由构建脚本聚合到 `dist/`
- **后端语言**：reef 支持 **Java (Spring Boot)** 和 **Python (FastAPI)** 两套后端变体，通过 `variants/{lang}/` 目录隔离，`wizard.json` 中的 `isPython` 标志控制模板渲染行为
- **纯 skill 套件**（tide）：所有逻辑写在 SKILL.md 中，无需编译
- **CLI 安装**：用户通过 `npx @deepstorm/cli setup` 一键完成安装和配置
- **API Keys**：通过 `.env` 文件配置，不会提交到 Git
- **featureId 格式**：`MODULE-FEATURE-SUBFEATURE`（全大写 + 连字符 + 可含数字）
- **sessionId 格式**：`tide-YYYYMMDD-NNN`
- **流程图约定**：所有流程图必须使用 **Mermaid** 语法（` ```mermaid `），禁止使用 ASCII 字符画流程图（` ```text `）
- **需求讨论优先**：当用户输入需求、功能描述或变更意图时，必须先通过 `/deepstorm-discuss` 或 BMAD 相关 skill 进入需求讨论环节，将需求讨论清楚后再进入后续开发流程，不得跳过讨论直接进入实现
- **套件-CLI 联动**：修改 reef/tide/sweep/atoll 套件内容（hooks、templates、skills、agents、wizard.json）时，**必须同步检查并更新 `packages/cli/src/commands/` 下对应的消费命令**（setup、update、doctor、template-upgrade 等），确保 CLI 资产同步逻辑与套件变更一致
- **项目事实**：`.deepstorm/context.md` 记录项目的技术栈、关键模块、历史踩坑和外部引用，由 reef-start 阶段一结束时按需维护

## 开发工作流

DeepStorm 自身套件开发使用 **BMAD → OpenSpec → writing-skills** 三阶段协作。详细规范见 `docs/deepstorm-development.md`。

**产出参考：**

- **BMAD 基线 PRD（示例）：** `openspec/specs/tide-core/spec.md` ← 由 BMAD 需求讨论输出

```mermaid
flowchart LR
    BMAD["Tide / BMAD<br>需求讨论 → PRD"] --> OPSX["OpenSpec: /opsx:new<br>产出 spec + tasks"]
    OPSX --> WS["writing-skills<br>消费 spec 产出 SKILL.md"]
    WS --> APPLY["/opsx:apply<br>按 tasks 实现"]
    APPLY --> VERIFY["/opsx:verify<br>验证"]
    VERIFY --> SYNC["同步 spec → openspec/specs/"]
    SYNC --> ARCHIVE["/opsx:archive<br>归档"]
```

每个 OpenSpec change 在**独立的 Claude Code 会话**中完成。

## playground — 测试项目

`playground/` 是 DeepStorm CLI 的**端到端测试项目**，所有 CLI 功能验证在此进行。

- **CLI 验证**：`deepstorm setup`、`deepstorm update`、`deepstorm doctor` 等命令的 E2E 测试（`pnpm playground:verify`）
- **插件验证**：`playground/.deepstorm/` 为插件目录，插件能力在此验证（待建）
- **配置格式**：`.deepstorm/settings.json` 存 DeepStorm 自有配置，`.claude/settings.json` 存 Claude Code 原生配置，MCP server 使用 `deepstorm-*` 前缀
- **当前配置**：已安装 skills（jira-read、feishu-wiki-read、sweep-init/plan/run）、MCP servers（github、context7、jira、figma、playwright）、reef 配置（frontend: angular, backend: java）

## gstack

使用 gstack 提供的 `/browse` skill 进行所有网页浏览，**不要使用 `mcp__claude-in-chrome__*` 工具**。

gstack 提供的可用 skills（通过 `Skill` 工具调用）：

| 命令 | 用途 |
| ---- | ---- |
| `/office-hours` | Office hours |
| `/plan-ceo-review` | CEO review plan |
| `/plan-eng-review` | Engineering review plan |
| `/plan-design-review` | Design review plan |
| `/design-consultation` | Design consultation |
| `/design-shotgun` | Design shotgun |
| `/design-html` | Design HTML |
| `/review` | Review |
| `/ship` | Ship |
| `/land-and-deploy` | Land and deploy |
| `/canary` | Canary |
| `/benchmark` | Benchmark |
| `/browse` | Web browsing（替代 mcp__claude-in-chrome） |
| `/connect-chrome` | Connect Chrome |
| `/qa` | QA |
| `/qa-only` | QA only |
| `/design-review` | Design review |
| `/setup-browser-cookies` | Setup browser cookies |
| `/setup-deploy` | Setup deploy |
| `/setup-gbrain` | Setup gbrain |
| `/retro` | Retrospective |
| `/investigate` | Investigate |
| `/document-release` | Document release |
| `/document-generate` | Document generate |
| `/codex` | Codex |
| `/cso` | CSO |
| `/autoplan` | Autoplan |
| `/plan-devex-review` | Devex review plan |
| `/devex-review` | Devex review |
| `/careful` | Careful |
| `/freeze` | Freeze |
| `/guard` | Guard |
| `/unfreeze` | Unfreeze |
| `/gstack-upgrade` | Upgrade gstack |
| `/learn` | Learn |
