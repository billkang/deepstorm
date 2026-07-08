## 1. 路径修复 — CLI setup

- [x] 1.1 修正 `setup.ts` Step 5 hooks 合并目标路径为 `.claude/hooks.json`
- [x] 1.2 修正 `template-upgrade.ts` 中 `mergeToolHooksJson()` 目标路径
- [x] 1.3 修正 `merger/hooks.ts` JSDoc 路径注释
- [x] 1.4 更新 `reconfigure.ts` 清理逻辑，支持 `.claude/hooks.json`

## 2. 路径修复 — 套件 hooks.json

- [x] 2.1 修正 `packages/reef/hooks/hooks.json` 命令路径前缀
- [x] 2.2 修正 `packages/sweep/hooks/hooks.json` 命令路径前缀
- [x] 2.3 修正 `packages/tide/hooks/hooks.json` 命令路径前缀

## 3. 路径修复 — 测试适配

- [x] 3.1 更新 `reconfigure.test.ts` 适配路径变更
- [x] 3.2 删除废弃的 `playground/.claude/hooks/hooks.json`、`playground/e2e/.claude/hooks/hooks.json`

## 4. DeepStorm 开发 hooks — 配置文件

- [x] 4.1 创建 `.claude/hooks.json` 根级配置，注册 4 个 hook 脚本到对应事件

## 5. DeepStorm 开发 hooks — intent-detect

- [x] 5.1 创建 `deepstorm-intent-detect.sh` 检测开发意图关键词
- [x] 5.2 配置排除规则（查询类、命令类不触发）
- [x] 5.3 匹配时注入 `<system-reminder>` 提示走 deepstorm-discuss

## 6. DeepStorm 开发 hooks — block-dangerous

- [x] 6.1 创建 `deepstorm-block-dangerous.sh` 拦截危险系统命令（rm -rf / 等）
- [x] 6.2 拦截危险 git 操作（push --force main/master）
- [x] 6.3 拦截 curl|sh 管道执行
- [x] 6.4 拦截 sed -i 修改敏感文件

## 7. DeepStorm 开发 hooks — protect-files

- [x] 7.1 创建 `deepstorm-protect-files.sh` 禁止修改保护文件（.env、lock 文件）
- [x] 7.2 禁止修改保护目录（.git/、node_modules/、dist/）
- [x] 7.3 对关键配置（CLAUDE.md、registry.json、wizard.json）输出警告
- [x] 7.4 配置 PreToolUse prompt hook 提供 deepstorm-discuss 流程提醒

## 8. DeepStorm 开发 hooks — run-tests

- [x] 8.1 创建 `deepstorm-run-tests.sh` 编辑后自动检测所属包
- [x] 8.2 支持 `pnpm --filter` 精确运行对应包测试
- [x] 8.3 异步模式 + 30 秒超时放行
- [x] 8.4 Stop 事件退出时运行测试
- [x] 8.5 测试失败不阻塞流程（exit 0）

## 9. 验证

- [x] 9.1 确认 `deepstorm setup` 写入路径正确 — 代码审查确认 setup.ts 使用 `path.join(targetDir, '.claude', 'hooks.json')`
- [x] 9.2 确认 `deepstorm update` 合并 hooks 路径正确 — 代码审查确认 `mergeToolHooksJson` 使用 `.claude/hooks.json`
- [x] 9.3 确认各套件 hooks.json 路径变更正确 — 代码审查确认 reef/sweep/tide 路径
- [x] 9.4 确认 reconfigure 清理逻辑覆盖新旧路径 — 测试覆盖 reconfigure.test.ts
- [x] 9.5 确认所有 hook 脚本有可执行权限 — `ls -la` 验证
- [x] 9.6 确认 hooks.json 与脚本路径一致 — 5 个 command hook 路径全部存在
- [x] 9.7 确认自动测试可运行 — 442/443 pass（1 flaky pre-existing），无回归

## 10. 归档

- [x] 10.1 补充 hooks 路径的 memory 记录 — `hooks-json-path.md` 和 `deepstorm-self-hooks.md` 已创建
- [x] 10.2 将 change 目录移入 archive
