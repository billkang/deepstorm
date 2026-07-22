# Proposal: reef Node.js 变体支持

## Why

DeepStorm 的 reef 套件当前支持 Java（Spring Boot）和 Python（FastAPI）两个后端变体，缺少对 Node.js 生态系统的支持。Node.js 是当前最广泛使用的后端运行时之一，NestJS + Prisma 的组合在企业级应用开发中具有显著地位。同时，结合 Claude Agent SDK 的 AI 集成能力（类似 Java 生态中的 Spring AI），可以为 Node.js 开发者提供从项目初始化到 AI 增强的全链路开发体验。

## What Changes

### 新增
- **Node.js 变体目录**：`packages/reef/variants/nodejs/`，包含 NestJS 项目模板、Prisma 配置、Claude Agent SDK 集成
- **Node.js 后端技能**：在 `packages/reef/skills/` 下新增 Node.js 变体的 skill（代码生成、代码规范、代码审查）
- **Node.js 后端 agent**：在 `packages/reef/agents/variants/nodejs/` 下新增代码审查 agent
- **Claude Agent SDK 集成层**：在 `packages/reef/variants/nodejs/claude-agent-sdk/` 下提供 AI 框架集成模板和规范
- **CLI wizard Node.js 选项**：`packages/reef/wizard.json` 新增 Node.js 语言选项及其子问题（NestJS/Prisma/Claude Agent SDK）

### 修改
- `packages/reef/` 构建脚本：将 nodejs 变体纳入编译聚合流程
- `packages/cli/src/commands/setup.ts`：支持 Node.js 语言变体的安装配置
- `packages/cli/src/commands/init.ts`：支持 Node.js 项目的初始化生成

## Capabilities

### New Capabilities
- `nodejs-backend-standards`: NestJS + Prisma 的后端开发规范，涵盖项目结构、命名约定、分层架构、ESLint/Prettier 配置
- `nodejs-code-gen`: NestJS 后端代码生成能力，支持 Controller/Service/Module/DTO/Prisma Service 的按需生成
- `nodejs-code-review`: Node.js 后端代码审查 agent，针对 NestJS 和 Prisma 代码的审查规则
- `nodejs-project-templates`: NestJS + Prisma + Claude Agent SDK 的项目脚手架模板，支持选项式初始化（是否启用 Prisma、是否启用 Claude Agent SDK）
- `claude-agent-sdk-integration`: Claude Agent SDK 的集成模板与开发规范，涵盖 Agent 初始化、Tool 定义、MCP Server 配置

### Modified Capabilities
- `gen-backend-dynamic`: 增加 Node.js（NestJS）作为支持的后端目标语言，影响代码生成的变体路由逻辑
- `setup-wizard`: CLI 安装向导增加 Node.js 语言选择及其子选项（NestJS、Prisma、Claude Agent SDK），应用"无可用 AI 框架则不显示"的过滤规则
- `wizard-option-filtering`: 二维模型（语言 × AI 集成）的过滤规则需扩展，当 Node.js 配合 Claude Agent SDK 时需正确处理依赖关系

## Impact

| 模块 | 影响说明 |
|------|---------|
| `packages/reef/variants/nodejs/` | **新建** — Node.js 变体根目录，含 templates/code-style/skills 子结构 |
| `packages/reef/skills/reef-gen-backend/variants/nodejs/` | **新建** — 后端代码生成的 Node.js 变体 |
| `packages/reef/skills/reef-style-backend/variants/nodejs/` | **新建** — 后端代码规范的 Node.js 变体 |
| `packages/reef/skills/reef-style-backend/fragments/nodejs/` | **新建** — 后端规范片段的 Node.js 片段 |
| `packages/reef/agents/variants/nodejs/` | **新建** — 后端代码审查 agent 的 Node.js 变体 |
| `packages/reef/wizard.json` | **修改** — 增加 nodejs 语言组和相关子问题 |
| `packages/reef/` 构建脚本 | **修改** — 纳入 nodejs 变体编译 |
| `packages/cli/src/commands/setup.ts` | **修改** — Node.js 安装流程 |
| `packages/cli/src/commands/init.ts` | **修改** — Node.js 项目初始化 |
