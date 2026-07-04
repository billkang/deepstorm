## ADDED Requirements

### Requirement: 提供 DeepSeek application.yml 配置示例
The system SHALL include a complete `application.yml` configuration example for DeepSeek Chat model integration using `spring-ai-starter-model-deepseek` in the quick-reference document.

#### Scenario: DeepSeek 基础配置示例
- **WHEN** 用户查阅 quick-reference.md 中的 DeepSeek 配置章节
- **THEN** 文档中应包含 `spring.ai.deepseek.chat` 命名空间下的 api-key、base-url、model 等配置项示例

### Requirement: 提供 DeepSeek ChatClient 调用示例
The system SHALL include a Java code example demonstrating how to use Spring AI ChatClient with DeepSeek model in the quick-reference document.

#### Scenario: ChatClient 与 DeepSeek 配合使用
- **WHEN** 用户查阅 quick-reference.md 中的 DeepSeek 使用示例
- **THEN** 文档应包含至少一个 ChatClient Bean 注入和调用的代码片段，展示基本的对话请求和响应处理

### Requirement: 提供模型选择说明
The system SHALL include guidance on which DeepSeek model to choose for different use cases in the quick-reference document.

#### Scenario: 模型选择建议
- **WHEN** 用户查阅 quick-reference.md 中的 DeepSeek 章节
- **THEN** 文档应包含 deepseek-chat 等可用模型的用途说明和选择建议
