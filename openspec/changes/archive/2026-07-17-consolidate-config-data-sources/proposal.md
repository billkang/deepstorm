## Why

当前 DeepStorm 的 sweep 和 reef 套件中存在三个散落在 `.deepstorm/settings.json` 之外的额外数据源（`.sweep-init` 标记文件、`.env` 环境变量文件、`.deepstorm/scope-config.json` 配置文件），导致配置存储不统一、后续 skill 定位 E2E 项目困难。同时 `/sweep-init` 不支持路径选择，在多项目混放场景下无法将 E2E 代码放入独立目录。

## What Changes

### 新增能力
- `/sweep-init` 执行时增加路径选择步骤，支持：根目录（独立项目）、`e2e/`、`tests/e2e/`、自定义路径
- `sweep-plan` 和 `sweep-run` 支持从 `settings.json` 读取 E2E 项目路径并自动导航

### 修改
- 将 `.sweep-init` 标记文件收口到 `settings.json` 的 `sweep.e2eProjectPath` 字段
- 将 `.env` 中的多环境 baseURL 收口到 `settings.json` 的 `sweep.environments` 字段
- 将 `.deepstorm/scope-config.json` 收口到 `settings.json` 的 `reef.scope` 字段
- 更新 `sweep-run/scripts/env-manager.mjs` 的配置读取源（从 `.env` 改为 `settings.json`）
- 更新 `reef-scope-setup.sh` 和 `reef-scope-check.sh` 的配置读写源

### 删除
- 不再生成 `.sweep-init` 标记文件
- 不再生成 `.env` 文件（环境 baseURL）
- 不再由 setup 脚本创建独立的 `scope-config.json` 文件

## Capabilities

### New Capabilities

- `e2e-project-path-selection`：sweep-init 支持路径选择，后续 skill 自动导航到目标目录
- `config-data-consolidation`：配置数据源统一收口到 `.deepstorm/settings.json`

### Modified Capabilities

无（均为新能力，不涉及已有 spec 的行为变更）

## Impact

| 受影响模块 | 影响范围 |
|-----------|---------|
| `packages/sweep/skills/sweep-init/SKILL.md` | 新增路径选择步骤；配置写入逻辑变更 |
| `packages/sweep/skills/sweep-plan/SKILL.md.tmpl` | 导航逻辑从读 `.sweep-init` 改为读 `settings.json` |
| `packages/sweep/skills/sweep-run/SKILL.md` | 导航逻辑 + 环境读取源变更 |
| `packages/sweep/skills/sweep-run/scripts/env-manager.mjs` | 配置读取源从 `.env` 改为 `settings.json` |
| `packages/cli/src/types/config.ts` | 新增 3 个配置接口字段 |
| `packages/reef/hooks/reef-scope-setup.sh` | 写入目标从 `scope-config.json` 改为 `settings.json` |
| `packages/reef/hooks/reef-scope-check.sh` | 读取源从 `scope-config.json` 改为 `settings.json` |
| `packages/reef/hooks/reef-scope-gate.sh` | 如有引用 `scope-config.json` 需同步迁移 |
| `packages/reef/skills/reef-scope/SKILL.md` | 更新配置描述 |
