# Brainstorming Session — NestJS 脚手架 monorepo 优化

- **日期**: 2026-07-22
- **参与者**: billkang
- **语境**: 优化 reef Node.js (NestJS) 变体的脚手架目录结构

---

## 讨论纪要

### 问题

1. NestJS 脚手架目前是单项目结构（`src/` 在根），没有 monorepo 支持
2. 前端 Angular 的 sourcePath 是 `src/main/web/`，是 Java/Spring Boot 的 Maven 遗留约定，在纯 Node.js 项目中没有意义
3. 前后端没有统一的 workspace 管理

### 讨论出的方案

#### 项目结构

```
project-root/
├── server/                          # NestJS 后端
│   ├── src/
│   │   ├── main.ts                  # 入口
│   │   ├── app.module.ts            # 根模块
│   │   ├── app.controller.ts        # 健康检查
│   │   ├── app.service.ts
│   │   ├── common/                  # 共享骨架
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── filters/
│   │   │   ├── pipes/
│   │   │   └── decorators/
│   │   ├── config/                  # 配置模块
│   │   │   └── app.config.ts
│   │   └── modules/                 # 业务模块
│   ├── test/
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── package.json
├── client/                          # 前端（由 `ng new client` 生成）
├── package.json                     # 根 workspace
├── pnpm-workspace.yaml
├── .gitignore
└── README.md
```

#### 关键决策

| 决策 | 理由 |
|------|------|
| 后端命名 `server/` | 与 `client/` 对应，业内 monorepo 最佳实践 |
| 前端命名 `client/` | 用户指定 |
| 前端通过 `ng new client` 生成 | 不走模板，利用 Angular CLI 原生能力 |
| 根目录 pnpm workspace | 统一包管理，`pnpm dev` 可同时启动前后端 |
| 新增 `common/` + `config/` 骨架 | 业内推荐 NestJS 目录模式，开箱即用 |
| `common/` 保留空 guard/interceptor/filter/pipe/decorator 骨架 | 不写具体实现代码，只做目录占位 |

#### 变更范围

| # | 文件 | 变更 |
|---|------|------|
| 1 | `variants/nodejs/templates/_shared/` | 整体移入 `server/` 子目录 |
| 2 | 同上 — 新增 | `server/src/common/` 骨架目录 |
| 3 | 同上 — 新增 | `server/src/config/app.config.ts.tmpl` |
| 4 | 新增根模板 | `package.json.tmpl`（root workspace）、`pnpm-workspace.yaml.tmpl`、`.gitignore.tmpl` |
| 5 | `variants/nodejs/templates/features/prisma/` | `src/` → `server/src/` |
| 6 | `variants/nodejs/templates/features/agent-sdk/` | `src/` → `server/src/` |
| 7 | `wizard.json` | Angular sourcePath 更新；Node.js sourcePath 更新 |
| 8 | `reef-gen-backend/variants/nodejs/steps.md` | 构建命令路径 |
| 9 | `README.md.tmpl` | 项目结构说明更新 |
| 10 | CLI 同步 | `packages/cli/src/commands/` |

---

## 决定

1. 先产出 brainstorming 文件
2. 按 OpenSpec 流程走：`/opsx:new` → proposal → specs → design → tasks → apply
