## Why

当前 reef Node.js (NestJS) 变体的脚手架生成结构没有跟上业界最佳实践：NestJS 文件直接放在项目根目录，前端 Angular 的 `sourcePath` 沿用 Java/Spring Boot 的 Maven 约定（`src/main/web/`），缺乏 monorepo 支持。这导致开发者在搭建全栈项目时需要手动整理目录结构，且没有统一包管理方案。

## What Changes

- **整个 NestJS 脚手架由单项目结构改为 monorepo 结构**：后端代码移入 `server/` 子目录，通过 pnpm workspace 统一管理
- **新增 `server/src/common/` 骨架目录**：包含 guards、interceptors、filters、pipes、decorators 五个子目录，提供开箱即用的标准 NestJS 工程骨架
- **新增 `server/src/config/` 骨架目录**：提供 `app.config.ts` 配置模块骨架
- **新增根级 workspace 配置模板**：根目录 `package.json`（workspace root）、`pnpm-workspace.yaml`
- **前端 Angular 路径规范化**：`sourcePath` 从 `src/main/web/` 改为 `client/`
- **feature 模板路径同步更新**：Prisma 和 Agent SDK feature 模板路径从 `src/` 改为 `server/src/`
- **代理/review 文件路径调整**：相关 agent、skill 文件中引用路径同步更新
- **CLI 消费命令同步**：`packages/cli/src/commands/` 下对应的 setup/update 命令同步更新

## Capabilities

### New Capabilities
- `nestjs-monorepo-scaffold`: NestJS 脚手架从单项目结构升级为 `server/` + `client/` 的 monorepo 结构，新增 common/config 骨架目录，支持 pnpm workspace 统一包管理

### Modified Capabilities
- （无已有 spec 被修改）

## Impact

- `packages/reef/variants/nodejs/templates/_shared/` — 所有 NestJS 模板文件移入 `server/` 子目录，新增 common + config 骨架模板
- `packages/reef/variants/nodejs/templates/features/prisma/` — prisma schema/service 路径从 `src/` → `server/src/`
- `packages/reef/variants/nodejs/templates/features/agent-sdk/` — agent 文件路径从 `src/` → `server/src/`
- `packages/reef/wizard.json` — sourcePath 字段更新
- `packages/reef/skills/reef-gen-backend/variants/nodejs/steps.md` — 构建命令路径更新
- `packages/reef/variants/nodejs/claude-agent-sdk/skills/SKILL.md.tmpl` — 路径引用更新
- `packages/cli/src/commands/` — setup/update 等消费命令需同步
