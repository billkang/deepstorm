# Tasks: 旧数据源迁移集中化

## 1. 待完成的测试更新

- [x] 1.1 更新 `env-manager.test.mjs` 的 `listEnvs` 测试块：改为基于 settings.json + temp dir 模式，移除 envMap 参数
- [x] 1.2 更新 `env-manager.test.mjs` 的 `resolveEnv` 测试块：改为基于 settings.json + temp dir 模式，移除 .env 依赖

## 2. 清理 SKILL.md 中的向后兼容代码

- [x] 2.1 清理 `packages/sweep/skills/sweep-init/SKILL.md`：移除 .sweep-init 兼容判断
- [x] 2.2 清理 `packages/sweep/skills/sweep-run/SKILL.md`：移除 step 1.2 .sweep-init fallback
- [x] 2.3 清理 `packages/sweep/skills/sweep-plan/SKILL.md.tmpl`：移除 .sweep-init 引用

## 3. 清理 Shell Hook 中的向后兼容代码

- [x] 3.1 清理 `packages/reef/hooks/reef-scope-check.sh`：移除 scope-config.json fallback
- [x] 3.2 清理 `packages/reef/hooks/reef-scope-setup.sh`：移除旧 scope-config.json 迁移逻辑

## 4. 更新文档

- [x] 4.1 更新 `packages/reef/skills/reef-scope/SKILL.md`：scope-config.json 说明改为指向 update 命令

## 5. 构建与验证

- [x] 5.1 运行 `pnpm build` 验证 TypeScript 编译通过
- [x] 5.2 运行 `pnpm test` 验证测试全部通过

## 已完成（保留不动）

以下代码已在上一轮会话中完成，本次不再改动：

- ✅ `packages/cli/src/commands/update.ts` — `migrateOldDataSources()` 函数完整实现
- ✅ `packages/sweep/skills/sweep-run/scripts/env-manager.mjs` — 清理完毕，只读 settings.json
- ✅ `packages/sweep/skills/sweep-run/scripts/__tests__/env-manager.test.mjs` — `getDefaultEnv` 测试已完成
