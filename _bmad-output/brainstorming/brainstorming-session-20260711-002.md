# Brainstorming Session — CLI Setup 前端组件库过滤 Bug

**Date:** 2026-07-11
**Type:** Bug fix
**Status:** 已确认方案，进入 OpenSpec

## 背景

CLI setup 命令在选择前端框架（Angular / React / Vue）后，UI 组件库选择步骤展示了所有框架的组件库，而非仅展示所选框架支持的组件库。

## 讨论内容

### 问题定位

用户描述了 bug：选择 Angular 时，除了 PrimeNG 还会显示 Ant Design (React) 和 Ant Design Vue。

### 根因分析

1. **数据层**（`packages/reef/wizard.json`）：`reef.frontend.uiLibrary` 没有与 `reef.frontend.framework` 建立依赖关系
2. **渲染层**（`packages/cli/src/wizard/questionnaire.ts`）：`renderAsSingleGroup()` 中子问题选项无条件渲染，不根据其他子问题的值动态过滤

### 决策

采用选项级 `dependsOn` 方案：

| 变更 | 文件 | 说明 |
|------|------|------|
| `WizardOption` 新增 `dependsOn?: string` | `registry.ts` | 类型扩展 |
| UI 组件库选项添加 `dependsOn` | `wizard.json` | primeng→angular, antd→react, antd-vue→vue |
| `renderAsSingleGroup` 动态过滤 | `questionnaire.ts` | 用表单 results 过滤选项 |

## 下一步

创建 OpenSpec change `fix/cli-setup-ui-library-filter`。
