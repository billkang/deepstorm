# Brainstorming Session — reef-start 借鉴 Lattice 能力

> 日期：2026-07-14
> 参与人：billkang + Claude
> 参考：[Lattice 项目分析](../../docs/lattice-analysis.md)、[DeepStorm vs Lattice](../../docs/deepstorm-vs-lattice.md)、[借鉴方案](../../docs/reef-start-lattice-adoption.md)

---

## 讨论内容

### 背景

基于对 Lattice 项目的完整分析（源码级），发现其风险自适应 execution mode、后置验证门禁、结构化证据闭环和上下文地图设计对 DeepStorm 的 reef-start 工作流有直接的借鉴价值。

### 关键对比发现

| 维度 | DeepStorm (reef-start) | Lattice (PrismSpec) |
|------|----------------------|---------------------|
| 执行模式 | TDD only（所有代码变更） | plan / tdd 自适应 |
| 验证 | TDD 循环隐式验证 | pipeline: build→lint→test→gates |
| 证据 | 散布（对话中/review 报告/hook 输出） | 收敛为 eval-run.json |
| 上下文 | 无结构化地图 | context/README.md + knowledge/ |

### 讨论的五个切入点

1. **风险自适应 mode（P0）** — superpowers 门禁增加 risk-routing-card，低风险走 plan mode
2. **后置验证门禁（P0）** — 每个 task 标完成前强制 build + lint + test
3. **Context 地图（P1）** — `.deepstorm/context.md` 项目上下文索引
4. **AC-to-test trace（P1）** — code-audit 增加 AA 回溯检查项
5. **统一证据收敛（P2）** — verify-report.json 结构化验证报告

### 决定

- 从 Phase 1（风险自适应 mode + 后置验证门禁）开始实施
- 这两个改动只涉及 SKILL.md 的流程描述，不涉及代码，风险最低
- 先改 SKILL.md 再扩展示例

---

## 产出文件

- 完整分析和方案：`docs/reef-start-lattice-adoption.md`
