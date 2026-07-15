# Design — reef-start SKILL.md.tmpl 移植 + 文件拆分

> capabilities: `lattice-porting`, `skill-restructure`

## Context

### 问题来源

两次相互独立的优化：

**Phase 0 — 移植 lattice-adaptation 到源文件。** 上回的 lattice-adaptation 变更改动错了文件——修改了 build 产物 `SKILL.md` 而非源文件 `SKILL.md.tmpl`。`deepstorm setup` 渲染时只读 `.tmpl`，所以 5 个新能力（风险路由、后置验证门禁、上下文地图、AC-to-test trace、验证报告）实际在安装后不可用。

**Phase 1 — SKILL.md.tmpl 结构拆分。** Phase 0 移植后预计膨胀到 ~800 行。长文档会增加 Agent 阅读成本，影响执行性能。

### 内容性质分析

post-port SKILL.md.tmpl 的内容按使用模式可分为两类：

| 内容类型 | 行数（预估） | 特点 | 使用模式 |
|---------|-------------|------|---------|
| **流程路由 + 核心纪律** | ~400 | 入口路由、流程图、阶段路由、核心原则 | 每次执行都读 |
| **参考信息 + 详细指令** | ~400 | 声明模板、命令表、Red Flags、verify-report JSON | 流程到那步时才用 |

当前 inline 模式将两类内容混在一起，Agent 必须全量读取，但有一半是当前步骤不需要的。

## Goals

1. 将 lattice-adaptation 的 5 个能力从 SKILL.md 完整移植到 SKILL.md.tmpl（行为不变）
2. 将 SKILL.md.tmpl 精简到 ~400 行，降低基础上下文消耗
3. 参考信息按需加载，Agent 流程到某一步才读取对应文件
4. 保持行为完全不变——不是重构，是文件搬家
5. 保持 dist/ 构建输出一致——新外置文件也需要在构建时聚合

## Non-Goals

1. ❌ 不改变任何流程图
2. ❌ 不改变任何纪律规则、mode 切换规则、步骤顺序
3. ❌ 不改变 CLI 代码或测试
4. ❌ 不做功能增删

## Decisions

### D0: 先移植后拆分（两阶段顺序执行）

**决策：** Phase 0（lattice 移植）必须在 Phase 1（结构拆分）之前完成。拆分不能先做——如果先在现有的 SKILL.md.tmpl 上做拆分，会把当前缺少 lattice 内容的状态固定下来。

| 顺序 | 结果 |
|------|------|
| 先移植后拆分 ✅ | Phase 0 补全内容 → Phase 1 在完整版上拆分 |
| 先拆分后移植 ❌ | 拆出 reference 文件不包含 lattice 内容 → 还要再改一遍 |

### D1: 按"阶段"拆分，不按"句子"拆分

**决策：** 拆分的原子单位是"一个阶段的完整知识集合"，不是"每一个独立段落"。

- superpowers-gate.md 包含门闸阶段（阶段三→四过渡）的模板 + Red Flags
- stage-4-implementation.md 包含阶段四全部执行细节

这两个文件各自对应 Agent 一次读取、使用完毕的场景。

### D2: 引用指令使用 `SEE:` + 子节名

**决策：** SKILL.md.tmpl 中不写无锚点引用，而是写具体子节指引。

```
执行阶段四时，SEE: references/stage-4-implementation.md
  - 4.2 逐 task 实现 → 见该文件"4.2 逐 task 实现"
```

这是比锚点链接更实用的方式——Agent 读取后能自然滚动到对应位置。

### D3: MCP 服务发现流程描述保留 inline，JSON 示例外置

**决策：** 流程描述（读取 `.claude/settings.json` → `deepstorm.mcpCapabilities`）保留在 SKILL.md.tmpl，但其中的 JSON 结构示例可以外置到独立参考文件。

### D4: 引用指令使用 SHALL 强化

**决策：** 引用指令中使用 SHALL/MUST 要求 Agent 读取对应的外置文件，防止 Agent 跳过。

例：
> 执行阶段四时，AI SHALL 读取 references/stage-4-implementation.md 了解实现细节。

### D5: Phase 0 移植策略——逐段对应，不缩写不改写

**决策：** lattice 内容从 SKILL.md 移植到 SKILL.md.tmpl 时，保持原文不动。

- 不缩写、不改写、不重新组织
- 保留原段落标题层级和编号
- 保留原 Mermaid 流程图
- 只改行号变动（如段落在 SKILL.md.tmpl 中的插入位置不同，引用其他段落的编号需调整）

**原因：** 这是"补漏"而非"重构"操作。改写会引入新风险，且让后续 diff 更难追踪。

### D6: 删除 SKILL.md 前确认 build-registry 不依赖它

**决策：** 删除 SKILL.md 前，先确认 build-registry.ts 的 frontmatter 解析逻辑不依赖 SKILL.md 作为唯一源。

- `packages/cli/src/build-registry.ts` 第 169 行：`const skillMd = hasMd ? mdPath : tmplPath`（优先 SKILL.md）
- 删除后 build-registry 会 fallback 到 SKILL.md.tmpl，效果等价
- 需确认 tmpl 的 frontmatter 格式正确（Handlebars `--- ---` 在无变量时静态解析不影响）

## Risks / Trade-offs

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| Phase 0 移植遗漏某段内容 | lattice 能力不完整 | 中 | 逐段对比 + 通过 spec 验证 |
| Agent 不读外置文件 | 跳过关键步骤 | 中 | 引用指令中加入 SHALL 约束 |
| 外置文件与 SKILL.md.tmpl 不同步 | 矛盾或重复的信息 | 低 | 外置后 SKILL.md.tmpl 不再包含这些内容，天然消除重复 |
| 构建脚本遗漏新的 reference 文件 | dist/ 缺少文件 | 低 | 在 task 中增加 `pnpm build` 验证和 dist/ 内容检查 |
| Handlebars 变量在 reference 文件中未转义 | 渲染报错 | 低 | reference 文件中含 Handlebars 语法时需检查（通常不含变量） |
| build-registry 无法解析 tmpl 的 Handlebars frontmatter | registry.json 缺少 reef-start 条目 | 低 | 删除 SKILL.md 后执行一次 `pnpm build` 验证 |
