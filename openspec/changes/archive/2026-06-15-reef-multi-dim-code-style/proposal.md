## Why

当前 Reef code-style 只有扁平的两维度选择（前端框架、后端语言），无法表达子维度的组合（如前端需同时选择 framework + TypeScript 配置 + CSS 方案 + 测试框架；后端选择 Java 后还需选 Spring Boot / Hibernate / Liquibase / Spring AI）。随着项目引入 Spring AI 等新技术栈，现有系统无法满足扩展需求。

同时，当前模板引擎（纯 `{{var}}` 正则替换）缺乏条件分支和循环能力，限制了 code-style 片段的组合灵活性。

## What Changes

- **引入 Handlebars 模板引擎**：替换 `renderTemplate` 的正则替换逻辑，支持条件（`{{#if}}`）、循环（`{{#each}}`）、模板引用等能力
- **引入 fragment 式 code-style 架构**：每个维度独立产出 code-style 片段（markdown 文件），setup 时根据用户选择组合/拼接成完整的 SKILL.md
- **扩展 reef setup 维度**：将前端的单维度 `framework` 拆分为多维度（framework + tsConfig + css + test），将后端 `language` 拆分为多维度（language + orm + dbMigration + ai）
- **新增 Spring AI code-style**：作为 backend > java > ai 维度的一个选项
- **更新 config 模式**：将配置存储从扁平结构扩展为支持嵌套维度
- **非破坏性变更**：现有用户升级后无需重新执行完整 setup，新增维度以默认值填充

## Capabilities

### New Capabilities

- `handlebars-migration`: 将模板引擎从纯正则替换迁移为 Handlebars，支持 `{{#if}}`、`{{#each}}`、`{{else}}`、`{{> partial}}` 等能力，保持原有 `{{var}}` 语法向后兼容
- `code-style-fragments`: 实现 fragment 式 code-style 架构——每个维度产出独立 markdown 片段，setup 时根据用户选择组合成完整 SKILL.md；定义 section 级合并规则（同名 section 按数组顺序拼接，无覆盖）

### Modified Capabilities

- `template-management`: 模板引擎实现变更，从正则替换改为 Handlebars 编译渲染；`buildTemplateVariables` 输出改为嵌套结构；现有 `.tmpl` 文件无需修改
- `setup-wizard`: wizard 问题从 2 个维度扩展到多维（前端 3-4 维度，后端 4-5 维度）；支持问题间依赖（如选择 Java 后才展示 Java 子维度）
- `config-management`: 配置存储从 `reef.frontend.framework` 扁平结构扩展为支持多维嵌套结构；新增迁移逻辑将旧配置自动适配到新结构

## Impact

| 模块 | 影响 |
|------|------|
| `packages/cli/src/template/renderer.ts` | 核心替换——引入 handlebars 依赖，重写渲染逻辑 |
| `packages/cli/src/template/registry.ts` | `buildTemplateVariables` 输出改为嵌套结构 |
| `packages/cli/src/commands/setup.ts` | wizard 问题扩展、片段组合逻辑 |
| `packages/cli/src/types/config.ts` | 配置类型扩展支持多维嵌套 |
| `packages/reef/wizard.json` | 从 2 个问题扩展到多维问题 |
| `packages/reef/skills/reef-style-frontend/` | 重构为 base + 维度 fragment + 变体目录结构 |
| `packages/reef/skills/reef-style-backend/` | 同上，重构 |
| `packages/reef/skills/reef-start/SKILL.md.tmpl` | 用户打开的文件，需更新引用 |
| `packages/cli/src/template/__tests__/renderer.test.ts` | 测试更新 |
