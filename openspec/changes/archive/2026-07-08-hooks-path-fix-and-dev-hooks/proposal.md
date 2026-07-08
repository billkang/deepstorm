## Why

### 问题 1：hooks.json 写入路径错误

DeepStorm CLI 的 setup/upgrade 流程将 hooks 配置错误地写入 `.claude/hooks/hooks.json`（嵌套路径），但 Claude Code **只从** `.claude/hooks.json`（项目根路径）读取 hooks 配置。导致：

- 用户执行 `deepstorm setup` 或 `deepstorm update` 后，hooks 配置虽已写入但永远不生效
- 各套件（reef、sweep、tide）的 hooks.json 中的脚本路径使用 `./reef-*.sh` 相对格式，但正确的路径应该是 `.claude/hooks/reef-*.sh`（从项目根目录出发）

### 问题 2：DeepStorm 自身开发缺少流程约束

DeepStorm 自身开发过程中，没有机制保证变更前先走 `deepstorm-discuss` 流程。上一轮开发中直接跳步到编码就是一个教训。需要借鉴 reef 套件的 hooks 模式，为 DeepStorm 自身的 `.claude/` 开发环境增加 hooks 约束。

## What Changes

### Bug Fix：hooks 路径修正

- **修正** `packages/cli/src/commands/setup.ts` Step 5：hooks 合并目标路径从 `.claude/hooks/hooks.json` → `.claude/hooks.json`
- **修正** `packages/cli/src/commands/template-upgrade.ts`：`mergeToolHooksJson()` 目标路径同上
- **修正** `packages/cli/src/merger/hooks.ts`：JSDoc 注释路径修正
- **修正** `packages/cli/src/wizard/reconfigure.ts`：清理逻辑同时处理 `.claude/hooks.json` 和 `.claude/hooks/` 目录
- **修正** `packages/reef/hooks/hooks.json`：命令路径 `./reef-*.sh` → `.claude/hooks/reef-*.sh`
- **修正** `packages/sweep/hooks/hooks.json`：命令路径 `./sweep-mcp-hook.sh` → `.claude/hooks/sweep-mcp-hook.sh`
- **修正** `packages/tide/hooks/hooks.json`：命令路径 `./tide-session-preload.sh` → `.claude/hooks/tide-session-preload.sh`
- **更新** `packages/cli/src/wizard/__tests__/reconfigure.test.ts`：适配路径变更
- **删除** `playground/.claude/hooks/hooks.json`、`playground/e2e/.claude/hooks/hooks.json`：废弃的 hooks 嵌套配置

### New Feature：DeepStorm 自身开发 hooks

- **新增** `.claude/hooks.json`：根级 hooks 配置，注册 4 个 hook 脚本
- **新增** `.claude/hooks/deepstorm-intent-detect.sh`：UserPromptSubmit 事件，检测开发意图关键词（修改 setup、packages、hooks.json、build 等），自动注入 `<system-reminder>` 提示走 `deepstorm-discuss`
- **新增** `.claude/hooks/deepstorm-block-dangerous.sh`：PreToolUse|Bash 事件，拦截 `rm -rf /`、`git push --force`、`curl|sh`、`sed -i` 修改敏感文件等危险操作
- **新增** `.claude/hooks/deepstorm-protect-files.sh`：PreToolUse|Write|Edit 事件，禁止修改 `.env`、`pnpm-lock.yaml`、`node_modules/`、`dist/`、`.git/`；对 `registry.json`、`wizard.json`、`CLAUDE.md` 发出告警
- **新增** `.claude/hooks/deepstorm-run-tests.sh`：PostToolUse|Stop 事件，编辑 .ts 文件后自动检测所属包并运行对应 vitest 测试（30s 超时异步执行）；退出时也运行完整测试

## Capabilities

### New Capabilities
- `development-hooks`: DeepStorm 自身开发环境的 hooks 体系，提供 intent-detect、block-dangerous、protect-files、run-tests 四个约束 hook

### Modified Capabilities
- `hooks-setup-path`: CLI setup/upgrade 流程中 hooks.json 的写入路径从嵌套格式修正为标准根路径格式，确保 hooks 配置可被 Claude Code 正确加载

## Impact

- `packages/cli/src/commands/setup.ts`：Step 5 目标路径变更，移除 `targetHooksDir` 变量
- `packages/cli/src/commands/template-upgrade.ts`：`mergeToolHooksJson()` 目标路径变更
- `packages/cli/src/merger/hooks.ts`：JSDoc 修正
- `packages/cli/src/wizard/reconfigure.ts`：清理逻辑增加对 `.claude/hooks.json` 的处理
- `packages/cli/src/wizard/__tests__/reconfigure.test.ts`：测试用例适配
- `packages/reef/hooks/hooks.json`、`packages/sweep/hooks/hooks.json`、`packages/tide/hooks/hooks.json`：路径修正
- `.claude/hooks.json`：新增配置，关联 4 个 hook 脚本
- `.claude/hooks/deepstorm-*.sh`：新增 4 个 hook shell 脚本
- 测试结果：已知 `update.test.ts` 和 `build-registry.test.ts` 各 1 个 flaky test（npm 版本检查、file mtime 同步），与本次变更无关
- Non-Goals：不修改各套件 hook 脚本内部逻辑，不修改构建/发布流程，不修改 playground 配置
