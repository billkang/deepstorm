# Design: reef Node.js 变体支持

## Context

### 现状

reef 套件当前支持两个后端变体，采用统一的目录约定组织：

```
skills/reef-gen-backend/variants/{java,python}/   → 代码生成变体
skills/reef-style-backend/variants/{java,python}/  → 代码规范变体
skills/reef-style-backend/fragments/{java,python}/ → 规范片段
agents/variants/{java,python}/                     → 审查 agent 变体
wizard.json                                         → 安装向导问题定义
```

wizard.json 中通过分层组问题实现：`backend.language` → 条件性展开 `backend.{lang}.details`。Java 变体已具备 AI 集成（Spring AI）作为子选项；Python 变体无可用 AI 框架，对应选项不显示。

### 新增需求

新增 **Node.js** 语言变体（NestJS + Prisma + Claude Agent SDK），遵循"二维模型"——语言变体与 AI 集成是独立的可选维度：

```
后端语言 → Node.js → 可选配置:
                      - MVC: NestJS
                      - ORM: Prisma
                      - AI: Claude Agent SDK
```

### 约束

- Claude Agent SDK 当前仅 Node.js 可用（类似 Spring AI 当前仅 Java 可用）
- NestJS、Prisma、Claude Agent SDK 三者均为独立配置项，用户可自由组合
- 遵循现有 Java/Python 的 `.tmpl` 模板渲染机制，不引入新的模板引擎
- 遵循现有 skill 目录约定，构建脚本纳入 `dist/` 聚合

## Goals / Non-Goals

**Goals:**
- Node.js 变体与 Java/Python 平级，遵循相同的目录约定和构建流程
- NestJS 脚手架模板（项目初始化）支持用户选择是否启用 Prisma 和 Claude Agent SDK
- Prisma Schema 与 NestJS Module 的代码生成能力
- Claude Agent SDK 集成层：Agent 初始化模板、Tool 定义规范、MCP Server 配置
- Node.js 后端代码审查 agent 覆盖 NestJS 和 Prisma 模式
- CLI wizard 支持 Node.js 语言选择及 NestJS/Prisma/Claude Agent SDK 的子选项
- ESLint + Prettier 代码格式化配置，以 fragment 形式纳入 code-style 体系

**Non-Goals:**
- 不涉及 tide/sweep/atoll/pilot 套件的 Node.js 支持
- 不开发新的模板引擎——复用现有 `.tmpl` + 构建脚本聚合机制
- 不包含运行时 NestJS 库或 CLI 工具的安装——依赖用户已有 Node.js 环境
- 不包含 Prisma 以外的 Node.js ORM 支持（如 TypeORM、Drizzle）

## Decisions

### Decision 1: Node.js 变体目录结构

**方案：** 遵循 Java/Python 模式，在现有 variant 目录中并行新增 `nodejs/`

```
packages/reef/
├── skills/
│   ├── reef-gen-backend/variants/nodejs/
│   │   └── steps.md                     # Node.js 代码生成步骤
│   ├── reef-style-backend/variants/nodejs/
│   │   ├── quick-reference.md           # 快速参考
│   │   └── examples/                    # NestJS 代码示例
│   └── reef-style-backend/fragments/nodejs/
│       ├── nestjs-eslint.json           # ESLint 配置
│       ├── nestjs-prettier.json          # Prettier 配置
│       └── nestjs-structure.md           # 项目结构规范
├── agents/variants/nodejs/
│   └── reef-review-backend.md           # Node.js 后端审查 agent
└── wizard.json                           # 新增 nodejs 语言组
```

**理由：**
- 沿用已有模式，最小化学习成本
- Java/Python 的变体路径不变，无侵入
- 构建脚本只需在原有 glob 模式中增加 `nodejs/` 即可

**备选方案考虑：**
- 将 Node.js 变体独立为 `packages/reef-nodejs/` 包 → 否决。保持 mono-repo 内聚性，避免包拆分导致的维护负担

### Decision 2: Claude Agent SDK 集成层位置

**方案：** 将 Claude Agent SDK 集成层放在 `packages/reef/variants/nodejs/claude-agent-sdk/` 下

```
packages/reef/variants/nodejs/
├── templates/                 # NestJS 项目脚手架模板
│   ├── base/                  # 基础 NestJS 项目模板
│   ├── base+prisma/           # + Prisma
│   ├── base+agent-sdk/        # + Claude Agent SDK
│   └── base+prisma+agent-sdk/ # + Prisma + Claude Agent SDK
├── code-style/                # NestJS 代码规范（由 skills fragment fallback 覆盖）
└── claude-agent-sdk/
    ├── templates/             # Agent SDK 初始化模板
    └── skills/                # Agent SDK 开发 skill
```

**理由：**
- Claude Agent SDK 当前仅适用于 Node.js，放在 `nodejs/` 下保持内聚
- 目录以 `claude-agent-sdk/` 命名清晰标识用途
- 未来如有其他 Node.js AI SDK 支持，可在 `variants/nodejs/` 下平行扩展

**备选方案考虑：**
- 放在 `packages/reef/ai-frameworks/claude-agent-sdk/` → 否决。过于通用，且 Claude Agent SDK 短期内只有 Node.js 实现，过度抽象无益

### Decision 3: Wizard 二维模型配置

**方案：** 在 `wizard.json` 的 `backend.language` 问题中新增 `nodejs` 选项，并定义条件性问题组：

```jsonc
{
  "id": "reef.backend.language",
  "options": ["java", "python", "nodejs"]  // 新增 nodejs
}
```

新增 `reef.backend.nodejs.details` 组，包含：
- `reef.backend.nodejs.framework` — NestJS（默认选中）/ none
- `reef.backend.nodejs.orm` — Prisma / none
- `reef.backend.nodejs.aiIntegration` — Claude Agent SDK / none
- `reef.backend.nodejs.formatTool` — ESLint + Prettier（静态）
- `reef.backend.nodejs.test` — Jest / none

**AI 框架过滤规则：** 每个语言组声明可用 AI 框架列表；如果列表为空，AI 集成选项不显示。

```jsonc
// 在 language 层面声明 AI 框架可用性
{
  "language": "nodejs",
  "availableAiFrameworks": ["claude-agent-sdk"]
}
// Java: ["spring-ai"]
// Python: []  → 不显示 AI 集成选项
```

**理由：**
- 与现有 Java/Python 的问题分组模式一致
- AI 框架可用性声明在语言层面，而非在每个子问题中耦合
- `none` 选项确保用户可以不选择任何框架，满足"独立配置项"需求

**备选方案考虑：**
- 将 AI 框架作为全局独立问题 → 否决。AI 框架与语言耦合（Claude Agent SDK 仅 Node.js，Spring AI 仅 Java），放在语言内部更自然

### Decision 4: 脚手架模板组合策略

**方案：** 使用模板组合（组合式模板）而非条件式渲染

Prisma 和 Claude Agent SDK 的脚手架代码作为独立模板片段，在项目初始化时根据用户选择进行组合：

```
templates/
├── _shared/                    # 所有组合共用的基础文件
│   ├── package.json.tmpl
│   ├── tsconfig.json.tmpl
│   ├── nest-cli.json.tmpl
│   ├── src/main.ts.tmpl
│   └── src/app.module.ts.tmpl
├── features/
│   ├── prisma/                 # Prisma 特有的文件
│   │   ├── prisma/schema.prisma.tmpl
│   │   ├── src/prisma/prisma.service.ts.tmpl
│   │   └── src/prisma/prisma.module.ts.tmpl
│   └── agent-sdk/              # Claude Agent SDK 特有的文件
│       ├── src/agent/agent.service.ts.tmpl
│       ├── src/agent/agent.module.ts.tmpl
│       └── src/agent/tools/example.tool.ts.tmpl
└── generators/                 # 问答题模板文件
    └── questions.json
```

**理由：**
- 纯条件式渲染会导致 4 种组合 × 每个文件 = 大量冗余
- 组合式模板使每个 feature 独立维护，新增/移除 feature 不影响其他
- 与现有 Java/Python 的 `.tmpl` 渲染器兼容——渲染器只需跳过缺失的 feature 目录

**备选方案考虑：**
- 每个组合存储完整项目模板 → 否决。4 种组合需要 4 套完整文件，维护成本高

### Decision 5: Skill 组织

NestJS 开发 skill 新建在 `skills/reef-style-backend/variants/nodejs/` 中，与 Java/Python 平行。Skill 内容覆盖：

| Skill | 位置 | 内容 |
|-------|------|------|
| 后端代码生成 | `skills/reef-gen-backend/variants/nodejs/steps.md` | NestJS Controller/Service/Module/DTO 的生成步骤 |
| 后端代码规范 | `skills/reef-style-backend/variants/nodejs/quick-reference.md` | 命名规范、分层约定、依赖注入模式 |
| 后端规范示例 | `skills/reef-style-backend/variants/nodejs/examples/*.md` | NestJS 最佳实践示例 |
| JSON 规则 | `skills/reef-style-backend/fragments/nodejs/` | ESLint 规则、Prettier 规则、NestJS 结构规则 |
| 审查 Agent | `agents/variants/nodejs/reef-review-backend.md` | Node.js 代码审查规则和模式 |

Claude Agent SDK 的 skill 放在 `variants/nodejs/claude-agent-sdk/skills/` 下，内容覆盖 Agent Tool 定义模式、MCP 集成、Agent 编排模式。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| NestJS 版本迭代快，模板版本与最新版本可能脱节 | 用户项目初始化后需要手动升级 NestJS | 模板中使用 NestJS CLI 生成器模式，减少硬编码版本依赖 |
| Claude Agent SDK 为新兴库，API 可能不稳定 | 模板可能随 SDK 更新过时 | SDK 集成代码做最小侵入，以独立 wrapper 形式封装，便于替换 |
| Prisma 和 Claude Agent SDK 组合使用时可能出现兼容性问题 | 项目初始化后需要调试配置 | 模板中提供已验证的兼容版本组合；在 playground 中做 E2E 验证 |
| ESLint/Prettier 规则与用户已有配置冲突 | 代码格式化行为不一致 | 规则作为 fragment 引入，非强制覆盖；用户可通过 wizard 选择是否使用 |

## Open Questions

- Claude Agent SDK 的 Node.js 版本是否需要 `@anthropic-ai/sdk` 还是 `anthropic-agent-sdk`？需在实现阶段确认 Anthropic 最新发布
- NestJS 项目中的 Prisma Module 应该使用 `PrismaModule.forRoot()` 的模块模式还是作为 `Global` 模块？需在 code-gen skill 中决策
- Wizard 中是否需要在 Node.js 选项旁注明版本提示（NestJS v10/v11）？
