---
name: deepstorm-playground
description: DeepStorm Playground 管理 — 环境初始化、开发服务器、E2E 测试、环境重置。封装 playground/ 下所有命令。用户说「启动 playground」「初始化 playground」「运行 e2e」「playground 状态」「setup playground」时激活。
---

# DeepStorm Playground 管理

Playground 位于 `playground/`，是各套件的演示和集成测试环境。

## 命令速查

| 命令 | 用途 |
|------|------|
| `pnpm playground:setup` | 一键全量初始化 |
| `pnpm build` | 构建 CLI (esbuild + registry) |
| `pnpm build:plugin` | 构建 CLI + 插件 |
| `pnpm test` | 全量测试 |
| `pnpm cli` | 运行 CLI |
| `cd playground && pnpm dev` | 启动开发服务器 (端口 3000) |
| `cd playground && pnpm setup:all` | 全量初始化 |
| `cd playground && pnpm setup:tide` | 仅安装 Tide 套件 |
| `cd playground && pnpm setup:reef` | 仅安装 Reef 套件 |
| `cd playground && pnpm setup:sweep` | 仅安装 Sweep 套件 |
| `cd playground && pnpm setup:atoll` | 仅安装 Atoll 套件 |
| `cd playground && pnpm e2e:install` | 安装 E2E 依赖 |
| `cd playground && pnpm e2e:test` | 运行 E2E 测试 |
| `cd playground && pnpm e2e:report` | 查看 E2E 报告 |

## 工作流

### 初始化
```bash
pnpm playground:setup
```
等价于：构建 CLI → 安装各套件 → 生成 .env.example → 安装 app 依赖

### 启动 App
```bash
cd playground
pnpm dev  # http://localhost:3000
```

### 按需安装单个套件
```bash
cd playground && pnpm setup:tide    # 仅安装 Tide
cd playground && pnpm setup:reef    # 仅安装 Reef
```

### E2E 测试
```bash
cd playground
pnpm e2e:install
pnpm e2e:test
pnpm e2e:report
```

### 环境重置（从零开始）
```bash
cd playground
rm -rf .claude .env .mcp.json node_modules tide-data .env.example
rm -rf e2e/.env e2e/.mcp.json e2e/.sweep-init e2e/node_modules
pnpm setup:all
```

## 目录结构
```
playground/
├── .claude/          # 套件安装后的 Claude 配置
├── app/              # 被测应用（Node.js + Express）
├── e2e/              # Playwright E2E 测试
├── guides/           # 使用指南
├── scripts/
│   ├── _common.sh    # 公共函数
│   ├── setup-all.sh  # 全量初始化
│   ├── setup-*.sh    # 各套件独立安装
│   └── start-dev.sh  # 开发服务器启动
├── .env / .env.example / .mcp.json
└── tide-data/
```
