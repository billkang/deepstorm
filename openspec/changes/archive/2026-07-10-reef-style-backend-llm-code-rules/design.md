## Context

当前 `reef-style-backend` 的 Java 变体 `quick-reference.md` 中包含一个「LLM 常犯错误」章节，列出 LLM 生成代码时的常见错误模式。该章节在生成时作为 system prompt 注入，引导 LLM 避免已知错误。但现有规则缺少两条重要约束：

1. **NeedBraces** — Checkstyle 要求所有控制流语句使用大括号，LLM 经常生成省略大括号的单行体
2. **未使用局部变量** — Java 编译器警告未使用的局部变量；Java 21+ 提供匿名模式变量 `_`，LLM 不主动使用

`quick-reference.md` 是 LLM 技能加载时的规范速查，更新规则是解决此问题的最直接路径。

## Goals / Non-Goals

**Goals:**
- 在 Java 变体 `quick-reference.md` 的「LLM 常犯错误」章节新增 NeedBraces 和未使用变量规则
- Python 变体酌情同步（仅当存在对应章节时）
- CLI `deepstorm update` 将变更传播到已安装的副本和 playground

**Non-Goals:**
- 不修改 Checkstyle 配置本身（`NeedBraces` 已配置，问题在于 LLM 不遵守）
- 不引入新的文件或目录结构
- 不修改工具链或构建流程

## Decisions

### 决策一：在「LLM 常犯错误」章节追加而非新建独立章节
- **方案 A（✅ 选择）：** 在现有「LLM 常犯错误」章节追加两条规则
- **方案 B：** 新建独立的「代码风格规则」章节
- **理由：** 追加到已有章节改动最小，LLM 在一个地方集中看到所有常见错误，优先级暗示更明确。新增章节增加 prompt 长度，且问题本质正是"常见错误"而非独立规范。

### 决策二：Java 21 匿名模式变量 `_` 作为直接推荐而非可选
- **方案 A（✅ 选择）：** 直接要求使用 `_` 替代未使用的 switch 模式变量
- **方案 B：** 提供两种备选（删除变量名或使用 `_`）
- **理由：** `_` 是 Java 21+ 的标准语义，明确告知 LLM 使用此模式比提供模糊的二选一更有效。ChatBI 项目已使用 Java 21，不存在兼容性问题。

### 决策三：变量声明距离 + `final` 的约束粒度

- **方案 A（✅ 选择）：** 在「LLM 常犯错误」章节追加一条综合规则，同时覆盖声明距离（≤ 3 行）和 `final` 使用
- **方案 B：** 拆分为两条独立规则
- **理由：** 两个问题起源于同一个根因——LLM 倾向于"先声明再说"而非"用的时候再声明"。使用 `final` 是同一模式的自然延伸（如果变量只赋值一次且声明位置合理，就应该是 `final`）。一条规则同时约束两个面比分开更紧凑有效。

### 决策四：CLI 同步走已有资产传播路径
- `quick-reference.md` 在 `deepstorm setup` 和 `deepstorm update` 时被复制到安装项目的 `.deepstorm/` 目录。变更只需修改模板源文件，无需新增同步逻辑。
- `playground` 的验证通过 `pnpm playground:verify` 确认

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| LLM 可能仍不严格遵守规则 | quick-reference.md 是 system prompt 的一部分，随上下文注入，直接影响生成行为 |
| Python 变体的大括号规则不适用 | 先检查 Python quick-reference.md 是否有控制流章节；如需同步，使用 Python 风格的缩进约束替代 |
| playground/已安装副本未及时同步 | CLI update 命令已有资产同步机制；验证时检查同步后的文件内容覆盖 |
