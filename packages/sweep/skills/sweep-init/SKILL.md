---
name: sweep-init
description: 初始化 E2E 测试项目骨架。创建目录结构、根据 setup 配置生成对应测试框架配置、读取 MCP 配置、设置多环境变量，标志项目可被 flow-create 和 flow-run 使用。
allowed-tools: Read, Write, Edit, Bash
deepstorm:
  tool: sweep
---

# Sweep Setup — E2E 测试项目初始化

初始化当前目录为 Sweep E2E 测试项目。根据 DeepStorm setup 阶段选择的 E2E 框架（如 Playwright），创建对应的项目骨架。

> **注意：** setup 是 flow-create 和 flow-run 的硬性前置条件。如果当前目录未初始化，其他 skill 会报错引导执行 `/sweep-init`。

---

## 使用方式

```bash
/sweep-init
```

在需要作为 E2E 测试项目的目录中执行。通常在一个空的或已有 git 仓库的目录中运行。

---

## 工作流

### 步骤 0：读取框架配置

在执行初始化前，先读取 `.claude/settings.json` 中的 `deepstorm.sweep.e2eFramework` 配置，确定当前项目使用的 E2E 框架。

```bash
cat .claude/settings.json 2>/dev/null | grep -o '"e2eFramework"[^,]*' | head -1 | cut -d'"' -f4
```

如果配置不存在或为空，使用默认值 `playwright` 并输出提示。

当前支持的框架：
- **playwright** — Microsoft Playwright（默认）

---

### 步骤 1：检查初始化状态

检查当前目录是否存在 `.sweep-init` 标记文件。

#### 1.1 已初始化 → 退出

- **WHEN** `.sweep-init` 文件已存在
- **THEN** 提示"当前目录已初始化为 Sweep 测试项目。如需重新初始化，请删除 .sweep-init 文件后重试。"并退出

#### 1.2 未初始化 → 继续

- **WHEN** `.sweep-init` 文件不存在
- **THEN** 继续执行初始化流程

---

### 步骤 2：创建项目目录结构

创建 E2E 测试项目的目录骨架。

#### 目录结构

```
.
├── flows/                       # 测试意图文档目录
│   ├── topology.yaml            # 功能模块拓扑定义（待用户编辑）
│   └── reports/                 # 执行报告持久化目录
├── scripts/
│   └── flow-selector.mjs        # 层级选择工具（预置）
├── .env                         # 环境变量（gitignored，即模板）
├── package.json                 # 依赖声明
└── tsconfig.json                # TypeScript 配置
```

> 如果框架为 `playwright`，还会额外生成 `playwright.config.ts`。

#### 执行

```bash
mkdir -p flows flows/reports scripts
```

---

### 步骤 3：生成项目配置文件（框架感知）

根据步骤 0 读取的框架配置，生成对应的配置文件。

#### 3.1 package.json

写入基础 `package.json`。如果框架为 `playwright`，包含 Playwright 依赖：

```json
{
  "name": "sweep-e2e",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@inquirer/checkbox": "^4.0.0",
    "@types/node": "^22.0.0"
  }
}
```

> 当 E2E 框架未知或未配置时，`package.json` 中仅包含 `@inquirer/checkbox` 和 `@types/node` 依赖，**不包含** `@playwright/test`。

#### 3.2 框架配置文件

**当框架为 `playwright` 时**，写入 `playwright.config.ts`，包含多环境 baseURL 设置：

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  timeout: 30000,
  retries: 0,
  reporter: [['line'], ['html', { outputFolder: 'flows/reports' }]],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

**当框架未知或未配置时**，跳过框架配置文件的生成，输出提示："框架未配置，请运行 deepstorm setup 并选择 E2E 框架。"

#### 3.3 tsconfig.json

写入 TypeScript 配置（框架无关）：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

### 步骤 4：收集多环境配置信息

#### 4.1 交互式询问环境地址

逐项询问用户输入被测系统的环境地址：

1. 测试环境（test）baseURL
2. 预发布环境（staging）baseURL
3. 生产环境（prod）baseURL
4. 默认目标环境（test / staging / prod）

#### 4.2 写入 .env

只写入环境地址配置，不包含 MCP 连接说明（MCP 配置在 `.mcp.json` 中统一管理）：

```bash
# .env（gitignored，不提交）
BASE_URL_TEST=http://localhost:3000
BASE_URL_STAGING=https://staging.example.com
BASE_URL_PROD=https://prod.example.com
DEFAULT_ENV=test
```

---

### 步骤 5：创建 topology.yaml 初始模板

写入功能模块拓扑文件基础结构：

```yaml
# flows/topology.yaml
name: E2E 测试拓扑
version: 1

modules:
  - name: example
    description: 示例模块
    children:
      - name: feature1
        description: 功能 1
        features: []
```

**提示用户：** 请根据实际产品结构编辑 `flows/topology.yaml`，添加对应的功能模块。

---

### 步骤 6：创建 flow-selector.mjs

使用 Read 读取本 skill 目录下的 `scripts/flow-selector.mjs` 文件，用 Write 写入目标项目的 `scripts/flow-selector.mjs`。

> **说明：** `flow-selector.mjs` 是基于 `@inquirer/checkbox` 的层级选择工具脚本（供 flow-run skill 调用）。
> 它与本 SKILL.md 同属一个 skill，作为 skill 的子文件分开维护，避免内联代码块导致的重复。

---

### 步骤 7：确认 E2E 框架 MCP 配置（从 `.mcp.json` 读取）

检查 `.mcp.json` 中是否存在对应框架的 MCP 服务配置。当框架为 `playwright` 时，检查 `deepstorm-playwright` 服务。

#### 检查 MCP 配置

```bash
cat .mcp.json 2>/dev/null | grep -c "deepstorm-playwright"
```

#### 7.1 MCP 已配置

- **WHEN** `.mcp.json` 中存在 `deepstorm-playwright`
- **THEN** 输出 "✅ Playwright MCP 已就绪（由 deepstorm setup 管理）"

#### 7.2 MCP 未配置

- **WHEN** `.mcp.json` 中不存在 `deepstorm-playwright`
- **THEN** 输出提示："⚠️ Playwright MCP 未配置。建议运行 `deepstorm setup` 并选择 Playwright MCP 服务以启用浏览器自动化。"
- **THEN** 不阻塞初始化流程，继续执行

> **注意：** Playwright MCP 配置由 CLI setup wizard 统一管理，不再由本 skill 在 `.claude/settings.json` 中独立配置。

---

### 步骤 8：完成初始化

#### 8.1 创建初始化标记

```bash
echo "sweep-e2e-project" > .sweep-init
```

#### 8.2 安装依赖

```bash
npm install
```

#### 8.3 输出完成信息

```
✅ Sweep E2E 测试项目初始化完成！

框架：{所选框架}

项目结构：
  flows/          — 测试意图文档目录
  flows/reports/  — 执行报告目录
  scripts/        — 辅助脚本
  (框架配置文件)  — {框架名} 配置文件

下一步：
  1. 编辑 flows/topology.yaml 添加你的功能模块
  2. 运行 /sweep-plan 创建测试意图文档
  3. 运行 /sweep-run 执行测试流程
```

---

## 检查清单

- [ ] 已读取框架配置（`deepstorm.sweep.e2eFramework`）
- [ ] `.sweep-init` 不存在 → 继续
- [ ] 项目目录结构已创建（flows/、flows/reports/、scripts/）
- [ ] package.json 已写入（含对应框架的依赖）
- [ ] 框架配置文件已生成（如 playwright.config.ts）
- [ ] tsconfig.json 已写入
- [ ] 用户已输入三个环境的 baseURL
- [ ] .env 已写入（gitignored）
- [ ] topology.yaml 初始模板已创建
- [ ] flow-selector.mjs 已写入
- [ ] 已确认 MCP 配置状态（从 `.mcp.json` 读取）
- [ ] .sweep-init 标记文件已创建
- [ ] npm install 已执行
