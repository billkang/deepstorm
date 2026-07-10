## Why

ChatBI 项目的 Checkstyle 构建检查中，LLM 反复触发 `NeedBraces`（控制流语句缺少大括号）和未使用局部变量警告。根因是 `reef-style-backend` 的 `quick-reference.md`「LLM 常犯错误」章节缺少这两条规则，LLM 加载技能后没有约束，自然回退到默认行为。

## What Changes

- **variants/java/quick-reference.md** — 「LLM 常犯错误」章节新增三条编码规则：
  1. 所有控制流语句（if/else/for/while/do）必须使用大括号 `{}`
  2. 禁止声明未被使用的局部变量；switch 模式变量改用 `_`（匿名模式变量）
  3. 局部变量声明必须靠近首次使用处（≤ 3 行）；从方法调用返回值赋值的局部变量使用 `final` 修饰
- **variants/python/quick-reference.md** — 同步第一条大括号规则（如适用）
- **CLI 同步** — `deepstorm update` 的资产同步逻辑覆盖安装副本和 playground

## Capabilities

### New Capabilities
- `llm-code-style-rules`: LLM 编码规范中关于代码风格约束的规则定义和文档

### Modified Capabilities

*（无现有 spec 修改）*

## Impact

| 项目 | 影响 |
|------|------|
| `packages/reef/skills/reef-style-backend/variants/java/quick-reference.md` | Java 变体的 LLM 常犯错误章节 |
| `packages/reef/skills/reef-style-backend/variants/python/quick-reference.md` | Python 变体（大括号规则可能不适用） |
| `packages/cli/src/commands/update/` | CLI update 命令的资产同步需要将 quick-reference.md 变更传播到安装副本 |
| `playground/.deepstorm/` | 需要同步到安装副本进行 E2E 验证 |
