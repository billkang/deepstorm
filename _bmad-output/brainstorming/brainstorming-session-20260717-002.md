# Brainstorming Session — 2026-07-17-002

## 基本信息

- **日期**: 2026-07-17
- **参与**: billkang, Claude
- **主题**: 数据源迁移集中化 —— 所有旧数据源兼容处理统一收口到 `deepstorm update` 命令

---

## 讨论内容

### 1. 背景与触发点

在 v0.9.0 中，DeepStorm 完成了配置数据源收口工作（#41），将分散的配置统一到了 `.deepstorm/settings.json`。但收口工作遗留了**向后兼容兼容性代码**：

- 消费代码（env-manager.mjs、SKILL.md 文件、shell hooks）中保留了旧数据源的 fallback 读取逻辑
- `deepstorm update` 命令**不执行任何迁移**，兼容全靠各消费代码自行处理
- 新旧两套读取路径同时存在于代码中，每次读取都有判断分支

用户的核心诉求：**将所有旧数据源兼容处理全部集中到 `deepstorm update` 命令中，消费代码只读 `.deepstorm/settings.json`，不做兼容判断**。

### 2. 旧数据源清单

| # | 旧数据源 | 新位置 | 消费方 |
|---|---------|--------|--------|
| 1 | `.claude/settings.json` → `deepstorm` key | `.deepstorm/settings.json` 顶层字段 | CLI 自身（update、setup） |
| 2 | `.sweep-init` 标记文件 | `sweep.e2eProjectPath = "."` | sweep-init SKILL.md、sweep-run SKILL.md、sweep-plan SKILL.md.tmpl |
| 3 | `.env` 中的 `BASE_URL_*` / `DEFAULT_ENV` | `sweep.environments` | env-manager.mjs（被 sweep-run 和 sweep-plan 消费） |
| 4 | `.deepstorm/scope-config.json` | `reef.scope` | reef-scope-check.sh、reef-scope-setup.sh、reef-scope SKILL.md |

### 3. 决策原则

| 决策 | 选择 | 理由 |
|------|------|------|
| 迁移策略 | **Watermark 模式** | 目标字段已存在则不覆盖旧数据，旧数据源直接删除 |
| 旧数据源删除 | 迁移后立即删除 | 让用户感知到"已经迁移完成" |
| 迁移入口 | `deepstorm update` 命令 | 用户主动运行更新时触发，是唯一入口 |
| `.env` 秘钥行 | 保留 | API 秘钥等不属于 DeepStorm 配置，留在 `.env` |
| 迁移容错 | 不阻塞主流程 | 单个迁移失败仅输出警告，不影响其他迁移 |

### 4. 消费代码清理原则

所有消费代码**不再保留**对旧数据源的 fallback 读取或兼容判断：

| 模块 | 清理内容 |
|------|---------|
| `env-manager.mjs` | 移除 envMap 参数；`getDefaultEnv()`/`listEnvs()`/`resolveEnv()` 只读 settings.json；移除 .env BASE_URL fallback |
| `sweep-init/SKILL.md` | 移除 step 1.3（.sweep-init 兼容判断）；只读 settings.json 检查是否已初始化 |
| `sweep-run/SKILL.md` | 移除 step 1.2（.sweep-init fallback） |
| `sweep-plan/SKILL.md.tmpl` | 移除 .sweep-init 引用 |
| `reef-scope-check.sh` | 移除 `read_config()` 中的 scope-config.json fallback |
| `reef-scope-setup.sh` | 移除旧 scope-config.json 迁移逻辑 |
| `reef-scope/SKILL.md` | 更新"注意"提示：scope-config.json 已不再使用，由 update 迁移 |

### 5. 影响范围

**8 个文件**（不含测试）：
- `packages/cli/src/commands/update.ts` — **新增** `migrateOldDataSources()` 函数（已实现）
- `packages/sweep/skills/sweep-run/scripts/env-manager.mjs` — 清理兼容代码（已实现）
- `packages/sweep/skills/sweep-run/scripts/__tests__/env-manager.test.mjs` — 更新测试（部分完成）
- `packages/sweep/skills/sweep-init/SKILL.md` — 清理
- `packages/sweep/skills/sweep-run/SKILL.md` — 清理
- `packages/sweep/skills/sweep-plan/SKILL.md.tmpl` — 清理
- `packages/reef/hooks/reef-scope-check.sh` — 清理
- `packages/reef/hooks/reef-scope-setup.sh` — 清理
- `packages/reef/skills/reef-scope/SKILL.md` — 更新文档

### 6. 已有实现检查

上一轮已完成的代码（保留不动）：

| 代码 | 状态 | 备注 |
|------|------|------|
| `update.ts` 中的 `migrateOldDataSources()` | ✅ 已实现 | 4 类旧数据源迁移逻辑完整 |
| `env-manager.mjs` | ✅ 已清理 | 所有函数不再接受 envMap 参数 |
| `env-manager.test.mjs` → `getDefaultEnv` 测试 | ✅ 已完成 | 基于 temp dir + settings.json 模式 |
| `env-manager.test.mjs` → `listEnvs` 测试 | ❌ 未完成 | 仍传 envMap 参数，需要改造 |
| `env-manager.test.mjs` → `resolveEnv` 测试 | ❌ 未完成 | 仍依赖 .env 读取，需要改造 |
| SKILL.md / shell hook 清理 | ❌ 未开始 | 6 个文件待清理 |
| `pnpm build` + `pnpm test` 验证 | ❌ 未执行 | |
