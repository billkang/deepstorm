## Context

Pilot 当前查找 `tasks.md` 使用硬编码 `path.join(projectDir, 'tasks.md')`，与项目实际使用的 OpenSpec 目录结构不匹配。正确的结构是 `openspec/changes/<change-name>/tasks.md`，且一个 change 还包含 `design.md` 和 `specs/` 等 artifacts，这些都应该在实现时一并传递给 Claude CLI。

### 约束

- 只处理 active changes（`openspec/changes/<name>/`），不处理已归档（archive）的 change
- 严格走 OpenSpec 目录结构，去掉旧兼容路径
- 多个 active change 时按目录名排序取第一个
- `--tasks` 改为传 change 名称而非文件路径

## Goals / Non-Goals

**Goals:**
- 新增 `ActiveChange` 数据模型，结构化表示一个 change 及其 artifacts
- 新增 `findFirstActiveChange()` — 扫描 active changes，按名称排序取第一个
- 新增 `findChangeByName()` — 按名称精确查找 change
- 修正 `--tasks <name>` 选项语义 — 传 change 目录名
- 新增 `archiveChange()` — 所有 tasks completed 后自动归档到 `archive/<date>-<name>/`
- 统一从一个 change 读取所有 artifacts（tasks.md + specs/ + design.md）

**Non-Goals:**
- 不处理已归档的 change（archive 中的不会被自动发现）
- 不保留项目根目录 `tasks.md` 向后兼容
- 不支持并行处理多个 change

## Decisions

### Decision 1: ActiveChange 模型

将所有 artifact 路径收敛到一个结构体中，避免分散的文件查找逻辑：

```typescript
interface ActiveChange {
  name: string       // 目录名
  dir: string        // 完整路径
  tasksPath: string  // tasks.md 路径
  specsDir: string   // specs/ 目录路径
  designPath: string // design.md 路径
}
```

**选择理由：** 相比分散的 `{ tasksPath, specsDir, designPath }` 变量传递，一个结构体更清晰，且方便传给 `readTasksMd`/`readSpecs`/`readDesignMd` 统一消费。

### Decision 2: 查找范围 — 仅 active changes

```
openspec/changes/
├── a-feature/     ← 扫描范围（排除 archive/）
├── b-feature/     ← 扫描范围
└── archive/       ← 排除（不扫描）
```

**为什么去掉 archive fallback：** 已归档的 change 是已完成的工作，不应被 pilot 重新发现和执行。如果用户想指定某个 archive 中的 change，可通过 `--tasks` 手动指定，但 `findChangeByName` 也只查 active。

**为什么去掉 root tasks.md：** 项目已全面采用 OpenSpec，保留旧路径只会让查找逻辑复杂化且容易产生歧义。

### Decision 3: archive 时机

```
所有 tasks status === 'completed' → 自动 archive
存在 failed/skipped → 跳过 archive（需人工处理）
```

归档格式：`openspec/changes/archive/<YYYY-MM-DD>-<change-name>/`

**选择理由：** 全部 completed 说明 change 已被 Claude 成功处理，自动归档减少人工操作。有失败时跳过，避免把未完成的工作误归档。

### Decision 4: 排序策略

多个 active change 时按目录名字符串排序（localeCompare default），取第一个。不使用修改时间，因为目录名的字母序更可预测和稳定。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 去掉向后兼容后，依赖旧路径的脚本可能失败 | playground 脚本同步更新；对外文档说明变更 |
| archive 操作中途失败可能导致状态不一致 | archive 前先验证 change 目录完整性；失败时保留原目录 |
| 多个 change 同名（active + archive 同时存在）时 `findChangeByName` 行为不确定 | 只查 active，active 存在就返回，不会查到 archive |
