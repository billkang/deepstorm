## Why

CLI installer 在安装技能和注册 hooks 时存在三个 bug，导致安装到 test-project 上的 reef/tide 套件功能残缺：模板技能（tide-discuss、sweep-plan、reef-start）的 `references/` 参考文件全部丢失，hooks.json 因构建时重复合并产生 14x 重复条目，且 tide 的 SessionStart hook 因安装时缺少合并逻辑而根本无法注册。这些问题影响所有用户安装 DeepStorm 后的首次使用体验，属于基础链路故障。

## What Changes

1. **模板技能安装时复制 references/ 目录** — `installer.ts` 中模板技能分支（SKILL.md.tmpl 存在时）增加 `references/` 子目录的拷贝逻辑，与已有 variants/ 和 fragments/ 并列
2. **构建时 hooks.json 合并去重** — `build-registry.ts` 的 `mergeHooksJson()` 在 concat 后按 (event, matcher, command) 去重，消除重复条目
3. **安装时 mergeHooks 接入** — `setup.ts` 中 hooks.json 复制逻辑从简单 `fs.cpSync` 改为调用已存在的 `merger/hooks.ts` 中的 `mergeHooks()` 函数，确保多工具安装时 hook 正确合并

## Capabilities

### New Capabilities
- `skill-installation`: CLI 安装引擎核心逻辑，负责将 skill/agent/hook 资产从 dist/ 复制到项目 .claude/ 目录。包含模板渲染、资产拷贝、hook 注册等功能

### Modified Capabilities
- `setup-wizard`: 安装流程中 hooks.json 的写入方式需要修改（从 cpSync 改为 merge）
- `template-management`: 模板渲染后的资产拷贝需要补充 references/ 目录的处理

## Impact

- `packages/cli/src/engine/installer.ts` — 模板技能分支增加拷贝 references/ 逻辑
- `packages/cli/src/build-registry.ts` — mergeHooksJson 增加去重
- `packages/cli/src/commands/setup.ts` — hooks.json 安装改为 merge 模式
- 无 API 变更，无数据库变更，无 breaking changes
