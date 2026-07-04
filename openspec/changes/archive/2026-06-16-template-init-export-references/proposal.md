## Why

`deepstorm template init` 和 `template apply` 命令使用 `copyDir`（`fs.cpSync` 递归复制）导出/应用 skill 模板，当前行为上 `references/` 子目录已被包含。但该行为缺乏明确的测试覆盖和文档确认，在今后代码重构中可能被无意破坏。需要对 `template init` 和 `template apply` 在 references/ 子目录上的行为进行测试化确认。

## What Changes

1. **template init 测试** — 为 `template-init.ts` 的 `initTemplate()` 增加测试用例，验证导出时包含 `references/` 子目录，且文件完整
2. **template apply 测试** — 为 `template-apply.ts` 的 `applyTemplate()` 增加测试用例，验证应用时保留 `references/` 子目录
3. **边界情况测试** — 验证当源目录不存在 `references/` 时，`template init` 和 `template apply` 静默跳过，不报错
4. **无需修改生产代码** — 当前 `copyDir` 的递归复制行为已正确工作

## Capabilities

### New Capabilities
- `template-export`: DeepStorm 模板导出/应用命令的核心逻辑，包括 skill 模板完整子目录的保留和恢复

### Modified Capabilities
- 无

## Impact

- `packages/cli/src/commands/__tests__/template.test.ts` — 新增测试用例
- 无需修改生产代码，无 API 变更，无 breaking changes
