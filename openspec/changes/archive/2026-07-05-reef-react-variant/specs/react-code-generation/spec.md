## ADDED Requirements

### Requirement: React 代码生成步骤
reef-gen-frontend skill 加载后，当检测到 `reef.frontend.framework` 为 `"react"` 时，SHALL 从 `variants/react/steps.md` 读取 React 专属编码步骤并按其顺序引导用户。

#### Scenario: 加载 React 代码生成流程
- **WHEN** reef-gen-frontend skill 被加载，且用户的 `.claude/settings.json` 中 `reef.frontend.framework` 配置为 `"react"`
- **THEN** skill SHALL 引用 `variants/react/steps.md` 作为编码步骤指南

### Requirement: React 组件生成规范
代码生成流程 SHALL 遵循以下 React 19 组件生成规范：

- 使用函数组件 + TypeScript，不生成 Class 组件
- 组件使用默认导出（页面级）或具名导出（通用组件）
- 组件文件命名使用 PascalCase（如 `UserProfile.tsx`）
- 样式文件/方案按项目配置的 CSS 方案生成

#### Scenario: 生成函数组件
- **WHEN** 需要生成一个新 React 组件
- **THEN** 生成的代码 SHALL 使用函数组件模式（``const Component: React.FC<Props> = (...) => { ... }``），不使用 Class 组件

#### Scenario: 生成组件时引用 Ant Design 组件
- **WHEN** 生成的组件需要 UI 组件
- **THEN** 优先使用 Ant Design 5.x 的组件（如 `Button`、`Table`、`Form`、`Modal`、`Select` 等），遵循 Ant Design 设计规范

### Requirement: React 数据获取层生成
代码生成流程 SHALL 根据用户选择的方案生成数据获取层代码。默认推荐 Ant Design Pro 或 React 社区常用的数据获取模式（`fetch`/`axios` + `useState`/`useEffect`）。

#### Scenario: 生成数据获取 Hook
- **WHEN** 需要生成数据获取逻辑
- **THEN** 生成的代码 SHALL 封装为自定义 Hook（如 `useUsers`），分离数据获取与 UI 渲染

#### Scenario: 生成列表页面
- **WHEN** 需要生成包含 Ant Design Table 的列表页面
- **THEN** 生成的代码 SHALL 包含 Table 组件、列定义、分页配置及 loading 状态处理

### Requirement: React 路由生成
当项目配置了路由方案时，代码生成流程 SHALL 按路由最佳实践组织页面组件。

#### Scenario: 生成路由配置
- **WHEN** 生成了多个页面组件
- **THEN** 生成的代码 SHALL 提供 React Router 路由配置（懒加载 `React.lazy` + `Suspense`）

### Requirement: React 表单生成
表单生成 SHALL 使用 Ant Design Form 组件，并结合 React 状态管理方案。

#### Scenario: 生成表单页面
- **WHEN** 需要生成包含 Ant Design Form 的表单页面
- **THEN** 生成代码 SHALL 包含 Form.Item 字段定义、校验规则、提交处理函数及 loading 状态

### Requirement: 构建命令验证
代码生成流程 SHALL 提供 React 项目的快速验证和完整验证命令模板。

#### Scenario: React 项目构建验证
- **WHEN** 代码生成完成，需要验证
- **THEN** 提供的验证命令 SHALL 匹配 React 项目的工具链（如 `npx tsc --noEmit` 类型检查、`npx lint` 代码检查）
