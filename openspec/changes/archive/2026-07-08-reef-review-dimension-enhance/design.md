## Context

reef-review 当前使用 3 个独立 agent（backend/frontend/infra）对 diff 进行代码审查。每个 agent 的 workflow 以「逐文件阅读 diff → 过 Checklist → 输出报告」为主，覆盖了编码规范、数据安全、性能等维度，但缺少三个关键的审查维度：

1. **CLAUDE.md 合规** — 变更是否遵守了项目指定的铁律和约定？
2. **代码注释合规** — 变更是否误触了 FIXME/HACK 标注的已知问题区域？
3. **Git history 上下文** — 同一区域反复修改是否暗示了更深层的问题？

Claude 官方 code-review 使用 5 个并行 Sonnet agent 分别覆盖这些维度，但其 token 消耗是 5×。reef-review 需要的是**基于现有 agent 的一次 diff 读取和一次文件扫描，顺带多做 2-3 个检查步骤**，而不是建新 agent。

## Goals / Non-Goals

**Goals:**
- 在每个现有 agent 的 workflow 中注入 CLAUDE.md 合规审查步骤（约 0 额外 token——CLAUDE.md 已在 prompt 上下文中）
- 在每个现有 agent 的 workflow 中注入代码注释合规审查步骤（利用已读取的 diff 中的行引用）
- 在每个现有 agent 的 workflow 中注入 git history 上下文分析（`git log --oneline -15` + `git blame`，2 个 git 命令的 token）
- 所有 issue 输出附带证据来源符号，便于 reviewer 追溯验证
- 新建一个专门的安全审查 agent，覆盖官方 code-review 未涵盖的 P0 安全维度

**Non-Goals:**
- 不新增并行审查 agent（维持 3→4 个 agent 的并行度）
- 不改变 agent 的调用方式和输出接口（下游消费方不感知变化）
- 不引入外部审查服务或 API 依赖（纯 prompt + git 命令模式）

## Decisions

### Decision 1：维度注入 vs 并行 agent
- **选择**：维度注入（在现有 agent workflow 中插步）
- **替代方案**：官方方式——每维度一个并行 agent（5× 额外 token，被用户明确否决）
- **理由**：每个 agent 已读取了 diff、已加载了技能上下文，插入 2-3 个额外检查步骤几乎不增加 token。agent 的质量（Sonnet）不变，只是多检了东西

### Decision 2：证据链符号系统
- **选择**：🧾📜📝📚🛠 五类符号 + 源引用
- **理由**：符号化可快速识别 issue 来源。Block 拿不出证据链自动降级，防止 reviewer 被无依据的 high-severity 判断干扰

### Decision 3：security agent 独立
- **选择**：新建独立的 reef-review-security.md，而非在 backend agent 中膨胀
- **理由**：安全审查的 Checklist 量级（20+ 条）和知识领域（OWASP、基础架构红级）与 backend 编码规范审查差异大，合并在一个 agent 会稀释专注度。但仍然是串行在 4 个并行 agent 中，不额外耗时

### Decision 4：Checlist 新增项直接注入
- **选择**：在现有 agent 的 🟡/🟢 Checklist 末尾追加新维度项
- **理由**：修改 Checklist 无须额外步骤。agent 在「逐项通过 Checklist」阶段自然会评估这些新增项，token 成本为零

## Risks / Trade-offs

- [**CLAUDE.md 不存在**] → 如果项目中无 CLAUDE.md，该步骤应跳过。SKILL.md.tmpl 中的 eligibility pre-check 已处理此场景
- [**git blame 超时**] → 大文件的 git blame 可能耗时较长。限定 `-L <start>,<end>` 范围，且仅对反复修改的区域执行
- [**证据链输出增加篇幅**] → 每个 issue 增加 1-2 行证据引用，对审查报告总长度影响约 10-15%，可接受
- [**security agent 误报率高**] → 有 P0-P5 分级和 `// @audit` 区域标注，false positive 可被 evidence chain 快速识别
