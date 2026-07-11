## 1. Type Extension

- [x] 1.1 `WizardOption` 接口新增可选 `dependsOn?: string` 字段（`packages/cli/src/types/registry.ts`）

## 2. Data Fix

- [x] 2.1 `reef.frontend.uiLibrary` 的 PrimeNG 选项添加 `"dependsOn": "angular"`（`packages/reef/wizard.json`）
- [x] 2.2 `reef.frontend.uiLibrary` 的 Ant Design (React) 选项添加 `"dependsOn": "react"`（`packages/reef/wizard.json`）
- [x] 2.3 `reef.frontend.uiLibrary` 的 Ant Design Vue 选项添加 `"dependsOn": "vue"`（`packages/reef/wizard.json`）

## 3. Rendering Logic

- [x] 3.1 `renderAsSingleGroup` 中检测子问题选项是否包含 `dependsOn`，若包含则使用 `({ results }) => ...` 动态函数模式过滤选项（`packages/cli/src/wizard/questionnaire.ts`）
- [x] 3.2 运行现有单元测试确保无回归（`pnpm --filter @deepstorm/cli test`）
