# Brainstorming Session — 2026-07-17-001

## 基本信息

- **日期**: 2026-07-17
- **参与**: billkang, Claude
- **主题**: sweep-init 路径选择 + DeepStorm 配置统一收口

---

## 讨论内容

### 1. 背景

`sweep-init` 当前的 E2E 测试项目初始化将所有文件（package.json、tsconfig.json、playwright.config.ts、.env、flows/、scripts/ 等）直接生成在用户当前工作目录（根目录）。

对于独立 E2E 项目来说这是正确的行为。但在"多项目混放"场景下（E2E 代码和其他项目代码放在同一个仓库），E2E 代码需要一个独立目录。

### 2. 核心需求

1. `/sweep-init` 支持路径选择：每次执行时提示用户选择目标目录
   - 独立项目 → 根目录（当前行为）
   - 混放项目 → 子目录（如 `e2e/`、`tests/e2e/` 或自定义）
2. 后续 skill（`sweep-plan`、`sweep-run`）能自动感知 E2E 项目存放位置
3. 项目中的所有配置/状态数据全部收口到 `.deepstorm/settings.json`，消除额外数据源

### 3. 扫描发现的额外数据源

| 数据源 | 套件 | 当前形式 | 收口方案 |
|--------|------|---------|---------|
| `.sweep-init` | sweep | 标记文件（`sweep-e2e-project`） | → `sweep.e2eProjectPath` |
| `.env` (多环境 baseURL) | sweep | 独立 `.env` 文件 | → `sweep.environments` |
| `scope-config.json` | reef | `.deepstorm/scope-config.json` | → `reef.scope` |

其他文件（`.mcp.json`、`context.md`、`openspec/changes/`、`tide-data/`、`pilot-state.json` 等）各有用途，不适合收口。

### 4. 解决方案设计

#### 配置结构

```typescript
interface SweepConfig {
  e2eProjectPath?: string      // "." = 根目录, "e2e" = 子目录
  environments?: {
    test: { baseUrl: string }
    staging: { baseUrl: string }
    prod: { baseUrl: string }
    default: 'test' | 'staging' | 'prod'
  }
  ciProvider?: ...
}

interface ReefConfig {
  scope?: {
    enabled: boolean
    ciEnabled: boolean
    domains: string[]
  }
}
```

#### 交互流程（sweep-init Step 0A）

```
📂 E2E 测试项目类型：
  a) 独立项目 → 生成在当前目录
  b) 与其他项目混放 → 生成到子目录
      → 选择: e2e/ / tests/e2e/ / 自定义路径
```

#### 后续 skill 导航

sweep-plan / sweep-run 读 `settings.json` 的 `sweep.e2eProjectPath`，如果 `!= "."` 则切换到对应目录。

#### 向后兼容

- 旧 `.sweep-init` / `.env` 作为 fallback 读取
- `env-manager.mjs` 优先读 settings.json，fallback 到 `.env`

### 5. 影响范围

**11 个文件**：
- `cli/src/types/config.ts` — 类型定义
- `sweep/skills/sweep-init/SKILL.md` — 路径选择 + 配置写入
- `sweep/skills/sweep-plan/SKILL.md.tmpl` — 导航逻辑
- `sweep/skills/sweep-run/SKILL.md` — 导航 + 环境读取
- `sweep/skills/sweep-run/scripts/env-manager.mjs` — 数据源迁移
- `reef/hooks/reef-scope-setup.sh` — 写入 settings.json
- `reef/hooks/reef-scope-check.sh` — 读取 settings.json
- `reef/hooks/reef-scope-gate.sh` — 检查引用
- `reef/skills/reef-scope/SKILL.md` — 更新描述
- `sweep/wizard.json` — 可选向导配置
- `doctor.ts` — 诊断适配

### 6. 关键决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据源收口目标 | `.deepstorm/settings.json` | 已有三层配置体系中的 DeepStorm 层 |
| 路径交互方式 | 每次 /sweep-init 时提示 | 用户同时有独立项目和混放两种场景 |
| 标记文件 | 完全去掉 `.sweep-init` | 收口到配置文件后不需要额外文件 |
| 环境配置存储 | settings.json（非 .env） | 多环境 baseURL 是配置而非秘密 |
| 向后兼容 | 优先读 settings.json，fallback 旧文件 | 确保已有项目不中断 |
