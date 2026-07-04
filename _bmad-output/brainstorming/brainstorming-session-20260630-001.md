# 需求讨论：分支名支持 Conventional Commit 前缀

- **日期：** 2026-06-30
- **参与角色：** 开发
- **方式：** 自然口述讨论

---

## 触发点

用户发现当前分支命名规则不允许 feat/fix 等前缀，认为不合理——加前缀是行业通用规范。

## 讨论纪要

### 1. 当前规则的问题

现有分支命名约定（定义于 `playground/.claude/skills/reef-start/SKILL.md`）：

| 现有规则 | 值 |
|---------|-----|
| 格式 | 纯 kebab-case |
| 长度 | 3-6 词 |
| 前缀 | 不支持 |
| 分支名 = OpenSpec change 目录名 | `openspec/changes/$(branch)/` |

用户认为不允许前缀不合理，需要支持行业通用的前缀规范。

### 2. 前缀集讨论

讨论三个候选方案：

| 方案 | 包含前缀 | 评价 |
|------|---------|------|
| A — 标准 Conventional Commits 全集 | feat / fix / chore / refactor / docs / test / perf / style | 与 commit 完全对齐，语义最清晰 |
| B — 精简集 | feat / fix / chore / refactor | 覆盖 90%+ 场景，简单好记 |
| C — Conventional Commit + scope | feat/tide/xxx, fix/reef/xxx, etc. | 维度更丰富，但分支名太长 |

### 3. 关键约束讨论

- 分支名带 `/` 会改变 `openspec/changes/{branch}/` 的目录结构，产生新的层级（如 `openspec/changes/feat/add-user-auth/`）
- **用户确认：** 不用做兼容旧版本。新版 reef 创建分支时直接带上前缀即可，是全新的规范
- 涉及改动的技能：`reef-start`、`deepstorm-discuss`、`deepstorm-commit`、`reef-pr`、`bmad-quick-dev`

## 结论

| 决策项 | 决策结果 |
|-------|---------|
| 是否强制加前缀 | **是**，必须加 |
| 前缀集 | **方案 A** — 标准 Conventional Commits 全集（8 种） |
| 兼容旧分支 | **不兼容**，新分支直接使用新规范 |

## 后续 Action

1. 产出 brainstorming 文件 ✅（本文件）
2. 走 OpenSpec 创建变更 → proposal → specs → design → tasks
3. 变更各相关技能中的分支名规则
