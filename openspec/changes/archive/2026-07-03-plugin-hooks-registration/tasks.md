## 1. Hooks 路径替换

- [x] 1.1 将 `packages/reef/hooks/hooks.json` 中的 `${CLAUDE_PLUGIN_ROOT}/hooks/` 替换为 `./`
- [x] 1.2 将 `packages/sweep/hooks/hooks.json` 中的 `${CLAUDE_PLUGIN_ROOT}/hooks/` 替换为 `./`
- [x] 1.3 将 `packages/tide/hooks/hooks.json` 中的 `${CLAUDE_PLUGIN_ROOT}/hooks/` 替换为 `./`

## 2. Plugin.json hooks 声明

- [x] 2.1 在 `plugin-build.ts` 中新增 `updatePluginJsonHooks()` 函数：在 `mergePluginHooks()` 后读取并更新 `plugin.json`，添加 `"hooks": "./hooks/hooks.json"`
- [x] 2.2 将 `plugin-builder.ts` 中的 `buildPlugin()` 生成的 `plugin.json` 恢复为不含 hooks 声明的基础版本（hooks 声明由 Step 7c 补充）
- [x] 2.3 运行 `pnpm build` 验证编译通过

## 3. Setup hooks 部署验证

- [x] 3.1 在 `ai` 项目中重新运行 `npx @deepstorm/cli setup`，确认 `.claude/hooks/` 是否被创建
- [x] 3.2 如果部署失败，修复 setup Step 5 的 hooks 合并逻辑
- [ ] 3.3 验证 standalone 模式下 hooks 能正常执行（如 `reef-block-dangerous.sh` 拦截危险命令） — 待实际 Claude Code 会话验证

## 4. 文档与归档

- [x] 4.1 用 `git diff` 确认所有改动文件
- [x] 4.2 提交变更并归档 OpenSpec change
