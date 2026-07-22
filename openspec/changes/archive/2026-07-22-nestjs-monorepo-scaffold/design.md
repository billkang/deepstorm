## Context

当前 reef Node.js (NestJS) 脚手架生成的是一个**单项目结构**：`src/`、`package.json`、`nest-cli.json` 都在项目根目录。前端 Angular 的 `sourcePath` 是 `src/main/web/`，继承自 Java/Spring Boot 的 Maven 约定（`src/main/java`、`src/main/webapp`），在纯 Node.js/NestJS 项目中没有语义意义。

脚手架模板位于 `packages/reef/variants/nodejs/templates/_shared/`，features 位于 `templates/features/`。模板通过 Handlebars 渲染引擎处理，支持条件变量（如 `{{#if hasPrisma}}`）。

## Goals / Non-Goals

**Goals:**

1. 将 NestJS 脚手架改为 `server/` + `client/` 的 monorepo 结构，与业内最佳实践对齐
2. 新增 `server/src/common/` 骨架（guards、interceptors、filters、pipes、decorators）
3. 新增 `server/src/config/` 骨架（`app.config.ts`）
4. 根目录提供 pnpm workspace 配置（`package.json` + `pnpm-workspace.yaml`）
5. 前端 Angular 路径规范化：`sourcePath` 改为 `client/`
6. 所有相关 skill、agent、wizard、CLI 文件同步更新

**Non-Goals:**

- 不修改 NestJS 业务代码编写流程（`steps.md` 的内容逻辑不变）
- 不修改 Java/Python 变体的脚手架结构
- 不修改前端脚手架生成方式（client 仍由 `ng new client` 手动生成）
- 不修改 reef-style-backend 规范文档的内容
- 不涉及 CORS、代理等开发时配置的自动生成（交给开发者自行配置）

## Decisions

### 1. 后端目录命名 `server/` 而非 `backend/`

- **选择**: `server/`
- **理由**: 与前端 `client/` 形成 `client-server` 的对称命名，是 monorepo 中最常用的约定（参见 NestJS 官方示例、TurboRepo 模板、NX 生成的项目）
- **备选**: `backend/` — 更通用但缺少与 `client/` 的对称性；`api/` — 暗示只有 API 层

### 2. client 不放在模板中，由 Angular CLI 生成

- **选择**: 脚手架只生成 `server/` 和根 workspace，`client/` 由开发者运行 `ng new client` 创建
- **理由**: Angular CLI 有自己的项目初始化和版本管理逻辑，在模板中模拟 `angular.json` 等文件不可维护；开发者习惯 `ng new` 的交互流程
- **备选**: 手写 `client/` 模板 → 会偏离 Angular CLI 最新结构，且每个 Angular 版本需手动同步

### 3. common/ 骨架只做目录占位，不写具体实现代码

- **选择**: 每个子目录下放一个占位文件（如 `guards/.gitkeep` 或简要注释的骨架），不生成 JWT guard、logging interceptor 等的完整实现
- **理由**: 业务细节应该由开发者根据项目需求自定义，脚手架强行预置会生成与需求不匹配的代码；但目录结构本身就是一种约定引导
- **备选**: 生成完整实现 → 过度预置，开发者可能都要删掉重写，反而增加工作量

### 4. feature 模板（Prisma / Agent SDK）路径统一移入 `server/`

- **选择**: feature 模板中所有 `src/` 路径前缀改为 `server/src/`，`prisma/` 改为 `server/prisma/`
- **理由**: 保持 monorepo 结构一致性，所有后端代码在 `server/` 下

### 5. 根 workspace 使用 pnpm

- **选择**: `pnpm-workspace.yaml` 声明 `packages: ['server', 'client']`
- **理由**: reef 前端技术栈（Angular/React/Vue）已统一使用 pnpm；NestJS 模板本身也使用 pnpm

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| [破坏性变更] 现有使用该脚手架的存量项目模板路径失效 | 这是对新生成项目的影响，不是运行时 break change。存量项目不受影响。升级 CLI 版本时在 changelog 中标注 breaking change |
| [路径不一致] 部分模板文件可能漏改路径 | 所有 affected templates 已整理到本变更的 tasks 清单中，逐一验证 |
| [Angular CLI 版本兼容] `ng new client` 生成的结构与预期有偏差 | 不对 Angular 生成内容做假设，任何定制应通过 Angular schematics 完成 |
| [模板渲染兼容性] `.tmpl` 文件多级嵌套后路径过长 | Handlebars 渲染只关心输出路径，输入路径嵌套不影响渲染 |

## Migration Plan

这个变更是对新生成项目的结构优化，不涉及数据迁移或运行时迁移：

1. 更新 `variants/nodejs/templates/` 下的所有 `.tmpl` 文件
2. 更新 `wizard.json` 中的 sourcePath 引用
3. 更新 skill/agent 文件中的路径引用
4. 更新 CLI 消费命令中的路径引用
5. 在 playground 中验证新生成的项目结构
6. 发布时在 changelog 中标注 breaking change

## Open Questions

（无未解决的开放问题 — 设计方案已在 brainstorming 中充分讨论）
