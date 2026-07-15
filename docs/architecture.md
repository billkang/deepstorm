# DeepStorm Architecture

> DeepStorm 是一套 AI 协同工具集，覆盖产品→开发→测试→运维全链路。用户通过 `npx @deepstorm/cli setup` 在项目中一键安装，获得适配技术栈的 Claude Code skills + agents + hooks。

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   用户项目根目录                          │
│                                                         │
│  .claude/             Claude Code 原生配置 + plugin      │
│  .deepstorm/          DeepStorm 自有配置                 │
│  .env                 环境变量 / API Keys                │
│  CLAUDE.md            Agent 行为规范（项目指令）          │
│  openspec/            OpenSpec 变更管理                  │
└─────────────────────────────────────────────────────────┘
           ▲                            │
           │ npx @deepstorm/cli setup    │ 部署 skills/agents/hooks
           │                            ▼
┌─────────────────────────────────────────────────────────┐
│           @deepstorm/cli (npm 包)                       │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │   setup   │ │  update  │ │  doctor  │ │  plugin    │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │   init   │ │  config  │ │ template │ │  release   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│                                                         │
│  dist/              构建产物（registry + skills + etc）  │
└─────────────────────────────────────────────────────────┘
           ▲
           │ pnpm build（从 packages/* 聚合）
           ▼
┌─────────────────────────────────────────────────────────┐
│                    packages/                             │
│                                                         │
│  tide/   产品侧    纯 skill（无需编译）                   │
│  reef/   开发侧    skills + agents + hooks               │
│  sweep/  测试侧    skills（可选 hooks）                   │
│  atoll/  运维侧    skills                                │
│  pilot/  自动领航  daemon + CLI                          │
│  cli/    安装入口  engine + merger + wizard + template   │
└─────────────────────────────────────────────────────────┘
```

## 二、套件定位

| 套件 | 定位 | 类型 | 主要内容 |
|------|------|------|---------|
| `tide` | 产品侧 — BMAD 需求讨论、PRD、Jira | 纯 skill（SKILL.md） | `/bmad-brainstorming`、需求讨论 skill |
| `reef` | 开发侧 — 规范生成、代码实现 | skills + agents + hooks | reef-start（入口）、style/lint、review、hooks（pre-commit/pre-push） |
| `sweep` | 测试侧 — 测试生成、覆盖率、CI | skills | 测试 init/plan/run、Playwright 集成 |
| `atoll` | 运维侧 — 部署辅助、监控、故障排查 | skills | 部署检查、故障诊断 |
| `pilot` | 领航 — OpenSpec 自动实现 Agent | daemon + CLI | orchestrator（多 agent 编排）、pilot-summary |
| `cli` | 安装入口 — 向导、配置、模板、诊断 | npm 包 | setup、update、doctor、config、template、plugin-build |

## 三、目录结构约定

```
项目根目录/
├── .claude/                    ← Claude Code 工作目录
│   ├── settings.json           ← Claude Code 原生配置（mcpServers、sandbox 等）
│   ├── settings.local.json     ← 本地覆盖（不提交）
│   ├── hooks.json              ← hooks 注册
│   ├── skills/                 ← installed skills（由 setup 部署）
│   ├── agents/                 ← installed agents（由 setup 部署）
│   ├── hooks/                  ← installed hooks（由 setup 部署）
│   └── ...                     ← 其他 Claude Code 原生文件
│
├── .deepstorm/                 ← DeepStorm 自有配置（提交 Git）
│   ├── settings.json           ← 安装记录 + 技术栈配置（由 setup/config 写入）
│   └── context.md              ← 项目上下文地图（由 reef-start 维护）
│
├── .claude-plugin/ (未来→ .deepstorm-plugin/)
│                               ← Plugin 元数据（marketplace.json、plugin.json）
│
├── .env                        ← API Keys / 环境变量（不提交）
├── .mcp.json                   ← MCP 服务器配置（由 setup 生成）
├── CLAUDE.md                   ← Agent 行为规范（项目指令，提交 Git）
│
├── openspec/                   ← OpenSpec 变更管理
│   ├── specs/                  ← 归档的 spec 基线
│   ├── changes/                ← 活跃变更
│   │   └── <change-name>/
│   │       ├── proposal.md
│   │       ├── specs/
│   │       ├── design.md
│   │       ├── tasks.md
│   │       └── verify-report.json
│   └── changes/archive/        ← 已归档变更
│
├── docs/                       ← 项目文档
│   ├── architecture.md         ← 本文档
│   ├── deepstorm-development.md
│   └── ...
│
├── packages/                   ← monorepo 套件源码
└── playground/                 ← CLI E2E 测试项目
```

### 配置分层

| 层级 | 文件 | 用途 | 谁写 | Git 策略 |
|------|------|------|------|---------|
| **L1: 行为规范** | `CLAUDE.md` | Agent 怎么做（规则/流程/约定） | 人工 | ✅ 提交 |
| **L2: 架构地图** | `.deepstorm/context.md` | 项目有什么（模块/风险/引用） | reef-start 自动 | ✅ 提交 |
| **L3: 安装配置** | `.deepstorm/settings.json` | 技术栈 + 安装记录 | CLI setup/config 写入 | ✅ 提交 |
| **L4: 原生配置** | `.claude/settings.json` | Claude Code 原生：MCP、沙箱 | CLI setup + 人工 | ❌ 不提交 |
| **L5: 密钥** | `.env` | API Keys | 人工 | ❌ 不提交 |

### 关键原则

- **`.deepstorm/` 存 DeepStorm 自有配置**：settings.json（安装记录 + 技术栈）、context.md（上下文地图）。这些是项目元数据，提交 Git 供团队共享。
- **`.claude/` 存 Claude Code 原生数据**：settings.json 只放 mcpServers、sandbox 等 Claude Code 原生配置。skills/agents/hooks 是安装产物。
- **`.claude/settings.json` 不涉及 DeepStorm 自定义字段**：DeepStorm 的自定义配置全部通过 `.deepstorm/settings.json` 读写。

## 四、CLI 安装流程

```
npx @deepstorm/cli setup
┌──────────────────────────────────────────────────────────┐
│ Step 1    向导流程（工具选择 → MCP 选择 → 问答）         │
│ Step 2    MCP 基础设施配置（.mcp.json）                  │
│ Step 3    安装 MCP 使用指南 skill                        │
│ Step 4    渲染 skills/agents/hooks → .claude/            │
│ Step 5    合并 hooks.json                                │
│ Step 6    写入 .deepstorm/settings.json（安装记录）       │
│ Step 6b   写入 .claude/settings.json（MCP/沙箱配置）     │
│ Step 7    生成 .env 环境变量模板                          │
│ Step 8    输出引导信息                                    │
└──────────────────────────────────────────────────────────┘
```

**配置文件职责分割：**

| 内容 | 写入位置 | 说明 |
|------|---------|------|
| 技术栈配置（frontend/backend） | `.deepstorm/settings.json` | DeepStorm 自有 |
| 安装记录（installedSkills/Agents/McpServers） | `.deepstorm/settings.json` | DeepStorm 自有 |
| MCP 能力映射 | `.deepstorm/settings.json` | DeepStorm 自有 |
| MCP Server 定义（mcpServers） | `.claude/settings.json` | Claude Code 原生 |
| 沙箱禁用（sandbox） | `.claude/settings.json` | Claude Code 原生 |
| enabledMcpjsonServers | `.claude/settings.json` | Claude Code 原生 |

## 五、Plugin 系统

DeepStorm 支持两种安装方式：

| 方式 | 命令 | 目标目录 | 用途 |
|------|------|---------|------|
| **CLI 安装** | `npx @deepstorm/cli setup` | `.claude/` | 向现有项目安装 DeepStorm 能力 |
| **Plugin 构建** | `npx @deepstorm/cli plugin build` | `.deepstorm-plugin/`（未来） | 打包为 Claude Plugin 分发给团队 |

Plugin build 流程：
1. 运行同样的向导流程（工具/MCP/问答）
2. 构建 `plugin.json` + `marketplace.json`
3. 渲染 skills/agents/hooks 到输出目录
4. 生成 `.gitignore` 忽略规则

安装后通过 Claude Code 的 `/plugin install` 命令加载。

## 六、开发工作流

### 自身开发：BMAD → OpenSpec → writing-skills

详见 `docs/deepstorm-development.md`。核心路径：

```
BMAD 讨论 → brainstorming 产出
         → /opsx:new 创建 change
         → proposal → specs → design → tasks
         → Superpowers 门禁
         → TDD apply（RED→GREEN→REFACTOR）
         → verify → archive
```

每个 OpenSpec change 在一个独立 Claude Code 会话中完成。

### 给用户的工作流：reef-start

详见 `packages/reef/skills/reef-start/SKILL.md`。核心路径：

```
Path A（Issue 驱动）: Issue → 需求 → 分支 → SDD → 实现 → 分支结束
Path B（开放讨论）:   需求讨论 → brainstorming → SDD → 分支 → 实现 → 分支结束
```

## 七、注册中心（Registry）

`packages/cli/src/engine/registry.ts` 管理 CLI 需要的三个注册表：

| 注册表 | 内容 | 来源 |
|--------|------|------|
| `registry.skills` | 所有 skill 的描述和 configKey | 各套件 `wizard.json` 聚合 |
| `registry.wizards` | 问答向导的问题定义 | 各套件 `wizard.json` |
| `registry.mcpTools` | MCP 工具的定义和域名 | 各套件的 wizard + cli |

构建时 `pnpm build` 将各套件的 `wizard.json` 聚合为 `packages/cli/dist/registry.json`，运行时 CLI 从 registry 读取工具结构。

## 八、跨包引用规则

```
packages/cli/                          ← 安装入口（无跨包引用）
├── src/engine/                        ← registry 读写、install、build
├── src/merger/                        ← settings/mcp/hooks/env 合并
├── src/wizard/                        ← 向导流程、问答、MCP 选择
├── src/template/                      ← 模板渲染、registry 构建
├── src/commands/                      ← 子命令（setup/update/doctor/...）
└── src/utils/                         ← 工具函数

packages/reef/                         ← 开发侧（被 CLI 读取，不引用 CLI）
├── skills/                            ← SKILL.md（用户侧 skill）
├── agents/                            ← 自定义 agent 定义
├── hooks/                             ← 自定义 hook
└── wizard.json                        ← registry 数据源

packages/tide/                         ← 产品侧（纯 skill，无构建产物）
└── skills/                            ← SKILL.md + 参考文件

packages/sweep/                        ← 测试侧
packages/atoll/                        ← 运维侧
packages/pilot/                        ← 自动领航
```

**关键规则：** CLI 的构建路径是单向的——`cli/src/` 不引用 `packages/*/`，它通过 `pnpm build` 聚合后的 `dist/registry.json` 获取套件信息。

## 九、关键设计模式

1. **Spec 驱动**：所有能力开发从 spec 开始（不是代码），spec 的 WHEN/THEN 约束优先
2. **TDD 铁律**：No production code without a failing test first（适用于所有代码行为改动）
3. **Superpowers 门禁**：实现前必须加载相关技能，rigid 技能纪律优先于默认流程
4. **单会话原则**：每个 OpenSpec change 在一个独立 Claude Code 会话完成
5. **配置分层**：行为规范（CLAUDE.md）→ 项目事实（context.md）→ 安装记录（settings.json）→ 原生配置（.claude/）→ 密钥（.env）
6. **套件-CLI 联动**：修改套件内容时必须同步更新 CLI 消费命令（setup/update/doctor/template-upgrade）

---

> 本文档随 DeepStorm 开发持续更新。配套文档见：
> - [开发工作流](deepstorm-development.md)
> - [OpenSpec 规范](../openspec/README.md)（如存在）
