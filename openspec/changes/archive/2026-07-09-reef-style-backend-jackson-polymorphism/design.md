## Context

在 ChatBI 项目实践中，后端使用枚举 `ChartType` + `@JsonProperty("chartType")` 的方式分发图表类型。每新增一种图表类型需要在 4 处同步修改：后端枚举、后端 switch、前端 enum、前端模板 switch。这种模式在图表类型超过 2-3 种时变得难以维护。

参考低代码项目（`DatasetDto` → `DatabaseDatasetDto | HttpDatasetDto`）的 Jackson 多态模式，已成功完成 ChatBI 的重构。本次设计将这一模式沉淀为 reef-style-backend 的 Java API 编码规范文档，使后续生成的 Spring Boot 项目能开箱即用地采用 Jackson 多态序列化。

## Goals / Non-Goals

**Goals:**
- 定义 Java 后端 Jackson 多态序列化的标准编码规范
- 定义 TypeScript 端 Discriminated Union 的对应规范
- 覆盖前后端 discriminator value 同步约定
- 覆盖 Checkstyle 兼容性处理方案
- 覆盖空值安全和向后兼容指引
- 产出可读、可直接参考的规范文档

**Non-Goals:**
- 不修改 reef-style-backend 的代码生成逻辑（当前是纯文档变更）
- 不引入新的 Maven/Gradle 依赖
- 不涉及 Python（FastAPI）端 API 规范的修改
- 不修改 ChatBI 项目代码（重构已完成）
- 不涉及测试框架的引入或修改

## Decisions

### Decision 1: `@JsonTypeInfo` property 值使用 `"type"` 而非 `"chartType"`

**选择的方案：** `property = "type"`

| 候选 | 理由 | 结论 |
|------|------|------|
| `"type"` | 简短通用，多态基类的职责就是描述"是什么类型"，`"type"` 是最直观的字段名。已与低代码项目 (`DatasetDto`) 保持一致 | ✅ |
| `"chartType"` | 字段名传达了业务上下文（图表类型），但限制了基类的可复用性。如果未来有其他多态场景（如 `DataSourceConnector`）也需要 `"chartType"` 这个字段名，会造成冲突或误解 | ❌ |
| `"kind"` | 某些语言/框架使用 `kind` 作为 discriminator，但 Jackson 社区惯例、低代码项目均使用 `"type"`，不应引入不必要的差异 | ❌ |

**影响：** JSON 中 discriminator 字段名为 `"type"`，前端 `@switch(answer.chartView.type)` 中使用同一字段名。

### Decision 2: discriminator 策略使用 `SIMPLE_NAME` 而非自定义值

**选择的方案：** `use = JsonTypeInfo.Id.SIMPLE_NAME`

| 候选 | 理由 | 结论 |
|------|------|------|
| `SIMPLE_NAME` | 子类简名（如 `MetricCardView`）自描述，无需额外常量文件维护 discriminator value。子类名本身就是最好的文档 | ✅ |
| `CLASS_NAME` | 全限定名（如 `com.example.MetricCardView`）过长，在 JSON 中不可读，且暴露包结构 | ❌ |
| `MINIMAL_CLASS` | 不常用，需要自定义序列化器 | ❌ |
| `CUSTOM` | 需要额外维护一层 mapping（如 `@JsonTypeIdResolver`），增加了复杂度而没有实质收益 | ❌ |

**影响：**
- `@JsonSubTypes.Type(name = "MetricCardView")` 中的 name 可以省略（SIMPLE_NAME 默认使用类名），但 **显式指定 name 更安全**，避免因 IDE 重命名导致意外时仍然一致
- name 值同时也作为前端 TS literal type 的对应值

### Decision 3: 使用 `@JsonSubTypes` 而非自定义序列化器

**选择的方案：** `@JsonSubTypes` 注解注册子类

| 候选 | 理由 | 结论 |
|------|------|------|
| `@JsonSubTypes` | Jackson 原生支持，注解式声明最直观，新增子类只需加一行注解 | ✅ |
| `@JsonTypeIdResolver` | 自定义解析器，适合动态类型注册场景。当前场景子类已知且固定，不需要动态解析 | ❌ |
| 手动序列化器（`JsonSerializer`） | 完全的序列化控制，但需大量模板代码，不符合编码规范"简单可复用"的目标 | ❌ |

**限制：** `@JsonSubTypes` 要求所有子类在基类的注解中集中注册。新增子类时必须修改基类的 `@JsonSubTypes` 列表。

### Decision 4: 前端使用 Discriminated Union 而非 Enum + Narrowing

**选择的方案：** TypeScript `type ChartView = MetricCardView | LineChartView` 联合类型

| 候选 | 理由 | 结论 |
|------|------|------|
| Discriminated Union | TypeScript 原生支持，`@switch` + type 属性自动窄化类型。无需手动类型守卫 | ✅ |
| 前端枚举 + 类型守卫函数 | 需要手动编写窄化逻辑，新增类型时必须同时修改枚举和守卫函数，与后端 enum 模式的维护成本相同 | ❌ |
| `unknown` + 运行时校验 | 完全无类型安全，不在考虑范围内 | ❌ |

### Decision 5: Checkstyle 冲突通过 `@JsonProperty` 解耦而非禁用规则

**选择的方案：** `@JsonProperty("xAxisName") private String categoryAxisLabel`

| 候选 | 理由 | 结论 |
|------|------|------|
| `@JsonProperty` 解耦 | Java 字段名保持代码风格合规（`categoryAxisLabel`），getter 名为 `getCategoryAxisLabel()` 符合 Bean 规范，JSON 输出保持 `xAxisName`。不违规，不改规则 | ✅ |
| 禁用 Checkstyle `ParameterNameCheck` | 全局禁用会降低所有命名的规范性，不符合团队的编码纪律 | ❌ |
| 修改 Checkstyle 规则允许 `xAxisName` | 允许一种特定的命名会在规则中留下例外，降低规则权威性 | ❌ |

### Decision 6: Decoder 对象保持 record（如 `MetricAnswer`）

**选择的方案：** record 保留结构，直接替换字段类型

`MetricAnswer` 是 Java `record`，不能继承。改造方案是：
- 移除 `ChartType chartType` 字段
- 新增 `ChartView chartView` 字段
- 构建逻辑从 `determineChartType()` 改为 `buildChartView()` 并返回具体子类

record 的紧凑语法不受影响，继续使用。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `@JsonSubTypes` 集中注册导致基类文件膨胀 | 图表类型达到 10+ 时基类文件可读性下降 | 按类型分组注释隔开（如 `// --- Line Charts ---`），或用 `@JsonSubTypes.Type` 的 import 引用 |
| 前后端 discriminator value 不一致 | 前端 type 窄化失败，运行时无法匹配 | 作为 Code Review checklist 项，并建议在 e2e 测试中验证 JSON type 字段与前端类型的映射 |
| `SIMPLE_NAME` 在继承层级复杂时不够精确 | 如果子类名重复（如两个子包下的同名类），SIMPLE_NAME 无法区分 | 当前场景（单包结构）无此风险。未来如有需要可改为 `@JsonTypeInfo.Id.NAME` + 自定义常量 |
| 开发者不熟悉 Jackson 多态 | 用错注解或遗漏 `@JsonSubTypes` 注册 | 规范文档提供了完整的步骤示例和最佳实践表格 |
| 前端 `@switch` 不能捕获非 literal type 的遗漏分支 | `@switch` 在 Angular 中没有 exhaustive checking | 考虑在 spec 测试中增加编译期检查，或使用 `never` 类型检查 |
| 删除枚举时的遗漏引用 | 编译期报错或运行时 ClassNotFoundException | spec 中已明确要求在删除前全项目搜索引用。Java 编译器和 TS 编译器也会自动检测到断开的引用 |

## 与已有文档的关系

本次设计不产生新代码实现，而是将已有的实践总结为规范文档。已有文档 `packages/reef/skills/reef-style-backend/fragments/java/api-spec/jackson-polymorphism.md` 已包含完整的内容骨架，后续 tasks 将基于本 design 和 specs 对其进行 review 和按需修改。

## 与构建系统的集成

为了使 `jackson-polymorphism.md` 能被正确部署到技能输出目录，需要：

1. **`quick-reference.md`** 中添加引用链接，让 agents 发现该文档
2. **`SKILL.md.tmpl`** 的知识文件清单中列出 `jackson-polymorphism.md`
3. **`packages/cli/src/commands/setup.ts`** 中的 `copyFragmentsForSkill` 函数增加第 3 步：复制 fragment 目录中除 `quick-reference.md` 和 `examples/` 以外的其他 `.md` 文件
