## Context

`deepstorm-discuss/SKILL.md`（618 行）和 `reef-start/SKILL.md.tmpl`（421 行）是 DeepStorm 开发工作流的核心 skill 文档。目前两个文件中的流程逻辑使用文字描述（表格、编号列表、ASCII 箭头），随着 skill 持续演进，流程部分的行数和复杂度不断增长。

之前的工作中已经部分引入了 Mermaid 图（工作流总览、TDD 循环），本次将剩余的 5-6 处文字流程迁移到 Mermaid，形成统一的文档风格。

## Goals / Non-Goals

**Goals:**
- 将 deepstorm-discuss/SKILL.md 中 4 处文字流程替换为 Mermaid 流程图
- 将 reef-start/SKILL.md.tmpl 中 2 处文字流程整合/替换为 Mermaid 流程图
- 保持流程逻辑的完整性，不丢失信息
- 统一两个文件的流程图风格约定

**Non-Goals:**
- 不修改流程逻辑本身（只改表现方式，不改内容）
- 不修改非流程部分（语言规范表、检查清单、Red Flags 表、命令速查等）
- 不新增或修改 capability/feature
- 不涉及代码行为变更

## Decisions

| 决策 | 选择 | 备选方案 | 理由 |
|------|------|---------|------|
| 图类型 | `flowchart`（`TD` / `LR`） | `stateDiagram` / `graph` | `flowchart` 是 Mermaid 最通用的流程描述类型，支持条件分支、子图、样式设置 |
| 文字保留策略 | 移除被替代的文字 + 保留关键上下文 | 保留所有文字 + 图作为补充 | 遵循 spec 的"唯一事实来源"要求，避免双源冲突 |
| 入口门禁 | `flowchart TD` 决策树 | 表格 + 列标记 | 决策树能直观展示"消息类型 → 路由"的判定逻辑，表格适合数据对比不适合流程 |
| BMAD 正误路径 | `flowchart LR` 双列子图 | 两个独立小图 | 子图放在一个代码块中对比更直观 |
| Task 类型判断 | 扩展已有 TDD 流程图 | 独立新图 | 减少独立代码块数量，与 TDD 循环的自然衔接 |
| 样式 | 使用 `style` 着色关键节点 | 纯无样式图 | GREEN/BLUE 着色帮助快速定位"正确路径"/"门禁节点" |
| 颜色语义 | 🔴 RED / 🟢 GREEN / 🔵 BLUE / ⚠️ GATE | 无颜色 | 统一 SKILL.md 已有的红绿蓝语义（同 TDD 循环图） |

### 具体替换映射

| 文件 | 当前文字 | 替换为 |
|------|---------|--------|
| deepstorm-discuss/SKILL.md L63-79 | 路由表格（用户消息→步骤） | `flowchart TD` 决策树，3 个分支 |
| deepstorm-discuss/SKILL.md L157-183 | 正误路径对比（代码块 + 说明） | `flowchart LR`，correct vs incorrect 子图 |
| deepstorm-discuss/SKILL.md L443-461 | 前置条件表格 + 缺失指引 | `flowchart TD` 门禁判定，4 个检查点 |
| deepstorm-discuss/SKILL.md L506-515 | 步骤编号列表 | `flowchart TD` 循环流程图（读取→判断→TDD/直接→验证→循环） |
| deepstorm-discuss/SKILL.md L605-617 | 文字箭头数据流 | 移除 — 已有总览图涵盖 |
| reef-start/SKILL.md.tmpl L153-241 | `→ 阶段二/三` 文字过渡 | 合并到已有的功能概述图中 |
| reef-start/SKILL.md.tmpl L360-369 | Task 类型判断表 | 整合到已有的 TDD 流程图中（L329-343） |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Mermaid 在终端预览中不可读（纯文本 raw code） | 保留紧邻图表的简短文字引导（1-2 句），不依赖图作为唯一信息来源 |
| 后续维护者不熟悉 Mermaid 语法 | Mermaid 语法直观（`-->` 箭头），learning curve 极低；且在现有 SKILL.md 中已有使用先例 |
| 修改流程时忘更新图 | spec 已要求"唯一事实来源"纪律；通过 review 和 peer check 保障 |
| 行数缩减幅度小于预期 | 即使少量缩减，可读性提升已是主要收益。行数缩减是副产品 |
