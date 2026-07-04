## Context

DeepStorm 各个 skill 中分支命名规则散落在多处，当前统一为纯 kebab-case（如 `add-user-auth`）。用户希望引入 Conventional Commit 前缀（`feat/add-user-auth`），使分支命名与提交规范对齐。

当前分支名在整个工作流中承担双重角色：
1. **Git 分支标识** — `git branch --show-current`
2. **OpenSpec change 目录查找键** — `openspec/changes/$(git branch --show-current)/`

引入前缀后，分支名从单路径变为分层路径，需确保所有消费分支名的 skill 正确解析并兼容新的格式结构。

## Goals / Non-Goals

**Goals:**
- 定义分支名格式规则：`{prefix}/{kebab-change-name}`
- 修改所有分支创建入口（`reef-start`、`bmad-quick-dev`），输出带前缀的分支名
- 修改所有消费分支名的 skill，使其正确解析带前缀的分支名
- 确保 `openspec/changes/` 目录结构与分支名一致

**Non-Goals:**
- 不处理现有旧分支的迁移（旧分支保持现状，新变更使用新格式）
- 不实现程序化的前缀验证钩子——验证通过 skill 指令中的文本约束实现
- 不修改 `.changeset/config.json`

## Decisions

### Decision 1: 分支名格式 — `{prefix}/{kebab-change-name}`

```
feat/add-user-auth
fix/login-timeout
chore/update-deps
```

**替代方案对比：**
- **`{prefix}-{kebab}`**（如 `feat-add-user-auth`）: 使用连字符而非斜杠分隔。**否决**——破坏了斜杠的分层语义，不利于分支筛选（`git branch --list 'feat/*'`），且与 Conventional Branch Naming 主流惯例不一致。
- **`{prefix}/{kebab}`**（选择）: 使用斜杠分隔，与 GitHub CLI、Conventional Commit、GitLab Flow 等主流工具和规范一致。

### Decision 2: OpenSpec change 目录包含前缀

分支名为 `feat/add-user-auth` → 目录为 `openspec/changes/feat/add-user-auth/`

**替代方案对比：**
- **去掉前缀**：`openspec new change "add-user-auth"` → 目录 `openspec/changes/add-user-auth/`。**否决**——分支名与 change 目录不一致，所有技能需额外转换逻辑，增加复杂度且容易出错。
- **保留前缀**（选择）：`openspec new change "feat/add-user-auth"` → 目录 `openspec/changes/feat/add-user-auth/`。分支名 = change 目录查找键的规则保持不变，技能无需修改路径解析逻辑。

`openspec` CLI 工具原生支持斜杠作为 change 名的一部分，无需改造。

### Decision 3: 前缀继承逻辑

消费分支名的 skill 从分支名中提取前缀，传递到下游工作流：

```
git branch --show-current → "feat/add-user-auth"
  ↓ 提取前缀
prefix = "feat"
  ↓ 传递给
commit type → "feat: <description>"
PR title  → "[feat] <title>"
```

**提取规则：** 截取第一个 `/` 之前的部分作为前缀。如果分支名不包含 `/`，则无前缀。

### Decision 4: 前缀验证方式

分支名前缀的验证通过 **skill 指令的文本约束** 实现，而非程序化 hook。

**理由：** DeepStorm 分支创建入口（`reef-start`、`bmad-quick-dev`）是 SKILL.md 中的指令文本，执行者为 AI。前缀集是固定枚举，在指令中硬编码即可，不需要运行时验证。

**具体实现：**
- `reef-start` Phase 2 中增加前缀选择步骤和格式模板
- `bmad-quick-dev` 分支名合理性检查中增加前缀有效性判断

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 分支名变长（`add-user-auth` → `feat/add-user-auth`） | 前缀只增加 4-6 个字符，在合理范围内 |
| 开发者在分支创建时可能选错前缀 | Spec 定义了"最能反映主要意图"原则，避免 `chore/` 作为默认值 |
| `openspec new change` 对带 `/` 的名称支持 | 已验证 CLI 工具原生支持，无需改造 |
| 已有自动化脚本可能假设分支名不带 `/` | 本变更新建分支使用新格式，旧分支不受影响 |

## Open Questions

- `bmad-quick-dev` 的分支名合理性检查中，如何引导用户选择正确的前缀？
