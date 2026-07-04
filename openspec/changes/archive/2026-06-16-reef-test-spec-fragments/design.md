## Context

Reef code-style 体系目前使用 fragment-based 架构，以 SKILL.md.tmpl（Handlebars）为入口，根据用户 setup 配置通过 `{{#if}}` 条件标签加载对应维度的 fragment。现有维度包括：language/framework/ORM/DB Migration/AI（后端）和 framework/tsConfig/CSS/test/UI Lib（前端）。

测试相关的碎片散落在各维度中（JUnit5 fragment 只有注解表，Spring Boot fragment 中含两行测试配置），缺少系统性设计和覆盖度。随着更多语言和框架的加入，测试写法的 N×M 组合问题会持续恶化。

本次设计不引入新工具或外部依赖，完全在现有 fragment 架构内扩展。

## Goals / Non-Goals

**Goals:**
- 建立分层（L0-L3）的测试规范体系，实现"语言/框架/ORM"正交组合
- 创建后端测试 fragments：junit5（增强）、spring-mvc-test、spring-service-test、data-jpa-test
- 增强前端 vitest fragment，补充 L0 通用原则和示例
- SKILL.md.tmpl 中加入 L0 测试通用原则（测试金字塔、FIRST、AAA）
- wizard.json 实现自动推导机制：用户选完框架后自动挂载对应测试 fragment
- 每个 fragment 提供完整示例（examples/ 目录）

**Non-Goals:**
- 不引入新的外部依赖或测试工具
- 不改变现有的 fragment 加载/渲染机制
- 不创建独立的 L0 fragment 文件（L0 写死在 SKILL.md.tmpl 中）
- 不做前端 Component/Service/E2E 测试维度（留给后续）
- 不做项目级 Override（L4，留给后续）
- 不支持 MyBatis 测试 fragment（留给后续）

## Decisions

### Decision 1: 测试提升为独立维度，与 framework/ORM 同级

**现状：** 测试知识散落在各维度内部（Spring Boot fragment 含测试小节、JUnit5 是独立但极浅的 test fragment）。

**方案：** 在 fragments 下以 `test/` 为独立维度目录，内部再按测试环境/场景划分子选项。后端子选项为：`junit5/`（L2）、`spring-mvc-test/`（L3）、`spring-service-test/`（L3）、`data-jpa-test/`（L3）。前端子选项为：`vitest/`（L2，增强现有内容）。

**理由：** 正交解耦——不选 Spring Boot 的项目仍然能拿到 JUnit5 规范；选了 Hibernate 但用 Quarkus 的项目仍然能拿到 DataJPA 测试规范。各 option 互不影响。

### Decision 2: 自动推导而非用户多选

**方案：** 用户在 setup 中选择技术栈（如 Spring Boot + Hibernate + JUnit5）后，系统自动推导需要加载的测试 fragment，不需要用户额外选择。

**推导规则：**
| 用户选择 | 自动加载 |
|----------|---------|
| JUnit5 | `fragments/java/test/junit5/` |
| Spring Boot | `fragments/java/test/spring-mvc-test/` + `fragments/java/test/spring-service-test/` |
| Hibernate | `fragments/java/test/data-jpa-test/` |
| Vitest | `fragments/test/vitest/` |

**备选方案考虑：** 用户多选更灵活，但增加了配置复杂度且大部分用户不会准确知道自己需要哪些测试类型。自动推导按"选了框架就提供该框架的测试规范"原则，符合直觉。

### Decision 3: L0 通用原则在 SKILL.md.tmpl 中写死

**方案：** L0（测试金字塔、FIRST 原则、AAA 模式，约 5-8 行）直接以纯文本形式写在后端和前端各自的 SKILL.md.tmpl 中。

**备选方案考虑：**
- 独立 L0 fragment：不值得为一个 5-8 行的文件增加一个维度
- 内化到每个 L2 fragment 中：如果新增语言（如 Python），每个 fragment 中需要同步更新，有 drift 风险
- 写在 SKILL.md.tmpl 中（选定）：共 5-8 行，前后端各写一次的可接受重复，不改构建流程

### Decision 4: 以 JUnit5 + Spring Boot + Hibernate 为完整参考

**方案：** 主选组合的 fragment 写最完整的 quick-reference.md 和 examples/，注释充分说明"为什么这么写"。对其他框架（MyBatis、TestNG 等）的场景，由 LLM 基于完整参考做 adaptive 输出。

**理由：** 不追求为每个 N×M 组合写完整规范，而是让 LLM 在上下文中灵活变通。完整参考的一个组合可以覆盖 80%+ 的使用场景。

### Decision 5: 目录结构采用扁平模式

**方案：** 所有测试 fragment 放在 `fragments/java/test/` 下扁平并列，不按 L2/L3 嵌套目录。

```
fragments/java/test/
├── junit5/               ← L2
├── spring-mvc-test/      ← L3
├── spring-service-test/  ← L3
└── data-jpa-test/        ← L3
```

**理由：** 简单、扩展方便（新增 MyBatis test 只需加 `data-mybatis-test/`），与现有 fragment 结构一致。

## Risks / Trade-offs

- **Fragment 增多带来选择复杂度**：新增 4 个后端测试 fragment + 1 个前端 fragment，wizard.json 的推导规则需要精确维护。选型组合变更时需同步更新推导规则。
- **L0 在模板中写死的维护问题**：如果未来需要增加 L0 内容（如新增"测试替身选择指南"），前后端两个模板需要同步修改。但 5-8 行的量级可控。
- **非 Java/非 Hibernate 场景的覆盖面不足**：MyBatis、TestNG、Quarkus 等暂无 fragment。LLM adaptive 的效果需要在实际使用中验证，如果质量不达标需要补充 fragment。
- **Vitest fragment 已有改动的兼容性**：现有 vitest fragment 已有内容，增强时需要确保不破坏已有格式和引用。
