## 1. CLI 配置注册

- [x] 1.1 更新 `packages/cli/config-schema.json`：`reef.frontend.framework` 枚举增加 `"react"`
- [x] 1.2 更新 `packages/cli/src/types/config.ts`：`framework` 联合类型增加 `'react'`
- [x] 1.3 更新 `packages/reef/wizard.json`：为 `reef.frontend.framework` 添加 React 选项（含 template: label/buildTool/formatCmd/fileExt/sourcePath/styleRef）
- [x] 1.4 更新 `packages/reef/wizard.json`：为 `reef.frontend.uiLibrary` 添加 Ant Design 选项（react 可选的 UI 库，或调整 dependsOn 支持 framework=react）

## 2. React 代码生成变体

- [x] 2.1 创建 `packages/reef/skills/reef-gen-frontend/variants/react/steps.md`：React 专属编码步骤（类型定义 → API Hooks → 组件 → 页面组装），含核心约束和构建命令

## 3. React 编码规范变体

- [x] 3.1 创建 `packages/reef/skills/reef-style-frontend/variants/react/quick-reference.md`：React 编码速查（组件/Hooks/状态管理/Ant Design/路由/错误处理）
- [x] 3.2 创建 `packages/reef/skills/reef-style-frontend/variants/react/examples/entity-types.md`：React 实体类型定义示例
- [x] 3.3 创建 `packages/reef/skills/reef-style-frontend/variants/react/examples/code-wrapping.md`：React/JSX 代码换行规则
- [x] 3.4 创建 `packages/reef/skills/reef-style-frontend/variants/react/examples/forms-layer.md`：React 表单（Ant Design Form + 状态管理）模式
- [x] 3.5 创建 `packages/reef/skills/reef-style-frontend/variants/react/examples/service-routing.md`：React 数据获取层 + React Router 配置示例
- [x] 3.6 创建 `packages/reef/skills/reef-style-frontend/variants/react/examples/component-types-pipes.md`：React 组件模式（HOC、自定义 Hooks 替代 Pipes）

## 4. Ant Design UI 组件库 Fragment

- [x] 4.1 创建 `packages/reef/skills/reef-style-frontend/fragments/ui-lib/antd/quick-reference.md`：Ant Design 5.x 组件使用规范（Table、Form、Modal、Select、DatePicker、Button 等常用组件的最佳实践和注意事项）
- [x] 4.2 创建 `packages/reef/skills/reef-style-frontend/fragments/ui-lib/antd/examples/ui-components.md`：Ant Design 组件代码示例

## 5. React 测试 Fragment (Vitest + React Testing Library)

- [x] 5.1 创建 `packages/reef/skills/reef-style-frontend/fragments/test/vitest-react/quick-reference.md`：React Testing Library 测试规范（组件测试/Hook 测试/Mock/覆盖率）
- [x] 5.2 创建 `packages/reef/skills/reef-style-frontend/fragments/test/vitest-react/examples/testing.md`：React 组件和 Hook 测试代码示例

## 6. React 代码审查 Agent

- [x] 6.1 创建 `packages/reef/agents/variants/react/reef-review-frontend.md`：React 专属审查 Agent（Hooks 规则检查、组件模式合规性、Ant Design 使用审查、性能审查、测试覆盖审查）

## 7. 构建验证

- [x] 7.1 运行 `pnpm build` 重建 registry，确认 React 选项正确注册
- [x] 7.2 验证 wizard.json → registry.json 映射无误，所有 fragments 路径正确
- [x] 7.3 验证 Handlebars 模板渲染正确（检查所有 `{{reef.frontend.*}}` 变量引用）
