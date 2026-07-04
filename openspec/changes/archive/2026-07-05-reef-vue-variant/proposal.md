## Why

DeepStorm reef 目前支持 Angular 和 React 前端变体，缺少 Vue 3 生态支持。Vue 是国内最流行的前端框架之一，添加 Vue 变体可以覆盖大量前端开发团队的规范生成、代码审查和测试需求。

## What Changes

- **wizard.json**：在 `reef.frontend.framework` 选项中新增 Vue 3 框架入口，在 UI 组件库选项中新增 Ant Design Vue 入口
- **Vue 编码规范**：在 `reef-style-frontend` 中新增 Vue 3 变体目录，包含组合式 API、`<script setup>`、Pinia 状态管理、Vue Router 路由、Ant Design Vue 组件库、Tailwind CSS 的完整编码规范
- **Vue 代码生成**：在 `reef-gen-frontend` 中新增 Vue 3 编码步骤（类型定义 → 组合式函数 → 组件 → 路由）
- **Vue 代码审查**：新增 Vue 3 专用代码审查 Agent，覆盖 Vue 特有规则（ref/reactive 使用、组合式函数、生命周期、模板指令）
- **Ant Design Vue 碎片**：新增 Vue 版 Ant Design 组件库碎片（`ui-lib/antd-vue/`），独立于 React 的 Ant Design 碎片
- **测试碎片**：在 Vitest 选项中新增 `test/vitest-vue` 碎片，包含 Vue Test Utils + @testing-library/vue 测试规范

## Capabilities

### New Capabilities
- `vue-code-generation`: Vue 3 前端代码生成变体，包含 wizard.json 配置注册、gen-frontend 编码步骤（类型定义 → 组合式函数 → 组件 → Vue Router 页面组装）
- `vue-style-rules`: Vue 3 前端编码规范，覆盖 `<script setup lang="ts">`、组合式 API、Ant Design Vue、Pinia、Vue Router、Tailwind CSS、TypeScript 严格模式
- `vue-code-review`: Vue 3 前端代码审查 Agent，覆盖 Vue 响应式规则、模板指令、组件设计、Ant Design Vue 使用规范

### Modified Capabilities
- 无修改现有 capability

## Impact

| 模块 | 影响 |
|------|------|
| `packages/reef/wizard.json` | 新增 Vue 框架选项 + Ant Design Vue UI 库选项 + test/vitest-vue 碎片注册 |
| `packages/reef/agents/variants/vue/reef-review-frontend.md` | **新增** Vue 专用审查 Agent |
| `packages/reef/skills/reef-gen-frontend/variants/vue/steps.md` | **新增** Vue 编码步骤 |
| `packages/reef/skills/reef-style-frontend/variants/vue/` | **新增** Vue 编码规范（quick-reference.md + examples/） |
| `packages/reef/skills/reef-style-frontend/fragments/ui-lib/antd-vue/` | **新增** Ant Design Vue 碎片 |
| `packages/reef/skills/reef-style-frontend/fragments/test/vitest-vue/` | **新增** Vue 测试碎片 |
| `openspec/specs/` | 同步 3 个新 capability specs |
