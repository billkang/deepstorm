## Context

DeepStorm reef 套件的 `wizard.json` 目前提供 Angular 和 React 两个前端框架变体，通过问答式配置生成对应的编码规范技能（`reef-style-frontend`）、代码生成技能（`reef-gen-frontend`）和代码审查 Agent（`reef-review-frontend`）。每个变体通过 `variants/{framework}/` 目录隔离框架特有内容，通过 `fragments/` 目录提供可组合的技术选型碎片（UI 库、CSS、测试框架、TypeScript 配置）。

当前需要新增 Vue 3 前端变体，复用现有的碎片组合机制和模板渲染系统。

## Goals / Non-Goals

**Goals:**
- 在 `wizard.json` 中注册 Vue 3 框架选项，用户安装时可选择 Vue 作为前端框架
- 新增 Vue 3 编码规范变体（`reef-style-frontend/variants/vue/`），覆盖组合式 API、Ant Design Vue、Pinia、Vue Router、Tailwind CSS
- 新增 Vue 3 代码生成步骤（`reef-gen-frontend/variants/vue/steps.md`）
- 新增 Vue 3 代码审查 Agent（`agents/variants/vue/reef-review-frontend.md`）
- 新增 Ant Design Vue 碎片（`fragments/ui-lib/antd-vue/`），独立于 React 的 Ant Design 碎片
- 新增 Vue 测试碎片（`fragments/test/vitest-vue/`），基于 `@vue/test-utils` + `@testing-library/vue`
- 更新 Vitest 选项的 fragments 配置，框架无关的 `test/vitest` + 框架特定的 `test/vitest-vue`

**Non-Goals:**
- 不修改现有的 Angular 或 React 变体
- 不修改共享的 `.tmpl` 文件（Handlebars 条件块会自动处理 Vue 变量）
- 不涉及后端变体
- 不涉及 CLI 安装流程修改

## Decisions

### Decision 1: 新增独立 Ant Design Vue 碎片（而非复用 React 的 antd 碎片）

**选择：** 创建 `fragments/ui-lib/antd-vue/` 新目录，包含 Ant Design Vue 的组件规范和使用示例。

**理由：** Ant Design 的 React 版（antd v5）和 Vue 版（ant-design-vue v4）虽然设计理念相同，但 API 差异很大：
- React 版使用 JSX 组件：`<Table>`, `<Button>`、CSS-in-JS (cssinjs)
- Vue 版使用 Vue 模板组件：`<a-table>`, `<a-button>`、默认前缀 `a-`
- Vue 版支持 `v-model` 双向绑定、模板指令、slot 作用域插槽等 Vue 特有模式
- 导入方式不同：React 用 `import { Table } from 'antd'`，Vue 通常通过 `unplugin-vue-components` 自动导入

将两者放在同一个碎片中会导致文档混乱。Vue 用户需要一个纯 Vue 语境的参考文档。

**备选方案：** 复用 `fragments/ui-lib/antd/` 并在文档中同时覆盖 React 和 Vue 用法。→ 拒绝，会导致碎片内容膨胀且框架上下文混杂。

### Decision 2: Zustand vs Pinia

**选择：** Pinia 作为 Vue 3 状态管理方案。

**理由：** 
- Pinia 是 Vue 官方推荐的状态管理库（由 Vue 核心团队维护）
- 与 Vue DevTools 深度集成
- 支持 Composition API 风格（setup store）和 Options API 风格
- TypeScript 支持完善
- Zustand 虽然也支持 Vue，但生态和社区支持不如 Pinia

### Decision 3: Vue Test Utils vs @testing-library/vue

**选择：** 两者都覆盖，主推 `@vue/test-utils` 作为单元测试方案，推荐 `@testing-library/vue` 用于集成测试场景。

**理由：**
- `@vue/test-utils`（VTU）是 Vue 官方测试工具库，支持 `mount`/`shallowMount`、`trigger`、`emitted()` 等核心 API
- `@testing-library/vue` 基于 VTU 封装，提供更接近用户行为的查询 API（`getByRole`、`findByText`）
- Vitest + jsdom 是两者共享的运行时环境
- 文件命名约定和目录结构与其他框架变体保持一致

### Decision 4: 代码审查 Agent 使用独立变体文件（而非修改共享 .tmpl）

**选择：** 创建 `agents/variants/vue/reef-review-frontend.md` 作为独立文件，遵循 React 变体的模式。

**理由：** 共享模板 `reef-review-frontend.md.tmpl` 包含了 Angular/PrimeNG 特有的审查条目。修改它为通用模板会增加复杂度。React 已经采用了独立变体文件的模式，Vue 遵循同一模式。

### Decision 5: 构建工具配置

**选择：** `npm create vite@latest` 或 `pnpm create vite`（Vite Vue-TS 模板），安装 `ant-design-vue`、`pinia`、`vue-router`。

**理由：** Vite 是 Vue 官方推荐的构建工具。`wizard.json` 中 Vue 的 `buildTool` 与 React 一样使用 `npx:*`。

### Decision 6: unplugin-vue-components 自动导入

**选择：** 在编码规范中推荐使用 `unplugin-vue-components` 配合 `AntDesignVueResolver` 实现 Ant Design Vue 组件的自动按需导入。

**理由：** 这是 Ant Design Vue 官方推荐的 Vite 集成方式，无需手动 import 每个组件，实现真正的 tree-shaking。`message`、`Modal` 等程序化 API 仍需手动导入。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Ant Design Vue 版本更新可能导致 API 变化 | 碎片文档引用具体版本，定期通过 Context7 更新 |
| Vue 组合式 API 有多种写法风格（Options API vs Composition API） | 强制使用 `<script setup lang="ts">` + 组合式 API，在规范中明确禁止 Options API |
| 用户可能混用 `ref()` 和 `reactive()` 不当 | 在规范中明确 `ref()` 为默认选择，`reactive()` 仅限固定对象 |
| `vue-tsc` 类型检查与 Vite 构建的集成方式 | 在 quick-reference 中提供标准 `build` 脚本配置 |
| Ant Design Vue 和 Tailwind CSS 的样式冲突 | 在规范中提供 Ant Design Vue + Tailwind CSS 共存指南 |

## Template Variables

以下变量将通过 `wizard.json` 的 Vue 选项注入到模板系统：

| 变量路径 | 值 |
|---------|-----|
| `reef.frontend.framework.label` | `Vue 3 + TypeScript + Ant Design Vue + Tailwind CSS 4` |
| `reef.frontend.framework.buildTool` | `npx:*` |
| `reef.frontend.framework.formatCmd` | `npx` |
| `reef.frontend.framework.fileExt` | `*.vue / *.ts` |
| `reef.frontend.framework.sourcePath` | `src/` |
| `reef.frontend.framework.styleRef` | `→ 参考 [Vue 前端速查](quick-reference.md)` |
| `reef.frontend.uiLibrary.value` = `antd-vue` | → styleRef: `→ 参考 [Ant Design Vue 规范](antd-vue.md)` |
| `reef.frontend.test.fragments` | `["test/vitest", "test/vitest-vue"]` |

## Migration Plan

无需迁移。本变体为增量新增，不影响现有 Angular 和 React 用户的安装配置。新用户首次运行 `reef setup` 时即可选择 Vue。
