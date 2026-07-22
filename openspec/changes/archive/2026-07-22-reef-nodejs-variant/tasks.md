# Tasks: reef Node.js 变体支持

## 1. Node.js 变体基础结构

- [x] 1.1 在 `packages/reef/skills/reef-style-backend/variants/nodejs/` 下创建 `quick-reference.md`，包含 NestJS 项目结构、命名规范、依赖注入模式
- [x] 1.2 在 `packages/reef/skills/reef-style-backend/variants/nodejs/examples/` 下创建 NestJS 最佳实践示例文件（Module/Controller/Service/Prisma 示例各一个）
- [x] 1.3 在 `packages/reef/skills/reef-style-backend/fragments/nodejs/` 下创建 ESLint 规则、Prettier 规则、NestJS 结构规则的 fragment 文件
- [x] 1.4 在 `packages/reef/agents/variants/nodejs/` 下创建 `reef-review-backend.md`，包含 NestJS 架构审查、Prisma 查询审查、TypeScript 代码审查规则
- [x] 1.5 在 `packages/reef/skills/reef-gen-backend/variants/nodejs/` 下创建 `steps.md`，定义 NestJS 编码顺序（Prisma Schema → DTO → Entity → Service → Controller → Module）

## 2. Wizard 配置

- [x] 2.1 在 `packages/reef/wizard.json` 的 `reef.backend.language` 选项中新增 `nodejs` 选项
- [x] 2.2 在 `packages/reef/wizard.json` 中新增 `reef.backend.nodejs.details` 问题组，包含 framework（NestJS/none）、orm（Prisma/none）、aiIntegration（Claude Agent SDK/none）、test（Jest/none）子问题
- [x] 2.3 在 `packages/reef/wizard.json` 中为每个语言变体声明 `availableAiFrameworks` 数组（Java: `["spring-ai"]`、Python: `[]`、Node.js: `["claude-agent-sdk"]`）
- [x] 2.4 更新 CLI setup 渲染逻辑，使 AI 集成选项按语言可用性动态过滤

## 3. NestJS 项目脚手架模板

- [x] 3.1 在 `packages/reef/variants/nodejs/` 下创建基础目录结构（templates/_shared/、templates/features/prisma/、templates/features/agent-sdk/）
- [x] 3.2 创建 `_shared/` 目录中的共享模板文件：`package.json.tmpl`、`tsconfig.json.tmpl`、`nest-cli.json.tmpl`、`src/main.ts.tmpl`、`src/app.module.ts.tmpl`、`src/app.controller.ts.tmpl`、`src/app.service.ts.tmpl`
- [x] 3.3 创建 `features/prisma/` 目录中的 Prisma 特有模板文件：`prisma/schema.prisma.tmpl`、`src/prisma/prisma.service.ts.tmpl`、`src/prisma/prisma.module.ts.tmpl`
- [x] 3.4 创建 `features/agent-sdk/` 目录中的 Claude Agent SDK 特有模板文件：`src/agent/agent.service.ts.tmpl`、`src/agent/agent.module.ts.tmpl`、`src/agent/tools/example.tool.ts.tmpl`
- [x] 3.5 实现模板组合渲染逻辑：根据用户选择组合 `_shared/` + 对应 `features/` 目录，合并 package.json 依赖

## 4. Claude Agent SDK 集成

- [x] 4.1 在 `packages/reef/variants/nodejs/claude-agent-sdk/skills/` 下创建 `SKILL.md.tmpl`，包含 Agent 初始化、Tool 定义、MCP Server 集成文档
- [x] 4.2 在 `packages/reef/variants/nodejs/claude-agent-sdk/templates/` 下创建 Agent SDK 初始化代码模板

## 5. 构建与 CLI 集成

- [x] 5.1 更新 `packages/reef/` 构建脚本，将 nodejs 变体（templates、skills、agents）纳入编译聚合流程
- [x] 5.2 更新 `packages/cli/src/commands/setup.ts`，支持 Node.js 后端语言的安装配置和模板渲染
- [x] 5.3 更新 `packages/cli/src/commands/init.ts`，支持 NestJS + Prisma + Claude Agent SDK 项目初始化
- [x] 5.4 在 playground 中验证 Node.js 选项的 E2E 安装流程

## 6. 验证与文档

- [x] 6.1 运行 `pnpm build` 确认 nodejs 变体正确聚合并无构建错误
- [x] 6.2 运行 `pnpm playground:verify` 确认 E2E 流程无误
- [x] 6.3 更新 `packages/reef/README.md` 和 `CHANGELOG.md`
