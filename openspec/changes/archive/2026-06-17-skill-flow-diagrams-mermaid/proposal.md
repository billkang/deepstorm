## Why

`deepstorm-discuss/SKILL.md`（618 行）和 `reef-start/SKILL.md.tmpl`（421 行）包含大量文字描述的流程逻辑（决策树、分支判断、步骤流转），随着 skill 功能丰富，文件行数持续增长，文字流程的可读性和维护性在下降。将流程相关部分用 Mermaid 图表示，可以缩减文字量、让流程分支一目了然、降低后续修改的心智负担。

## What Changes

1. **deepstorm-discuss/SKILL.md** — 将 4-5 处文字流程改为 Mermaid 流程图：
   - 入口门禁路由（L63-79）：文字表格 → 决策树 `flowchart TD`
   - BMAD 讨论后下一步（L157-183）：正误对比文字 → 并行路径图
   - Apply 前置条件门禁（L443-461）：条件判断表格 → 决策流程图
   - 逐 task 执行流程（L506-515）：步骤列表 → 循环流程图
   - 底部数据流（L605-617）：文字箭头 → 可用已有总览图替代
2. **reef-start/SKILL.md.tmpl** — 优化已有 Mermaid 图 + 转换阶段过渡：
   - 阶段间过渡文字（`→ 阶段二` 等）→ 合并到总览阶段图
   - Task 类型判断表（L360-369）→ 整合到已有 TDD 流程图中的判断分支
3. 纯文档/模板改造，不涉及代码行为变更

## Capabilities

### New Capabilities
- `process-flow-visualization`: 在 skill 文档中使用 Mermaid 流程图替代文字描述，提高流程可读性和可维护性

### Modified Capabilities
无 — 本次变更不修改任何已有 capability 的需求层行为

## Impact

- `devtools/skills/deepstorm-discuss/SKILL.md` — 流程部分文字缩减约 8-10%，结构重组
- `devtools/skills/reef-start/SKILL.md.tmpl` — 流程部分文字缩减约 5-7%，过渡更清晰
- 无功能影响 — 纯文档/模板改造
- 无需测试变更
