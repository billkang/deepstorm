# wizard-option-filtering

## Purpose

提供 Wizard 渲染引擎的选项级条件过滤能力，允许 select 问题的选项列表根据同一 group 表单中其他问题的已选值动态过滤。

## Requirements

### Requirement: Wizard options support conditional filtering based on parent question value

Wizard select 问题中的选项 SHALL 支持可选的 `dependsOn` 字段。当设置时，该选项仅在当前 group 表单中存在匹配 `dependsOn` 值的已选结果时才展示。

#### Scenario: Framework selection filters UI library options

- **WHEN** 用户在 `reef.frontend.framework`（select 问题）中选择 "angular"
- **THEN** `reef.frontend.uiLibrary`（select 问题）的选项列表中仅展示 `dependsOn` 为 "angular" 或无 `dependsOn` 的选项

#### Scenario: Unrestricted options always visible

- **WHEN** 一个选项未设置 `dependsOn` 字段
- **THEN** 该选项始终在 select 列表中可见，不受任何父问题选择影响

#### Scenario: Multiple options share same dependsOn value

- **WHEN** 同一父问题值对应多个子问题选项（如未来扩展多个 React 组件库选项都设置 `dependsOn: "react"`）
- **THEN** 所有匹配的选项都展示，不匹配的选项被过滤

#### Scenario: Options without dependsOn remain unaffected

- **WHEN** 一个 question 的所有选项均未设置 `dependsOn`
- **THEN** 该 question 的渲染行为与修改前完全一致（所有选项静态展示）
