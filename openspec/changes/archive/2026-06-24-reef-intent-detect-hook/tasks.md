## 1. 创建意图检测脚本

- [x] 1.1 创建 `packages/reef/hooks/reef-intent-detect.sh`，包含：
  - 从环境变量读取用户输入
  - 中文开发意图关键词匹配（"我想加"、"修复"、"重构"等）
  - 英文开发意图关键词匹配（"add a"、"fix"、"refactor"等）
  - 匹配成功时输出 `<system-reminder>` 指令，指示 AI 调用 reef-start skill
  - 非匹配时静默退出（exit 0）
  - Issue URL/编号匹配（确保 Issue 驱动的场景也被覆盖）
- [x] 1.2 在匹配规则中排除非开发意图的关键词和 slash 命令前缀，避免误触发

## 2. 更新 hooks.json 注册 BeforeRead hook

- [x] 2.1 修改 `packages/reef/hooks/hooks.json`，新增 `BeforeRead` hook 条目：
  - matcher: `"*"`（匹配所有用户消息）
  - type: `"command"`
  - command: `"bash ${CLAUDE_PLUGIN_ROOT}/hooks/reef-intent-detect.sh"`
- [x] 2.2 验证 hooks.json 结构兼容 `mergeHooks` 的 deepMerge 逻辑

## 3. 更新构建和部署逻辑

- [x] 3.1 确认 `build-registry.ts` 的 `copyAssetDirs` 能自动将新的 hook 脚本复制到 dist（检查 hooks 目录的文件筛选逻辑）
- [x] 3.2 确认 `runSetup` 中的 hook 部署流程能正确部署 BeforeRead 类型（当前 `mergeHooks` 按 keys 合并，不依赖 hook 类型名）
- [x] 3.3 验证 `reconfigure.ts` 的清理逻辑不受新 hook 影响

## 4. 编写测试

- [x] 4.1 为 `reef-intent-detect.sh` 编写测试：
  - 匹配中文开发意图关键词的用例
  - 匹配英文开发意图关键词的用例
  - 匹配 Issue 编号的用例
  - 非开发意图消息不应匹配的用例
  - 空输入的处理用例
- [x] 4.2 为 hooks merger 添加 `BeforeRead` 类型合并的测试用例（`packages/cli/src/merger/__tests__/hooks.test.ts`）
- [x] 4.3 端到端验证：安装 reef、确认 hooks.json 包含 BeforeRead 条目、确认脚本文件存在

## 5. 更新 reef-start 文档（可选）

- [x] 5.1 在 `packages/reef/skills/reef-start/SKILL.md.tmpl` 中增加说明：reef-start 可以通过意图检测自动触发，非必须手动调用

## 6. 验证与新架构成分集成

- [x] 6.1 确认 `BeforeRead` hook 与已有 `PreToolUse`、`PostToolUse`、`Stop` hook 无冲突
- [x] 6.2 确认已存在的 `.claude/hooks/hooks.json` 不会被覆盖（deepMerge）
- [x] 6.3 确认 `--reconfigure` 清理旧安装后再安装时，BeforeRead hook 正确部署
