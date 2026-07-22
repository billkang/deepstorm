# wizard-option-filtering Delta

## ADDED Requirements

### Requirement: AI 框架可用性过滤
Wizard 渲染引擎 SHALL 支持根据所选语言过滤 AI 集成选项。每个后端语言在 wizard.json 中声明可用 AI 框架列表，引擎根据此列表动态过滤。

#### Scenario: 语言声明 AI 框架可用性
- **WHEN** 用户选择了 Java 作为后端语言
- **THEN** Wizard 引擎读取 Java 的 `availableAiFrameworks` 定义（`["spring-ai"]`）
- **THEN** `reef.backend.java.details` 中的 AI 集成问题仅展示 `spring-ai` 选项

- **WHEN** 用户选择了 Node.js 作为后端语言
- **THEN** Wizard 引擎读取 Node.js 的 `availableAiFrameworks` 定义（`["claude-agent-sdk"]`）
- **THEN** `reef.backend.nodejs.details` 中的 AI 集成问题仅展示 `claude-agent-sdk` 选项

- **WHEN** 用户选择了 Python 作为后端语言
- **THEN** Wizard 引擎读取 Python 的 `availableAiFrameworks` 定义（`[]`）
- **THEN** `reef.backend.python.details` 中的 AI 集成子问题 SHALL 不展示

#### Scenario: 可用 AI 框架列表为空时隐藏整组子问题
- **WHEN** 一个语言变体的 `availableAiFrameworks` 为 `[]`
- **THEN** 该语言的 AI 集成子问题 SHALL 完全不可见
- **THEN** 该语言的详情组中不占用 UI 空间

### Requirement: 二维模型选项依赖规则
AI 集成选项与语言选项之间的依赖关系 SHALL 在 wizard.json 中通过选项级 `dependsOn` 声明。

#### Scenario: AI 框架依赖于语言选择
- **WHEN** `claude-agent-sdk` 选项的 `dependsOn` 设置为 `"reef.backend.language": "nodejs"`
- **THEN** 该选项仅在用户选择了 Node.js 时可见
- **WHEN** `spring-ai` 选项的 `dependsOn` 设置为 `"reef.backend.language": "java"`
- **THEN** 该选项仅在用户选择了 Java 时可见
