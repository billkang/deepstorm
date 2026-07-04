## Why

@deepstorm/reef 套件目前仅支持 Angular 21 + PrimeNG 作为前端框架变体。React 是当前最主流的前端框架，社区生态完善，且项目 README 中已将 React 列为 planned 方向。增加 React + Ant Design 支持可以让 reef 覆盖更广泛的前端技术栈需求，提升套件的通用性。

## What Changes

- **新增 `react-code-generation` capability**：为 `reef-gen-frontend` skill 增加 React 变体
  - 基于 React 19 + TypeScript 的前端代码生成步骤
  - 引用 Ant Design 5.x 作为 UI 组件库规范
  - 引用 Tailwind CSS 作为样式方案
  - 引用 Vitest + React Testing Library 作为测试方案
- **新增 `react-style-rules` capability**：为 `reef-style-frontend` skill 增加 React 变体
  - React 组件最佳实践（Hooks 规则、组件隔离、状态管理）
  - Ant Design 组件使用规范
  - Tailwind CSS 样式规则
  - Vitest + React Testing Library 测试规范
- **新增 `react-code-review` capability**：为 `reef-review-frontend` agent 增加 React 变体
  - React 专属代码审查要点（Hooks、JSX、性能优化等）
  - Ant Design 组件使用正确性审查
- **CLI 配置注册**：更新 config-schema.json、TypeScript 类型定义、wizard.json、registry.json
- **新增 fragments**：React 特定编码规范碎片（CSS/Tailwind、测试/Vitest、UI/Ant Design、TS 严格模式）

## Capabilities

### New Capabilities
- `react-code-generation`：React 19 前端代码生成能力，涵盖组件、页面、表单、列表等常见场景的生成步骤和规范引用
- `react-style-rules`：React 前端编码规范，涵盖组件模式、Hooks 规则、Ant Design 使用、Tailwind CSS 样式、测试规范
- `react-code-review`：React 前端代码审查能力，定义审查维度、检查点和评分标准

### Modified Capabilities
- （无 — 本次完全新增，不修改已有 capability 的 requriement）

## Impact

| 影响范围 | 变更类型 | 说明 |
|---------|---------|------|
| `packages/reef/skills/reef-gen-frontend/` | 新增 | 增加 `variants/react/` 目录 |
| `packages/reef/skills/reef-style-frontend/` | 新增 | 增加 `variants/react/` 目录及 React 相关 fragments |
| `packages/reef/agents/` | 新增 | 增加 `variants/react/` 目录 |
| `packages/cli/config-schema.json` | 修改 | `reef.frontend.framework` 枚举增加 `"react"` |
| `packages/cli/src/types/config.ts` | 修改 | `framework` 类型增加 `'react'` |
| `packages/reef/wizard.json` | 修改 | 增加 React 技术栈选项及模板映射 |
| `packages/cli/dist/registry.json` | 修改 | 构建产物，需重新构建 |
