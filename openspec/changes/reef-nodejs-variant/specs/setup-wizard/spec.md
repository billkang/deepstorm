# setup-wizard Delta

## ADDED Requirements

### Requirement: 后端语言选项增加 Node.js
CLI SHALL 在 `reef.backend.language` 选择中增加 `nodejs` 选项，支持用户选择 Node.js 作为后端语言。

#### Scenario: Node.js 语言选项
- **WHEN** 用户运行 `deepstorm setup` 并选择 reef
- **AND** 在 backendl language 问题中展示选项
- **THEN** 选项列表包含 "Node.js (NestJS)" 作为后端语言选项
- **THEN** user 选择 Node.js 后，进入 `reef.backend.nodejs.details` 子问题组

### Requirement: Node.js 语言详细配置
CLI SHALL 支持 `reef.backend.nodejs.details` 配置组，包含框架、ORM、AI 集成、测试等子问题。

#### Scenario: Node.js 子问题定义
- **WHEN** 用户选择了 Node.js 作为后端语言
- **THEN** `reef.backend.nodejs.framework` SHALL 展示选项：NestJS / none
- **THEN** `reef.backend.nodejs.orm` SHALL 展示选项：Prisma / none
- **THEN** `reef.backend.nodejs.aiIntegration` SHALL 展示选项：Claude Agent SDK / none
- **THEN** `reef.backend.nodejs.test` SHALL 展示选项：Jest / none
- **THEN** 所有选项 SHALL 包含 `value: "none"` 的兜底选项

### Requirement: AI 集成选项按语言可用性过滤
CLI SHALL 在展示 AI 集成选项时，根据语言的可用 AI 框架列表动态过滤。

#### Scenario: Node.js 展示 Claude Agent SDK
- **WHEN** 用户选择了 Node.js
- **THEN** AI 集成选项 SHALL 显示 "Claude Agent SDK" 作为可用框架
- **AND** 该选项标记为 `ai: true` 以与普通 framework 选项区分

#### Scenario: Python 不展示 AI 集成
- **WHEN** 用户选择了 Python
- **THEN** Python 的 AI 集成子问题 SHALL 隐藏（不可见）
- **AND** 不展示任何 AI 框架选项
