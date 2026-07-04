## ADDED Requirements

### Requirement: React 代码审查 agent
系统 SHALL 在 `reef-review-frontend` agent 中提供 React 专属变体，当检测到 `reef.frontend.framework` 为 `"react"` 时使用。

#### Scenario: 加载 React 审查 agent
- **WHEN** reef-review-frontend agent 被调用，且项目配置为 React
- **THEN** 审查器 SHALL 从 `variants/react/reef-review-frontend.md` 加载 React 专属审查规则

### Requirement: React 代码审查维度
React 审查 agent SHALL 涵盖以下审查维度：

- 组件模式合规性（函数组件、Props 类型、JSX 正确性）
- Hooks 使用正确性（依赖数组完整性、禁止条件性调用、自定义 Hook 命名）
- 状态管理合理性和性能（不必要的重渲染、useCallback/useMemo 的正确使用）
- Ant Design 组件使用正确性
- 测试覆盖充分性

#### Scenario: Hooks 依赖审查
- **WHEN** 审查包含 `useEffect`、`useCallback` 或 `useMemo` 的代码
- **THEN** 审查器 SHALL 检查依赖数组是否包含所有闭包内使用的响应值，遗漏依赖标记为 🟡（必须修改）

#### Scenario: 组件性能审查
- **WHEN** 审查 React 组件代码
- **THEN** 审查器 SHALL 检查：回调函数是否不必要的内联定义（建议 `useCallback`）、重型计算是否用 `useMemo` 缓存、大型列表是否缺少 `key` 或 `key` 使用 index

#### Scenario: Ant Design 使用审查
- **WHEN** 审查包含 Ant Design 组件的代码
- **THEN** 审查器 SHALL 检查：Form.Item `name` 是否与数据模型匹配、Table 的 `columns` 定义是否合理、Modal 关闭后状态是否重置、组件是否按需导入

### Requirement: React 审查报告格式
审查报告 SHALL 按严重程度分三级输出结果。

#### Scenario: 输出审查报告
- **WHEN** 审查完成
- **THEN** 报告 SHALL 包含 🔴 (Block - 必须修复)、🟡 (Request Changes - 建议修改)、🟢 (Suggestion - 优化建议) 三级问题分类，每项标注文件路径和行号
