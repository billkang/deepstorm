# Brainstorming Session — reef-start SKILL.md 文件拆分

> 日期：2026-07-15
> 讨论背景：reef-start SKILL.md 当前 807 行 / ~34KB / ~8,500 tokens，Agent 装载后上下文负担重，存在阅读不完整、跳步或遗漏细节的风险。需要在不改变行为逻辑的前提下，按 writing-skills 规范将重参考内容外置。

---

## 讨论过程

### 问题识别

1. SKILL.md 807 行的体量远超 writing-skills 建议的 500 词上限
2. 大量内容属于"参考信息"（模板、检查表、命令表、教育性 Red Flags），不是流程步骤本身
3. Agent 在流程执行中不需要一次性读取所有参考信息
4. 长文档增加了维护成本和修改时的上下文消耗

### 拆分的收益

- **按需加载**：每个外置文件 30-80 行，Agent 只在需要时读取
- **减少上下文消耗**：SKILL.md 从 807 行精简到 ~400 行，基准装载减半
- **降低幻觉风险**：短文档 Agent 更容易完整阅读，减少跳步和遗漏
- **维护友好**：改模板不动流程，改流程不动模板

### 拆分的粒度原则

- 不拆太碎：每个外置文件对应一个"阶段的知识集合"，而非"每句话一个文件"
- 自然的边界：外置单位 = Agent 在流程中一次读取且只读一次的内容

### 引用方式

SKILL.md 中不写无锚点引用，而是写具体的指令引用，如：

```
执行阶段四时，SEE: references/stage-4-implementation.md
  - 逐 task 实现流程 → 见该文件"4.2 逐 task 实现"
  - 验证命令参考 → 见该文件"验证命令表"
```

### 各段落的去留判断

| SKILL.md 段落 | 行数 | 判断 | 去向 |
|--------------|------|------|------|
| 功能概述 | ~29 | 流程必经 | 保留在 SKILL.md |
| 入口路由 | ~22 | 流程必经 | 保留在 SKILL.md |
| 运行时 MCP 服务发现 | ~29 | 流程必经，但 JSON 示例可精简 | 保留流程描述，JSON 示例外置 |
| Path A 阶段一（1.1-1.6） | ~88 | 流程步骤 | 保留在 SKILL.md |
| Path A 阶段二 | ~18 | 流程步骤 | 保留在 SKILL.md |
| Path B 阶段一（B1.1-B1.5） | ~55 | 流程步骤 | 保留在 SKILL.md |
| 阶段三 SDD + grill-me + writing-plans | ~92 | 流程步骤 | 保留在 SKILL.md |
| Superpowers 门禁规则 + 流程 | ~34 | 流程必经 | 保留在 SKILL.md |
| **风险路由判断流程** | ~36 | 流程必经 | 保留在 SKILL.md |
| **Mode 切换规则** | ~5 | 核心原则 | 保留在 SKILL.md |
| **两个模式的声明模板（Plan/TDD）** | ~80 | 参考模板，需时才用 | → `references/superpowers-gate.md` |
| 安全检查清单 + **Red Flags** | ~29 | 教育性内容，非流程步骤 | Red Flags → `references/superpowers-gate.md` |
| 阶段四流程图 + 核心原则 | ~64 | 流程必经 | 保留在 SKILL.md |
| **4.1 准备工作 + 4.2 逐 task 实现** | ~87 | 流程步骤，但细节可精简 | 保留骨架，详细指令外置 |
| **验证命令表 + code-audit + verify-report + 分支结束** | ~103 | 参考信息，需时才用 | → `references/stage-4-implementation.md` |

### 确定的目标结构

```
packages/reef/skills/reef-start/
├── SKILL.md                         # ~400 行 — 路由 + 流程图 + 关键纪律
├── references/
│   ├── risk-routing-card.md         # 已有
│   ├── superpowers-gate.md          # 🆕 新建 — 声明模板 + 检查清单 + Red Flags
│   └── stage-4-implementation.md    # 🆕 新建 — 逐 task 实现 + 验证命令表 + code-audit + verify-report + 分支结束
```

**不做的事：**
- ✅ 不改变流程行为逻辑
- ✅ 不修改 CLI 代码
- ✅ 不修改测试
- ✅ 不修改流程图（仅调整引用路径）

### 风险 / 权衡

| 风险 | 缓解 |
|------|------|
| 外置文件路径改变导致找不到 | SKILL.md 中写精确的引用指令 + 文件路径 |
| 外置文件逻辑与 SKILL.md 不同步 | 同步检查纳入 task 检查清单 |
| Agent 不读外置文件 | SKILL.md 中用 `SHALL` 要求 Agent 读取 |

---

## 结论

- **拆分粒度**：2 个外置文件（superpowers-gate.md + stage-4-implementation.md）
- **引用方式**：SKILL.md 内写精确的引用指令（文件路径 + 子节名）
- **MCP 服务发现**：保留在 SKILL.md，JSON 示例外置
- **Red Flags**：外置到 superpowers-gate.md，SKILL.md 中仅留一行引用
- **下一步**：创建 OpenSpec change → proposal → specs → design → tasks
