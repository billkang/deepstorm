## ADDED Requirements

### Requirement: 多维向导问题支持

CLI SHALL 支持在 `wizard.json` 中定义多层级的向导问题，不限于扁平结构。问题之间可定义依赖关系（父问题选择特定值后才显示子问题）。

#### Scenario: 子问题展示
- **WHEN** wizard.json 中 `reef.frontend.framework` 问题后定义了 `reef.frontend.tsConfig` 问题
- **THEN** CLI 先展示 framework 选择，再展示 tsConfig 选择
- **THEN** 所有问题按 questions 数组顺序依次展示

#### Scenario: 条件依赖展示
- **WHEN** wizard.json 中 `reef.backend.java.orm` 的 `dependsOn` 为 `{ key: "reef.backend.language", value: "java" }`
- **THEN** 用户选择 `java` 作为后端语言后才展示 ORM 选择问题
- **THEN** 用户选择 `python` 时，ORM 问题自动跳过

### Requirement: 扩展定义支持（`dependsOn` 字段）

wizard.json 的 question 结构 SHALL 扩展，每个 question 可选包含 `dependsOn` 字段定义条件依赖。

#### Scenario: dependsOn 定义
- **WHEN** wizard.json 中包含:
  ```json
  {
    "key": "reef.backend.java.ai",
    "label": "AI 框架",
    "type": "select",
    "dependsOn": { "key": "reef.backend.language", "value": "java" },
    "options": [...]
  }
  ```
- **THEN** CLI 读取 wizard.json 时识别 `dependsOn`
- **THEN** 仅在用户选择 `java` 作为后端语言时展示该问题
- **THEN** 用户未选择 `java` 时，`reef.backend.java.ai` 被设置为默认值 `"none"`

#### Scenario: 多级依赖
- **WHEN** question A 依赖 B，B 依赖 C
- **THEN** CLI SHALL 按依赖顺序递归检查，所有依赖条件满足后才展示 A
- **THEN** 用户的 config 中 A 的值应为其默认值 `"none"`（跳过时）

### Requirement: Wizard 重构——前端从单维度到多维度

Reef 的前端配置 SHALL 从单一的 `frontend.framework` 维度扩展为多个正交维度。

#### Scenario: 前端多维选择
- **WHEN** 用户进入 reef 前端配置
- **THEN** CLI 按顺序展示:
  1. 前端框架（`frontend.framework`）：Angular / React / Vue / none
  2. TypeScript 配置（`frontend.tsConfig`）：strict / standard / none
  3. CSS 方案（`frontend.css`）：Tailwind / SCSS / CSS Modules / none
  4. 测试框架（`frontend.test`）：Jest / Cypress / Playwright / none

#### Scenario: 已有用户兼容
- **WHEN** 用户的 `deepstorm` 配置中只有旧字段 `reef.frontend.framework`
- **THEN** CLI SHALL 为新维度（`tsConfig`、`css`、`test`）使用默认值 `"none"`
- **THEN** 默认值对应的 styleRef 为空字符串，SKILL.md 不展示对应维度内容

### Requirement: Wizard 重构——后端从单维度到多维度

Reef 的后端配置 SHALL 从单一的 `backend.language` 维度扩展为多维嵌套结构。

#### Scenario: 后端多维选择
- **WHEN** 用户选择 `java` 作为后端语言
- **THEN** CLI 接着展示 Java 子维度:
  1. Java 框架（`backend.java.framework`）：Spring Boot / Quarkus / Micronaut
  2. ORM（`backend.java.orm`）：Hibernate / MyBatis / jOOQ / none
  3. 数据库迁移（`backend.java.dbMigration`）：Liquibase / Flyway / none
  4. AI 框架（`backend.java.ai`）：Spring AI / LangChain4j / none

#### Scenario: 非 Java 语言
- **WHEN** 用户选择 `python` 作为后端语言
- **THEN** CLI 展示 Python 子维度（如 `python.webFramework`、`python.orm`）
- **THEN** Java 子维度不展示，对应配置值设为 `"none"`
