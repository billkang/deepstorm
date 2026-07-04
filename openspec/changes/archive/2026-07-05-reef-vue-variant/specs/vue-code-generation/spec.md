## ADDED Requirements

### Requirement: Vue 框架选项注册
wizard.json 中 MUST 注册 Vue 作为可选的前端框架，用户选择前端技术栈时可以选择 Vue。

#### Scenario: Vue 框架选项出现
- **WHEN** 用户在 reef setup 向导中选择"前端技术选型"
- **THEN** 框架选项中 MUST 包含 `"vue"` 选项，显示标签为 "Vue"
- **AND** Vue 选项的 template 中 MUST 包含 label、buildTool、formatCmd、fileExt、sourcePath、styleRef

#### Scenario: Vue 选项的 affectedTemplates 配置
- **WHEN** 用户选择 Vue 框架
- **THEN** MUST 影响以下模板：`skills/reef-style-frontend/SKILL.md.tmpl`, `agents/reef-review-frontend.md.tmpl`, `skills/reef-review/SKILL.md.tmpl`, `skills/reef-gen-frontend/SKILL.md.tmpl`

### Requirement: Vue 模板变量注入
Handlebars 模板渲染系统 MUST 正确注入 Vue 框架的 template 变量，使共享 `.tmpl` 文件中的 `{{#if reef.frontend.framework.styleRef}}` 等条件块正确渲染 Vue 特有内容。

#### Scenario: styleRef 渲染
- **WHEN** Vue 框架被选中（非 `"none"`）
- **THEN** `reef-style-frontend/SKILL.md.tmpl` 中的 `{{#if reef.frontend.framework.styleRef}}` 条件块 MUST 渲染 Vue 规范引用链接

#### Scenario: sourcePath 渲染
- **WHEN** Vue 框架被选中（`sourcePath` 为 `"src/"`）
- **THEN** `reef-gen-frontend/SKILL.md.tmpl` 中的设计数据步骤 MUST 渲染，且编码步骤的编号 MUST 正确（4 而非 3）

### Requirement: Ant Design Vue UI 库选项
wizard.json 中 MUST 注册 `antd-vue` 作为 Vue 的 UI 组件库选项，与 React 的 `antd` 选项隔离。

#### Scenario: antd-vue 选项
- **WHEN** 用户在 UI 组件库中选择 `antd-vue`
- **THEN** MUST 使用 fragments `["ui-lib/antd-vue"]`
- **AND** styleRef MUST 指向 Ant Design Vue 规范文档

### Requirement: Vue 测试碎片注册
Vitest 选项选中时，MUST 包含 `["test/vitest", "test/vitest-vue"]` 两个碎片，其中 `test/vitest-vue` 为 Vue 专属测试碎片。

#### Scenario: Vitest + Vue 测试碎片
- **WHEN** 用户选择 Vitest 作为测试框架，且框架为 Vue
- **THEN** MUST 同时注册通用 `test/vitest` 碎片和 Vue 专属 `test/vitest-vue` 碎片

### Requirement: Vue 代码生成步骤
`reef-gen-frontend/variants/vue/steps.md` MUST 定义 Vue 3 的编码步骤顺序和约束。

#### Scenario: 编码步骤顺序
- **WHEN** 用户运行 Vue 代码生成技能
- **THEN** 步骤顺序 MUST 为：类型定义 → 组合式函数 → 组件（Ant Design Vue + `<script setup>`）→ 页面组装（Vue Router）

#### Scenario: 编码约束
- **WHEN** 步骤定义包括编码约束
- **THEN** MUST 覆盖：`<script setup lang="ts">`、组合式 API、Pinia 状态管理、Vue Router 路由、Ant Design Vue 按需导入
