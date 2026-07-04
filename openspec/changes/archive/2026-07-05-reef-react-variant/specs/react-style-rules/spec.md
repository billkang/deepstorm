## ADDED Requirements

### Requirement: React 组件编码规范
reef-style-frontend skill 在 `react` 框架模式下 SHALL 提供 React 组件编码规范，涵盖函数组件模式、Props 类型定义、Hooks 规则等。

#### Scenario: 函数组件规范
- **WHEN** 加载 reef-style-frontend 且当前框架为 React
- **THEN** 规范文档 SHALL 包含函数组件编写规则：禁止 Class 组件、Props 使用 TypeScript interface 定义、组件使用 PascalCase 命名

#### Scenario: Hooks 规则
- **WHEN** 加载 reef-style-frontend 且当前框架为 React
- **THEN** 规范文档 SHALL 包含 React Hooks 使用规则：仅在顶层调用 Hooks、不 Conditionally 调用 Hooks、自定义 Hook 使用 `use` 前缀命名、正确填写 useEffect 依赖数组

### Requirement: Ant Design 组件使用规范
reef-style-frontend skill SHALL 提供 Ant Design 5.x 组件的使用规范和最佳实践。

#### Scenario: 加载 Ant Design 规范
- **WHEN** 加载 reef-style-frontend 且 UI 库选择为 Ant Design
- **THEN** 规范文档 SHALL 包含 Ant Design 组件使用规则：正确导入（按需导入而非全量导入）、常用组件模式（Table、Form、Modal、Select、DatePicker 等）、Form.Item `name` 与数据字段的对应关系、使用 `validateMessages` 统一管理校验信息

#### Scenario: Ant Design 表单校验
- **WHEN** 使用 Ant Design Form 进行表单校验
- **THEN** 规范 SHALL 要求使用 `rules` 定义校验逻辑，非必要不自定义 `validator`，优先使用内置校验类型

### Requirement: Tailwind CSS 样式规范
reef-style-frontend skill SHALL 提供 React 项目中的 Tailwind CSS 样式规范。

#### Scenario: 样式组织
- **WHEN** React 项目使用 Tailwind CSS
- **THEN** 规范 SHALL 要求：优先使用 Tailwind 原子类而非自定义 CSS、复杂复用模式使用 `@apply` 提取、组件容器宽高用 Tailwind 工具类

#### Scenario: Ant Design + Tailwind 共存
- **WHEN** React 项目同时使用 Ant Design 和 Tailwind CSS
- **THEN** 规范 SHALL 说明：Ant Design 组件样式通过 ConfigProvider 定制，外部布局/间距用 Tailwind，组件内部样式由 Ant Design 管理

### Requirement: Vitest + React Testing Library 测试规范
reef-style-frontend skill SHALL 提供 React 项目的测试规范。

#### Scenario: 组件测试规则
- **WHEN** 编写 React 组件测试
- **THEN** 规范 SHALL 要求：使用 `@testing-library/react` 渲染组件、优先通过用户可见行为（文本/角色）选择元素、测试用户交互行为而非实现细节、对 Ant Design 组件使用 `data-testid` 或 `aria-label` 定位

#### Scenario: Hook 测试规则
- **WHEN** 编写自定义 Hook 测试
- **THEN** 规范 SHALL 要求：使用 `renderHook` 测试 Hook 行为、测试返回值变化、测试异常场景

### Requirement: TypeScript 类型规范
reef-style-frontend skill SHALL 提供 React 项目的 TypeScript 严格模式规范。

#### Scenario: Props 类型定义
- **WHEN** 定义组件 Props
- **THEN** 规范 SHALL 要求：使用 `interface` 而非 `type` 定义 Props 类型（公共 API 用 interface，联合类型用 type）、Props 中不需要 `children` 显式声明（React 18+ 自动处理）
