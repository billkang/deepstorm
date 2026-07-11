# Brainstorming Session — Pilot 文件查找策略重构 + Archive 能力

**日期:** 2026-07-11

## 讨论主题

Pilot 当前查找 `tasks.md` 使用硬编码路径 `path.join(projectDir, 'tasks.md')`，不符合项目 OpenSpec 目录结构。需要重构为基于 OpenSpec change 模型的查找策略，同时补上 change 归档能力。

## 关键决策

### 1. 查找策略：从"找 tasks.md"变为"找 active change"

- 不再仅查找 `tasks.md` 文件
- 改为查找 `openspec/changes/<change-name>/` 下第一个 active change
- 将该 change 的所有 artifacts（tasks.md + specs/ + design.md）一起读取，传递给 Claude CLI
- 多个 active change 时，**按目录名称排序取第一个**

### 2. `--tasks` 选项语义

- **之前:** `--tasks <file>` — 传 tasks.md 文件路径
- **之后:** `--tasks <name>` — 传 change 目录名，查找 `openspec/changes/<name>/`

### 3. 查找范围：仅 active changes

- **只查 `openspec/changes/<name>/`**（排除 `archive/`）
- **不查 archive** — 已归档的 change 不应该被 pilot 重新执行
- **不查项目根目录** — 去掉向后兼容的 `projectDir/tasks.md` fallback

### 4. 新增 ActiveChange 数据模型

```typescript
interface ActiveChange {
  name: string       // 目录名
  dir: string        // 完整路径
  tasksPath: string  // tasks.md
  specsDir: string   // specs/
  designPath: string // design.md
}
```

### 5. Archive 能力（新功能）

Pilot 当前不具备 archive 能力，需新增：

- 当一个 change 的所有 tasks 执行完毕后，Pilot 自动将该 change 目录移至 `openspec/changes/archive/<date>-<name>/`
- 归档前确认所有 task 状态为 completed
- 归档后释放锁，进入下一轮循环处理下一个 change

### 6. 工作流

```
pilot run
  → findFirstActiveChange(projectDir)
  → 读取 change 所有 artifacts
  → 串行执行 tasks
  → 全部完成 → archiveChange(projectDir, change)
  → 释放锁 → 下一个 change（下一轮 pilot run）
```

## 需要修改的文件

| 文件 | 变更 |
|------|------|
| `packages/pilot/src/daemon/orchestrator.ts` | 重构 findFirstActiveChange/findChangeByName（去掉 archive fallback 和 root fallback）；新增 archiveChange 函数；runPilot 末尾调用 archive |
| `packages/pilot/src/cli/run.ts` | --tasks 语义更新 |
| `packages/pilot/src/__tests__/daemon/orchestrator.test.ts` | 更新/新增测试用例 |
| `playground/scripts/setup-pilot.sh` | 已更新（proposal/design/specs/tasks） |

## 待确认

- archive 时机：所有 tasks 完成后立即 archive，还是需要用户确认？
  - **决定：** 所有 tasks completed 后自动 archive，如有 failed/skipped 则跳过 archive
