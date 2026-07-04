# Brainstorming Session

- **Date:** 2026-07-04
- **Session:** 001
- **Type:** 需求讨论
- **Context:** DeepStorm Flow — 为 reef 套件增加 React + Ant Design 前端变体支持

---

## 参与者

- **User (Bill):** 需求提出方
- **AI (Claude):** 流程引导、现状分析、方案讨论

## 讨论内容

### 背景

DeepStorm 的 `@deepstorm/reef` 套件目前仅支持 Angular 21 + PrimeNG 作为前端框架变体。README 中虽提及 "React, Vue" 为 planned，但零代码实现。本次需求是增加 React 框架 + Ant Design 组件库支持。

### 当前状态

| 组件 | 现有 Angular 版本 | React 计划 |
|------|------------------|-----------|
| 前端代码生成 skill | `reef-gen-frontend/variants/angular/` | 需新增 `variants/react/` |
| 前端编码规范 skill | `reef-style-frontend/variants/angular/` | 需新增 `variants/react/` |
| 前端审查 agent | `reef-agent/variants/angular/` | 需新增 `variants/react/` |
| CLI 配置 schema | `enum: ["angular", "none"]` | 需加 `"react"` |
| wizard.json | 仅 angular 选项 | 需加 react + antd 选项 |
| 类型定义 | `type framework = 'angular' \| 'none'` | 需加 `'react'` |

### 需求澄清 Q&A

| 问题 | 回答 |
|------|------|
| Q: 脚手架还是纯页面/组件生成？ | 纯前端页面/组件生成（不涉及 Next.js 等框架脚手架） |
| Q: React 版本？ | 最新版（React 19） |
| Q: Ant Design 版本？ | 最新版（Ant Design 5.x） |
| Q: 测试方案？ | React 生态推荐方案 → Vitest + React Testing Library |
| Q: 样式方案？ | React 生态最推荐方案 → Tailwind CSS（Ant Design 5.x 兼容） |

### 关键技术决策要点

- 延续现有的 **template + variants + fragments** 架构模式，不引入新架构
- 技术栈：React 19 + TypeScript + Ant Design 5.x + Tailwind CSS + Vitest + React Testing Library
- Babel 转译（Ant Design 5.x 推荐；对应 Angular 的 esbuild/SWC）

### 范围界定

**In Scope:**
- reef-gen-frontend 的 React 变体（生成步骤、规范引用）
- reef-style-frontend 的 React 变体（编码规范、fragments）
- reef-review-frontend 的 React 变体（审查 agent）
- CLI 配置注册（schema、types、wizard、registry）

**Out of Scope:**
- Vue 或其他框架变体（本次只做 React）
- Next.js / Remix 等框架脚手架（纯前端页面）
- Playground 演示项目更新
- 后端代码变体（仅前端）

### 下一步

1. → `/opsx:new reef-react-variant` 创建变更
2. 产出 proposal → specs → design → tasks
3. 检查 superpowers
4. Apply 实现
