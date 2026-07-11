## Why

CLI setup 在选择前端框架后，UI 组件库选择步骤错误地展示了所有框架的组件库（如选择 Angular 时仍显示 Ant Design for React 和 Ant Design Vue），导致用户可能选到与框架不匹配的组件库，配置结果不可用。

## What Changes

- **`WizardOption` 类型扩展**：新增可选 `dependsOn?: string` 字段，支持选项级别的条件过滤
- **`reef.frontend.uiLibrary` 选项增加约束**：PrimeNG 绑定 `angular`、Ant Design (React) 绑定 `react`、Ant Design Vue 绑定 `vue`；"不使用" 选项始终可见
- **`renderAsSingleGroup` 渲染逻辑增强**：当子问题选项包含 `dependsOn` 时，根据当前表单已选值动态过滤选项列表

## Capabilities

### New Capabilities

- `wizard-option-filtering`: Wizard 渲染引擎支持选项级 `dependsOn` 条件过滤，允许 select 问题的选项列表根据同一 group 内其他问题的已选值动态过滤

### Modified Capabilities

<!-- 无现有 capability 的 spec 级别需求变更 -->

## Impact

- `packages/cli/src/types/registry.ts` — WizardOption 接口扩展
- `packages/cli/src/wizard/questionnaire.ts` — renderAsSingleGroup 函数
- `packages/reef/wizard.json` — reef.frontend.uiLibrary 选项
