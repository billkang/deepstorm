## ADDED Requirements

### Requirement: 基础 NestJS 项目模板
CLI init 命令 SHALL 支持生成 NestJS 项目脚手架，包含标准的 NestJS CLI 结构。

#### Scenario: 生成基础 NestJS 项目
- **WHEN** 用户在 setup 中选择 Node.js 后端且未选择额外框架
- **THEN** 生成的 SHALL 包含基础的 `nest new` 项目结构：`src/app.module.ts`、`src/app.controller.ts`、`src/app.service.ts`
- **THEN** 生成的 `package.json` SHALL 包含 `@nestjs/core`、`@nestjs/common`、`@nestjs/platform-express` 依赖
- **THEN** 生成的 `tsconfig.json` SHALL 启用 `strict` 模式和装饰器支持（`experimentalDecorators`、`emitDecoratorMetadata`）
- **THEN** 生成的 `nest-cli.json` SHALL 配置正确的 `sourceRoot`

### Requirement: NestJS + Prisma 模板组合
当用户同时选择 NestJS 和 Prisma 时，脚手架 SHALL 包含 Prisma 集成层。

#### Scenario: 生成带 Prisma 的 NestJS 项目
- **WHEN** 用户在 setup 中启用了 Prisma
- **THEN** 生成的 `prisma/schema.prisma` SHALL 包含基础 Provider 配置和数据源
- **THEN** 生成的 SHALL 包含 `PrismaModule` 和 `PrismaService`（全局模块模式）
- **THEN** 生成的 `package.json` SHALL 包含 `@prisma/client` 和 `prisma` 依赖
- **THEN** 生成的 `package.json` SHALL 包含 `"prisma:generate": "prisma generate"` 和 `"prisma:push": "prisma db push"` 脚本
- **THEN** 生成的 `.env` SHALL 包含 `DATABASE_URL` 占位变量

#### Scenario: Prisma 未启用时不生成 Prisma 文件
- **WHEN** 用户选择 NestJS 但未启用 Prisma
- **THEN** 生成的脚手架 SHALL 不包含 `prisma/` 目录和任何 Prisma 相关代码
- **THEN** 生成的 `package.json` SHALL 不包含 `@prisma/client` 依赖

### Requirement: NestJS + Claude Agent SDK 模板组合
当用户同时选择 NestJS 和 Claude Agent SDK 时，脚手架 SHALL 包含 Agent 集成层。

#### Scenario: 生成带 Claude Agent SDK 的 NestJS 项目
- **WHEN** 用户在 setup 中启用了 Claude Agent SDK
- **THEN** 生成的 SHALL 包含 `AgentModule` 和 `AgentService` 模块
- **THEN** 生成的 SHALL 包含示例 Tool 定义（`src/agent/tools/example.tool.ts`）
- **THEN** 生成的 `.env` SHALL 包含 `ANTHROPIC_API_KEY` 占位变量
- **THEN** 生成的 SHALL 包含 `MCP` 相关的 `@anthropic-ai/sdk` 依赖

### Requirement: 全功能组合模板
当用户同时选择 NestJS + Prisma + Claude Agent SDK 时，脚手架 SHALL 生成包含所有集成的完整项目。

#### Scenario: 生成完整组合项目
- **WHEN** 用户同时启用了 NestJS、Prisma 和 Claude Agent SDK
- **THEN** `PrismaModule` SHALL 已导入并在全局可用
- **THEN** `AgentModule` SHALL 可以注入 `PrismaService` 用于 Agent Tool 的数据访问
- **THEN** 示例 Tool SHALL 演示如何通过 PrismaService 查询数据
- **THEN** 生成的 `src/app.module.ts` SHALL 导入 PrismaModule 和 AgentModule

### Requirement: 模板组合策略
脚手架模板 SHALL 使用组合式模板策略：共享文件为基础 + feature 目录按需加入。

#### Scenario: 模板组合规则
- **WHEN** 确认用户选择后生成项目
- **THEN** `_shared/` 目录中的文件 SHALL 始终被复制
- **THEN** `features/prisma/` 目录 SHALL 仅在启用了 Prisma 时被复制
- **THEN** `features/agent-sdk/` 目录 SHALL 仅在启用了 Claude Agent SDK 时被复制
- **THEN** 各 feature 的 `package.json.tmpl` 依赖 SHALL 合并到主 `package.json`
