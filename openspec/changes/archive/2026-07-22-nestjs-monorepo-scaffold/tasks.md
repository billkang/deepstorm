## 1. 重构 NestJS 模板目录结构

- [x] 1.1 将 `_shared/` 下的所有 `.tmpl` 文件移入 `server/` 子目录
  - `nest-cli.json.tmpl` → `server/nest-cli.json.tmpl`
  - `tsconfig.json.tmpl` → `server/tsconfig.json.tmpl`
  - `package.json.tmpl` → `server/package.json.tmpl`
  - `README.md.tmpl` → `server/README.md.tmpl`
  - `src/main.ts.tmpl` → `server/src/main.ts.tmpl`
  - `src/app.module.ts.tmpl` → `server/src/app.module.ts.tmpl`
  - `src/app.controller.ts.tmpl` → `server/src/app.controller.ts.tmpl`
  - `src/app.service.ts.tmpl` → `server/src/app.service.ts.tmpl`
- [x] 1.2 新增根级 workspace 模板
  - 创建 `package.json.tmpl`（root workspace，声明 `private: true`，`scripts.dev` 启动所有 workspace app）
  - 创建 `pnpm-workspace.yaml.tmpl`（声明 `packages: ['server', 'client']`）
  - 创建 `.gitignore.tmpl`

## 2. 新增 common + config 骨架模板

- [x] 2.1 创建 `server/src/common/` 骨架目录模板
  - `server/src/common/guards/.gitkeep`
  - `server/src/common/interceptors/.gitkeep`
  - `server/src/common/filters/.gitkeep`
  - `server/src/common/pipes/.gitkeep`
  - `server/src/common/decorators/.gitkeep`
- [x] 2.2 创建 `server/src/config/app.config.ts.tmpl`
  - 提供 `ConfigModule.forRoot()` 使用骨架

## 3. 更新 feature 模板路径

- [x] 3.1 更新 Prisma feature 模板路径
  - `features/prisma/prisma/schema.prisma.tmpl` → `features/prisma/server/prisma/schema.prisma.tmpl`
  - `features/prisma/src/prisma/prisma.module.ts.tmpl` → `features/prisma/server/src/prisma/prisma.module.ts.tmpl`
  - `features/prisma/src/prisma/prisma.service.ts.tmpl` → `features/prisma/server/src/prisma/prisma.service.ts.tmpl`
- [x] 3.2 更新 Agent SDK feature 模板路径
  - `features/agent-sdk/src/agent/agent.module.ts.tmpl` → `features/agent-sdk/server/src/agent/agent.module.ts.tmpl`
  - `features/agent-sdk/src/agent/agent.service.ts.tmpl` → `features/agent-sdk/server/src/agent/agent.service.ts.tmpl`
  - `features/agent-sdk/src/agent/tools/example.tool.ts.tmpl` → `features/agent-sdk/server/src/agent/tools/example.tool.ts.tmpl`
- [x] 3.3 更新 `claude-agent-sdk/skills/SKILL.md.tmpl` 中的路径引用（无需修改 — 所有路径均为相对路径示例）

## 4. 更新 README.md 和其他引用文件

- [x] 4.1 更新 `server/README.md.tmpl` 中的项目结构说明，反映 monorepo 结构
- [x] 4.2 更新 `reef-gen-backend/variants/nodejs/steps.md` 中的构建命令路径
- [x] 4.3 更新 `reef-style-backend/variants/nodejs/quick-reference.md` 目录结构
- [x] 4.4 更新 `agents/variants/nodejs/reef-review-backend.md` 路径引用

## 5. 更新 wizard.json

- [x] 5.1 Angular `sourcePath` 从 `src/main/web/` 改为 `client/src/`
- [x] 5.2 Node.js `sourcePath` 从 `src/ test/` 改为 `server/src/ server/test/`
- [x] 5.3 验证所有 `affectedTemplates` 路径在新结构下仍正确（所有 affectedTemplates 引用的是 skill/agent 模板，不受 scaffold 路径变更影响）

## 6. 同步 CLI 消费命令

- [x] 6.1 检查 CLI setup 命令（无需修改 — 不直接引用 nodejs scaffold 模板路径）
- [x] 6.2 检查 CLI update 命令（无需修改 — 不直接引用 nodejs scaffold 模板路径）

## 7. 验证

- [x] 7.1 验证模板文件结构（已确认所有文件路径和内容正确）
  - 根模板：`package.json`、`pnpm-workspace.yaml`、`.gitignore`
  - 后端模板：`server/` 下含 6 个 .tmpl 文件 + 10 个骨架占位文件
  - Feature 模板：Prisma、Agent SDK 路径已统一为 `server/` 下
  - Wizard：Angular sourcePath 更新、Node.js sourcePath 更新
  - Agent：review agent 路径引用已更新
  - Quick Reference：目录结构已更新
  - 确认 `server/` 下包含所有 NestJS 文件
  - 确认 `server/src/common/` 和 `server/src/config/` 骨架存在
  - 确认根目录有 `package.json` 和 `pnpm-workspace.yaml`
  - 确认 Prisma/Agent SDK feature 路径正确
