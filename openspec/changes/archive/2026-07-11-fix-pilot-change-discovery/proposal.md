## Why

Pilot 当前查找 `tasks.md` 使用硬编码路径 `path.join(projectDir, 'tasks.md')`，与项目实际的 OpenSpec 目录结构 `openspec/changes/<change-name>/tasks.md` 不匹配。同时 Pilot 完成 change 的所有 tasks 后不会自动归档，需要开发者手动操作，与「自动实现 Harness Agent」的定位不符。

## What Changes

- **重构文件查找策略** — 从"找 tasks.md 文件"变为"找第一个 active change 目录"，将该 change 的所有 artifacts（tasks.md + specs/ + design.md）一起读取传递给 Claude CLI
- **新增 ActiveChange 数据模型** — 表示一个 OpenSpec change 及其 artifact 路径的结构化接口
- **修正 `--tasks` 选项语义** — 从传文件路径改为传 change 名称（`openspec/changes/` 下的目录名）
- **新增 `findFirstActiveChange()`** — 扫描 active changes，按名称排序取第一个
- **新增 `findChangeByName()`** — 按名称精确查找 change
- **新增 `archiveChange()`** — 所有 tasks 完成后自动将 change 移至 `openspec/changes/archive/<date>-<name>/`
- **查找范围限定 active changes** — 不再 fallback 到 archive 或项目根目录，严格走 OpenSpec
- **更新 playground 测试脚本** — 补全 proposal/design/specs artifacts，匹配完整 OpenSpec 结构

## Capabilities

### New Capabilities

- `pilot-change-discovery`：基于 OpenSpec 目录结构的 change 查找能力，包含 `findFirstActiveChange` 和 `findChangeByName`
- `pilot-change-archive`：change 完成后的自动归档能力，将 change 目录从 `openspec/changes/` 移至 `openspec/changes/archive/`

### Modified Capabilities

- `pilot-run`：修改查找逻辑——不再硬编码 `tasks.md` 路径，改为调用 `findFirstActiveChange`；`--tasks` 语义改为传 change 名称

## Impact

- **affected code**: `packages/pilot/src/daemon/orchestrator.ts`（新增函数 + 重构）、`packages/pilot/src/cli/run.ts`（语义修正）
- **affected tests**: `packages/pilot/src/__tests__/daemon/orchestrator.test.ts`（新增/更新用例）
- **affected scripts**: `playground/scripts/setup-pilot.sh`（补全 artifacts）
- **no breaking changes**: 不修改 pilot 公共 API 签名
