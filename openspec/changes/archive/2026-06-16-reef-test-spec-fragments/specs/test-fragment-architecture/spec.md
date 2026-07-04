# test-fragment-architecture Specification

## Purpose

Defines the layered model (L0-L3) for organizing test code-style fragments in Reef. Establishes how test fragments are structured, how they compose with other dimensions (framework, ORM, etc.), and how they are automatically selected based on user's technology choices.

## ADDED Requirements

### Requirement: 测试 fragment 分层模型

测试规范 fragment SHALL 采用 L0-L3 四层分层模型组织。

#### Scenario: 层级定义
- **WHEN** 系统加载测试规范
- **THEN** 以下层级被识别：
  - **L0 通用原则**：跨语言/跨框架的测试基础原则（测试金字塔、FIRST 原则、AAA 模式），直接写死在 SKILL.md.tmpl 中
  - **L1 语言相关约定**：测试文件命名、目录结构、基础断言风格基调，写在各 L2 fragment 的 quick-reference.md 开头
  - **L2 测试框架层**：特定测试框架的用法（如 JUnit5 生命周期、Vitest describe/it/expect），对应独立 fragment
  - **L3 框架集成层**：特定框架集成的测试模式（如 @WebMvcTest、@DataJpaTest），对应独立 fragment

### Requirement: L0 通用原则

后端和前端 SKILL.md.tmpl SHALL 包含 L0 测试通用原则，约 5-8 行纯文本内容。

#### Scenario: L0 在模板中写死
- **WHEN** 测试维度被激活（用户选了某个测试框架）
- **THEN** SKILL.md.tmpl SHALL 渲染出 L0 块，内容至少包含：
  - 测试金字塔：Unit → Integration → E2E
  - FIRST 原则：Fast, Independent, Repeatable, Self-validating, Timely
  - AAA 模式：Arrange → Act → Assert

#### Scenario: L0 不独立为 fragment
- **WHEN** 用户选择任意测试框架
- **THEN** 系统 SHALL NOT 为 L0 创建或引用单独的 fragment 文件
- **THEN** L0 内容由 SKILL.md.tmpl 直接提供

### Requirement: 测试作为独立 code-style 维度

测试 SHALL 作为与 framework、ORM、AI 同级的独立 code-style 维度，在 fragments 中以 `test/` 为维度目录名。

#### Scenario: 后端测试维度
- **WHEN** 用户后端配置完成
- **THEN** 测试碎片 SHALL 放在 `fragments/java/test/` 目录下
- **THEN** 该目录内每个子目录代表一个测试 option（如 `junit5/`、`spring-mvc-test/`）

#### Scenario: 前端测试维度
- **WHEN** 用户前端配置完成
- **THEN** 测试碎片 SHALL 放在 `fragments/test/` 目录下
- **THEN** 该目录内每个子目录代表一个测试 option（如 `vitest/`）

### Requirement: 目录结构约定

测试 fragment SHALL 遵循现有 code-style fragment 的目录结构规范。

#### Scenario: fragment 目录结构
- **WHEN** 创建新的测试 fragment
- **THEN** 其目录结构 SHALL 为：
  - `<option>/quick-reference.md`：核心规范
  - `<option>/examples/`：示例代码文件（可选，但有源代码示例时必须放此处）

### Requirement: 自动推导规则

系统 SHALL 根据用户选中的技术栈自动推导需要加载的测试 fragment，无需用户额外选择。

#### Scenario: 后端自动推导
- **WHEN** 用户选中 JUnit5 作为测试框架
- **THEN** 系统 SHALL 自动加载 `fragments/java/test/junit5/`
- **WHEN** 用户选中 Spring Boot 作为 Java 框架
- **THEN** 系统 SHALL 自动加载 `fragments/java/test/spring-mvc-test/` 和 `fragments/java/test/spring-service-test/`
- **WHEN** 用户选中 Hibernate 作为 ORM
- **THEN** 系统 SHALL 自动加载 `fragments/java/test/data-jpa-test/`

#### Scenario: 前端自动推导
- **WHEN** 用户选中 Vitest 作为测试框架
- **THEN** 系统 SHALL 自动加载 `fragments/test/vitest/`

#### Scenario: 组合加载
- **WHEN** 用户选中 Spring Boot + Hibernate + JUnit5
- **THEN** 系统 SHALL 自动加载: `junit5/` + `spring-mvc-test/` + `spring-service-test/` + `data-jpa-test/`
- **THEN** 这四个 fragment 在 SKILL.md 中按 wizard.json 中定义的顺序排列

### Requirement: 参考实现策略

测试 fragment 的 quick-reference.md SHALL 以 JUnit5 + Spring Boot + Hibernate 为完整参考组合。

#### Scenario: 完整参考
- **WHEN** 编写测试 fragment 的 quick-reference.md
- **THEN** 内容 SHALL 以 JUnit5 + Spring Boot + Hibernate 为示例场景
- **THEN** 注释 SHALL 说明"为什么这么写"而非仅描述"怎么写"
- **THEN** 其他框架组合（MyBatis、TestNG、Quarkus 等）由 LLM 基于参考做 adaptive 输出，不需独立 fragment

### Requirement: 项目级 Override（L4）

项目级 Override（L4）SHALL NOT 纳入本次变更范围，为 future 方向。

#### Scenario: L4 预留
- **WHEN** 当前系统中没有配置 L4 Override
- **THEN** 系统 SHALL NOT 因缺少 L4 而报错或产生异常行为
