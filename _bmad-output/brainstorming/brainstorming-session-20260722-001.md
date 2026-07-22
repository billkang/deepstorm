# Brainstorming Session — reef Node.js 变体（NestJS + Prisma + Claude Agent SDK）

- **日期：** 2026-07-22
- **会话序：** 001
- **触发方式：** 自然口述需求 → deepstorm-discuss

---

## 讨论总结

### 需求背景

DeepStorm 的 reef 套件目前支持 **Java（Spring Boot）** 和 **Python（FastAPI）** 两个后端变体。需要新增 **Node.js** 语言支持，覆盖：

- **MVC 框架：** NestJS
- **ORM 框架：** Prisma
- **AI 集成：** Claude Agent SDK（类似 Java 的 Spring AI）

### 核心架构

reef 变体是一个**二维模型**：语言 × AI 集成

```
                       无 AI 集成      有 AI 集成
Java (Spring Boot)       ✓              Spring AI（已有）
Python (FastAPI)         ✓              无可用框架 → 不显示
Node.js (NestJS+Prisma)  ✓              Claude Agent SDK（新建）
```

- **维度一（语言变体）：** Java / Python / **Node.js (NestJS + Prisma)**
- **维度二（AI 集成）：** 可选增强层，每个语言独立注册，没有可用框架则不显示

### 三个独立关注点

| 单元 | 性质 | 说明 |
|------|------|------|
| **NestJS** | MVC 框架 | Node.js 的 Web 框架变体 |
| **Prisma** | ORM 框架 | 独立的 ORM 层，不与 NestJS 耦合 |
| **Claude Agent SDK** | AI 集成 | 独立于 NestJS 和 Prisma，目前仅 Node.js 可用 |

用户选择时三者是**独立配置项**：一个 NestJS 项目可以选择用 Prisma 或不用，可以选择用 Claude Agent SDK 或不用。

### 产出物要求

本次变更需覆盖三大类产出：

| 类别 | 内容 |
|------|------|
| 📦 **项目脚手架模板** | `nest new` + Prisma 初始化 + Claude Agent SDK 预配置的模板代码 |
| 📐 **代码规范** | ESLint/Prettier 配置、NestJS 模块结构规范、Prisma Schema 设计模式、Claude Agent 架构规范 |
| 📖 **开发技能 (Skills)** | 针对 NestJS 模块开发、Prisma 操作、Claude Agent 开发的 skill 引导 |

### 影响范围

| 模块 | 影响 |
|------|------|
| `packages/reef/variants/nodejs/` | **新建** — 整个 nodejs 变体目录 |
| `packages/reef/` 构建脚本 | 需要将 nodejs 变体纳入编译聚合 |
| `packages/cli/src/commands/setup/` | 需要更新 wizard 流程，增加 Node.js 选项和 AI 集成选项 |
| `packages/cli/src/commands/update/` | 需要同步更新 |
| `packages/cli/wizard.json` | 需要注册新的语言变体及其 AI 框架映射 |

### 排除范围

- 不涉及 tide/sweep/atoll/pilot 对 Node.js 的支持（本次仅 reef 套件）
- 不涉及 Python 的 AI 框架支持（Python 无可用 AI 集成框架）
- 不涉及 Java 的变体改动（仅新增 Node.js 变体）

### 关键词

`reef` `nodejs` `nestjs` `prisma` `claude-agent-sdk` `wireit` `code-style` `skills`
