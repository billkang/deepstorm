# Proposal: 旧数据源迁移集中化

## Why

DeepStorm v0.9.0 完成了配置数据源收口到 `.deepstorm/settings.json`（#41），但遗留了一个架构问题：**旧数据源的兼容处理分散在各消费代码中**，而非集中在升级入口。

每份消费代码（env-manager.mjs、SKILL.md 文件、shell hooks）都保留了"优先读 settings.json，fallback 到旧数据源"的判断逻辑。这导致：

1. **读取路径不统一** — 同一份数据可能来自 settings.json、.env、.sweep-init 或 scope-config.json
2. **代码冗余** — 每个消费方各自实现一套 fallback 逻辑
3. **难以维护** — 新增消费方时容易遗漏兼容处理
4. **测试复杂** — 每次测试需要在多个数据源之间模拟

用户要求将所有兼容处理**集中到 `deepstorm update` 命令中**，消费代码只读 `.deepstorm/settings.json`，不做兼容判断。

## What Changes

### 新增

1. `packages/cli/src/commands/update.ts` → `migrateOldDataSources()` 函数
   - 检测并迁移 4 类旧数据源到 `.deepstorm/settings.json`
   - Watermark 模式：目标字段已存在则不覆盖
   - 迁移后删除旧数据源文件/字段

### 修改

2. `packages/sweep/skills/sweep-run/scripts/env-manager.mjs` — 移除 envMap 参数、移除 .env BASE_URL fallback
3. `packages/sweep/skills/sweep-run/scripts/__tests__/env-manager.test.mjs` — 测试改为基于 settings.json 的 temp dir 模式
4. `packages/sweep/skills/sweep-init/SKILL.md` — 移除 .sweep-init 兼容判断
5. `packages/sweep/skills/sweep-run/SKILL.md` — 移除 step 1.2 .sweep-init fallback
6. `packages/sweep/skills/sweep-plan/SKILL.md.tmpl` — 移除 .sweep-init 引用
7. `packages/reef/hooks/reef-scope-check.sh` — 移除 scope-config.json fallback
8. `packages/reef/hooks/reef-scope-setup.sh` — 移除旧 scope-config.json 迁移逻辑
9. `packages/reef/skills/reef-scope/SKILL.md` — 更新 scope-config.json 说明

### 删除

无。

## Capabilities

| Capability | 描述 |
|-----------|------|
| `migration-engine` | `deepstorm update` 命令中的集中迁移引擎，负责所有旧数据源的检测、迁移和清理 |
| `consumer-code-cleanup` | 各消费方代码中的兼容逻辑移除，使其只读 `.deepstorm/settings.json` |

## Impact

| 模块 | 影响程度 | 说明 |
|------|---------|------|
| CLI update 命令 | 🟡 中等 | 新增迁移函数，action handler 中调用 |
| sweep env-manager | 🟡 中等 | 接口签名变更（移除参数），需同步更新测试 |
| sweep-init SKILL.md | 🟢 低 | 文档变化，移除一段过时代码 |
| sweep-run SKILL.md | 🟢 低 | 文档变化，移除一个 step 段落 |
| sweep-plan SKILL.md.tmpl | 🟢 低 | 模板变化，移除旧引用 |
| reef-scope hooks | 🟢 低 | 两个 shell 脚本中移除旧 fallback 逻辑 |
| reef-scope SKILL.md | 🟢 低 | 更新一段"注意"文字 |
