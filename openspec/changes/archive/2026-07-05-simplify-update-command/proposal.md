## Why

当前 `deepstorm update` 命令有三个子选项（`--check`/`--cli`/`--skills`），交互路径复杂。用户期望一个无选项的 `deepstorm update` 完成所有更新工作：检查 CLI 版本、自动更新、基于已安装的工具套件同步 skill/hooks/agents，同时保护用户修改的文件不被覆盖。

## What Changes

- 去掉 `update` 命令的全部子选项（`--check`、`--cli`、`--skills`）
- `deepstorm update` 无选项执行：先更新 CLI，再读取 `.claude/settings.json` 中的安装记录和配置项，增量同步已安装的内容
- 同步范围从"仅 skill 模板"扩大到 skill + hooks + agents + MCP
- 用户修改保护：对比文件差异，已修改的文件加后缀保留用户版本，安装系统新版本，告知用户
- `template upgrade` 子命令不再保留，功能合入 `deepstorm update`

## Capabilities

### New Capabilities
- `update-command`: `deepstorm update` 无选项全量更新，合并 CLI 升级与资产同步

### Modified Capabilities
- (none)

## Impact

- `packages/cli/src/commands/update.ts` — 移除子选项逻辑，改为全量更新流程
- `packages/cli/src/commands/template-upgrade.ts` — 扩展为支持 hooks/agents/MCP 同步，增加用户修改检测与备份
- `packages/cli/src/index.ts` — `registerUpdateCommand` 调用方式不变（只是参数简化）
- `README.md` — 更新 CLI 命令一览表
- `packages/cli/src/commands/__tests__/update.test.ts` — 测试更新
