## Context

`packages/reef/skills/` 目录包含 47 个 markdown 文件（约 5,782 行），按技能目录组织。核心结构：

- **SKILL.md** — 入口文件，定义技能的行为和流程
- **quick-reference.md** — 速查参考，含规则摘要和代码示例
- **examples/** — 完整代码示例，展示最佳实践
- **references/** — 补充参考材料

最大文件在 `reef-style-backend/`（128K）和 `reef-style-frontend/`（80K）中。

## Goals / Non-Goals

**Goals:**
- 将前端 `code-wrapping.md` 从 416 行降至 ~220 行
- 将后端 `service-entity.md` 从 356 行降至 ~220 行
- 将后端 `code-wrapping.md` 从 211 行降至 ~140 行
- 将 `entity-types.md` 从 218 行降至 ~150 行
- 将 Spring Boot `quick-reference.md` 从 224 行降至 ~130 行
- 将 `testing.md` 从 253 行降至 ~160 行
- 将 `database-migration.md` 从 252 行降至 ~170 行
- 合并 2-3 个小文件减少文件总数
- 保持所有规则和规范点完整

**Non-Goals:**
- 不删除任何 markdown 文件中的规则或规范点
- 不改变 SKILL.md 的内容和行为
- 不改变目录结构（除小文件合并外）
- 不涉及 `packages/reef/skills/` 之外的任何文件

## Decisions

### 1. 精简策略：移除样板 + 去重，不删内容

所有优化基于三个操作：

| 操作 | 说明 | 示例 |
|------|------|------|
| **样板省略** | 代码块中的 imports、全类声明用 `// ...` 替代 | 保留核心逻辑，删除 import 行 |
| **正反合并** | 规则明显时只保留正例，删除反例 | "好的做法" 保留，"坏的做法" 删除 |
| **qref 引例** | quick-reference 中的完整代码块改为引用 examples/ | 改为 `详见 examples/xxx.md` |

理由：token 节省来自样板和冗余，而非删规则。规则丢了就需要用户重新补充，得不偿失。

### 2. quick-reference 改为「真·速查」

当前 quick-reference 包含短视频则列表+完整代码块。优化后：
- 保留速查表、规则列表
- 删除完整代码块（已在 examples/ 中有更详细的版本）
- 顶层添加目录引用 `> 完整示例见 examples/xxx.md`

理由：加载 quick-reference 时不需要同时加载 examples。用户需要完整示例时才去读 examples/。

### 3. 小文件合并规则

合并条件：同一 examples/ 目录下、主题紧密关联、每文件 <80 行的文件。

| 原文件 | 合并为 |
|--------|--------|
| `service-layer.md` (33行) + `template-routing.md` (78行) | `service-routing.md` |
| `types-pipes.md` (48行) + `component-patterns.md` (36行) | `component-types-pipes.md` |

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 精简过度导致示例不够清楚 | 每个规则至少保留 1 个完整示例 |
| 用户依赖某个被删除的特定反例 | 保留至少 1 个正例，规则文字足够清晰 |
| 合并文件后引用链接失效 | 检查所有 internal links，保持重定向一致性 |
