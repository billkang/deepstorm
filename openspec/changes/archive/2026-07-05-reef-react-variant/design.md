## Context

`@deepstorm/reef` 套件目前前端仅支持 Angular 21 + PrimeNG 技术栈。本次变更为 reef 增加 React 19 + Ant Design 前端变体支持。

### 当前架构

reef 的前端支持采用 **template + variants + fragments** 三层架构：

```
skills/reef-gen-frontend/SKILL.md.tmpl    → Handlebars 模板，使用 {{reef.frontend.*}} 变量
  variants/angular/steps.md                → Angular 专属编码步骤
skills/reef-style-frontend/SKILL.md.tmpl   → 风格规范模板
  variants/angular/quick-reference.md       → Angular 编码速查
  variants/angular/examples/                → Angular 示例代码（5 个文件）
  fragments/css/tailwind/                   → Tailwind CSS 规范（框架无关）
  fragments/test/vitest/                    → Vitest + Testing Library for Angular
  fragments/ts-config/strict/               → TypeScript 严格模式（框架无关）
  fragments/ui-lib/primeng/                 → PrimeNG 组件使用规范
agents/reef-review-frontend.md.tmpl         → 前端代码审查 agent 模板
  variants/angular/reef-review-frontend.md   → Angular 编译产物
```

**wizard.json** 中的框架选项控制模板渲染变量：

```json
{
  "value": "angular",
  "template": {
    "label": "Angular 21 + TypeScript + Signal + PrimeNG + Tailwind CSS 4",
    "buildTool": "pnpm:*",
    "formatCmd": "pnpm",
    "fileExt": "*.component.ts / *.service.ts / *.ts",
    "sourcePath": "src/main/web/",
    "styleRef": "→ 参考 [Angular 前端速查](quick-reference.md)"
  }
}
```

### 关键约束

- 沿用现有架构模式，不引入新架构
- 前端选项目前 `enum: ["angular", "none"]`，需要新增 `"react"`
- 已有 `reef.frontend.uiLibrary` 问题（dependsOn: angular），需调整以支持 React + Ant Design

## Goals / Non-Goals

**Goals:**
- 在 reef 中新增 React 19 前端框架变体，与现有 Angular 变体并行
- 支持 Ant Design 5.x 作为 React 的 UI 组件库
- 支持 Tailwind CSS 作为样式方案（与 Angular 共享）
- 支持 Vitest + React Testing Library 作为测试方案
- 更新 CLI 配置注册，使用户可通过向导选择 React 技术栈
- 前端代码审查 agent 支持 React 代码审查维度

**Non-Goals:**
- 不涉及 Vue 或其他前端框架支持
- 不涉及 Next.js、Remix 等框架脚手架（纯前端页面/组件生成）
- 不修改 Playground 演示项目
- 不修改已有 Angular 变体结构
- 不涉及后端代码变体
- 不涉及 E2E 测试框架（已有 Playwright，框架无关）

## Decisions

### D1. 新增 `fragments/ui-lib/antd/` 而非修改现有 primeng fragments

| 选项 | 决策 |
|------|------|
| 复用 primeng 目录加条件判断 | ❌ 两个组件库 API/模式差异大，条件判断会增加模板复杂度 |
| **新增 `fragments/ui-lib/antd/`** | ✅ 完全独立，互不影响，与现有 primeng 对称 |

### D2. 新增 `fragments/test/vitest-react/` 而非修改通用 vitest fragments

| 选项 | 决策 |
|------|------|
| 在当前 vitest 中加 React Testing Library 内容 | ❌ Angular Testing Library 和 React Testing Library API 不同，混杂不易维护 |
| **新增 `fragments/test/vitest-react/`** | ✅ 保持现有 vitest/ 对 Angular 不变，新增 vitest-react/ 给 React |

### D3. Frontend framework 枚举直接新增 `"react"`，而非拆分子类型

| 选项 | 决策 |
|------|------|
| 将 framework 改为对象类型（含子框架如 csr/ssr） | ❌ 过度设计，当前只需纯前端生成 |
| **直接新增 `"react"` 枚举值** | ✅ 保持与 `"angular"` 对称，简单直接 |

### D4. React 代码生成步骤结构

React 遵循纯函数组件 + Hooks 模式（非 Class 组件），步骤分为：

1. **类型定义** — `interface`/`type` 类型定义
2. **API Hooks** — 使用 `fetch`、`axios` 或 `@tanstack/react-query` 的自定义 Hooks（注意：`@tanstack/react-query` 是 React 生态最推荐的数据获取方案，但用户未明确指定，作为可选推荐，生成步骤中保持灵活）
3. **组件** — 函数组件 + Hooks，Ant Design 组件
4. **页面组装** — 组合组件形成页面

### D5. 前端代码生成步骤留在 `variants/react/steps.md`

沿用 Angular 同等位置的 `steps.md` 文件，保证架构对称。

### D6. CSS + Tailwind fragments 复用现有内容

Tailwind CSS 是框架无关的。`fragments/css/tailwind/` 可直接复用，无需复制。

### D7. TypeScript Strict fragments 复用现有内容

同样框架无关，直接复用 `fragments/ts-config/strict/`。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Ant Design 5.x 使用 CSS-in-JS（`@ant-design/cssinjs`），与 Tailwind CSS 可能有样式冲突 | 实际冲突少；现有 Angular 也有 PrimeNG + Tailwind 并行模式 | 在 quick-reference 和 Ant Design fragments 中增加样式共存指引 |
| 用户选择 React 后，现有 Angular 代码生成的精度可能下降 | 仅影响新项目配置 | React 是独立选项，不干扰已有 Angular 配置 |
| `wizard.json` 的 `dependsOn: { key: "reef.frontend.framework", value: "angular" }` 对 uiLibrary 只支持单一值 | UI 库问题只对 Angular 显示，React 用户看不到 Ant Design 选择 | 方案：为 React 新增独立的 uiLibrary 问题组，或者改进 dependsOn 支持多值（取决于 wizard 实现） |
| 现有 vitest fragments（Testing Library for Angular）与 React Testing Library 的 API 差异被忽视 | 开发者引用了错误的测试示例 | 通过 `fragments/test/vitest-react/` 完全隔离，不会混淆 |
| `dist/registry.json` 由构建生成，修改 `wizard.json` 和添加文件后必须重新 build | 构建可能失败或遗漏 | 在 tasks 中明确包含构建验证步骤 |
