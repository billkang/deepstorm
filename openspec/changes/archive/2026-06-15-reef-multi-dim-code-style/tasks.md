## 1. Handlebars 模板引擎迁移

- [x] 1.1 在 `packages/cli/package.json` 中添加 `handlebars` 依赖
- [x] 1.2 重写 `packages/cli/src/template/renderer.ts`：用 `Handlebars.compile()` 替换正则替换 —— 保持接口签名不变，输入 `.tmpl` 路径 + 变量上下文 + 输出路径。实现 `toNested()` 函数将扁平变量转换为嵌套对象，并自动将 "true"/"false" 字符串转换为布尔值以支持 `{{#if}}` 条件。
- [x] 1.3 （无需修改：renderTemplate 内部通过 toNested() 自动转换，buildTemplateVariables 保持扁平输出）
- [x] 1.4 实现 Handlebars partial 注册机制：`registerPartialsDir()` 函数 + 测试通过
- [x] 1.5 未定义变量处理已自动适配：Handlebars 默认输出空字符串，不再保留原文
- [x] 1.6 更新 `packages/cli/src/template/__tests__/renderer.test.ts`：新增条件分支、循环、partial、未匹配变量、布尔转换等 13 个测试，全部通过
- [x] 1.7 回归测试通过：全部 141 个测试无回归

## 2. 配置模型扩展与迁移

- [x] 2.1 修改 `packages/cli/src/types/config.ts`：配置类型从扁平扩展为嵌套结构，支持 `ReefConfig.frontend.{framework, tsConfig, css, test}` 和 `ReefConfig.backend.{language, java?: {framework, orm, dbMigration, ai}}`
- [x] 2.2 实现配置迁移函数 `migrateConfig()` + `readDeepStormConfig()`：检测旧扁平结构，补全缺失字段为 `"none"`，写入 `configVersion = 1`，输出迁移日志
- [x] 2.3 在 CLI 入口（config-view、config-set、config-refresh、doctor、setup）调用 `readDeepStormConfig()` 触发迁移
- [x] 2.4 config-set 已支持嵌套 key 路径（现有功能，增加 migration 前置调用）
- [x] 2.5 config-view 已改用 `readDeepStormConfig()`

## 3. Fragment 式 code-style 架构

- [x] 3.1 定义 fragment 目录结构约定（`fragments/{category}/{option}/` → `dimensions/{category}/{option}/`）
- [x] 3.2 `copyFragments()` 函数已实现并通过测试
- [x] 3.3 重构 `reef-style-frontend/SKILL.md.tmpl`：改用 `{{#if}}` + `{{styleRef}}` 条件引用模式
- [x] 3.4 重构 `reef-style-backend/SKILL.md.tmpl`：同上
- [x] 3.5 Angular 内容已从 `variants/angular/` 移到 `fragments/framework/angular/`
- [x] 3.6 Java 内容已从 `variants/java/` 移到 `fragments/language/java/`
- [x] 3.7 前端 + 后端所有维度目录结构已创建（含 Spring AI、Hibernate、Tailwind 等）
- [x] 3.8 `installAllToolAssets()` 已更新，模板渲染后调用 `copyFragmentsForSkill()`

## 4. Wizard 依赖支持

- [x] 4.1 `dependsOn` 字段已添加到 `WizardQuestion` 类型
- [x] 4.2 `runQuestionnaire()` 已更新：检查 `dependsOn` 条件，不满足时跳过并设默认值 `"none"`
- [x] 4.3 `--non-interactive` 模式下 `dependsOn` 自动处理（跳过的维度值默认为 `"none"`）
- [x] 4.4 `buildTemplateVariables()` 无需修改：`"none"` 选项的 `template.styleRef` 为空字符串，`{{#if}}` 自动识别为假
- [x] 4.5 `packages/cli/src/types/registry.ts` 已更新：新增 `dependsOn` 和 `fragments` 字段

## 5. Reef wizard 多维扩展

- [x] 5.1 前端从 1 个维度扩展为 4 个：`frontend.framework`、`frontend.tsConfig`、`frontend.css`、`frontend.test`
- [x] 5.2 前端维度全部带 `"none"` 默认值选项
- [x] 5.3 后端从 1 个维度扩展为 5 个：`backend.language` + `backend.java.{framework, orm, dbMigration, ai}`，Java 子维度带 `dependsOn`

## 6. Spring AI 及其他维度 code-style

- [x] 6.1 Spring AI 规范已完成（ChatClient、Tool、Advisor、VectorStore、RAG 等内容）
- [x] 6.2 Spring AI 示例文件（ChatClient、Tool、RAG、Structured Output — 4 个示例文件）
- [x] 6.3 TypeScript Strict 规范（quick-reference.md，覆盖 strictNullChecks、noUncheckedIndexedAccess、noImplicitOverride）
- [x] 6.4 Tailwind CSS / SCSS / CSS Modules / Jest / Cypress / Playwright / Spring Boot / Hibernate / Liquibase 规范（共 9 个 quick-reference.md）
- [x] 6.5 所有维度目录结构已创建完成

## 7. 测试与验证

- [x] 7.1 `renderTemplate` Handlebars 测试已完成（34 个测试，覆盖条件、循环、partial、错误处理、布尔转换）
- [x] 7.2 `buildTemplateVariables` 测试已完成（覆盖扁平映射、MCP 状态注入）
- [x] 7.3 `migrateConfig` 测试已完成（7 个测试，覆盖旧结构迁移、版本号、Java 维度补全）
- [x] 7.4 `copyFragments` 测试已完成（3 个测试，覆盖单维度、多维度、目录不存在）
- [x] 7.5 `runQuestionnaire` 的 `dependsOn` 测试（4 个测试：条件满足、条件不满足、已配置 key、无 dependsOn）
- [x] 7.6 完整测试套件 152/152 通过，无回归

## 8. 文档

- [x] 8.1 更新开发文档（`docs/deepstorm-development.md`）：新增「Code-Style 多维架构」章节，包含架构设计、添加新维度的 6 步流程、关键原则、Fragment 说明
- [x] 8.2 更新 README（`packages/reef/README.md`）：新增「多维 Code-Style 配置」章节，含前后端维度表、非交互式配置示例、配置迁移说明
