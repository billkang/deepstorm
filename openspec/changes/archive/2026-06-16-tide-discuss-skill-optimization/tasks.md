## 1. SKILL.md 合并与优化

- [x] 1.1 **合并参考文件** — 将 `entry-details.md`、`session-ops.md`、`archive.md` 内容内联到主 `SKILL.md.tmpl` 对应章节
- [x] 1.2 **保留文件加摘要** — 为 `prd-template.md`、`publish-flow.md` 增加顶部摘要索引块（`data-format.md` 保持纯数据格式引用）
- [x] 1.3 **更新参考文件索引** — 移除已内联的文件，仅保留 `data-format.md`·`role-prompts.md`·`checklists.md`·`prd-template.md`·`publish-flow.md`
- [x] 1.4 **上下文隔离指令全覆盖** — 所有 S1 入口点已包含 `/clear` 引导
- [x] 1.5 **删除冗余文件** — 已删除 `entry-details.md`、`session-ops.md`、`archive.md`，`references/` 仅剩 5 个保留文件

## 2. 验证与收尾

### 2.1 合并验证（grep 检查 — 2026-06-16 实施）

合并后对外部 reference 文件的引用全部为保留文件，无残留引用内联文件：

```
grep "references/" SKILL.md.tmpl 结果：
  data-format.md  ×2  — 数据格式（保留）
  role-prompts.md  ×1  — 角色 prompt（独立）
  checklists.md    ×1  — checklist 定义（独立）
  prd-template.md  ×1  — PRD 模板（保留）
  publish-flow.md  ×1  — 发布流程（保留）
  → 遗留引用数量：6，均为含意图保留的文件
```

- [x] 2.2 **更新 openspec/specs/tide-core/spec.md** — 上下文隔离 + 参考文件索引 已同步
- [x] 2.3 **归档 change** — 执行中
