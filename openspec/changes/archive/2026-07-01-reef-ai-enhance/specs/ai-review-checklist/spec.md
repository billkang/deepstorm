## ADDED Requirements

### Requirement: @Tool 方法必须有 description 描述
The system SHALL verify that all `@Tool`-annotated methods in Spring AI tool callbacks include a meaningful `description` attribute.

#### Scenario: 缺少 description 的 @Tool 方法被标记
- **WHEN** 审查一个 `@Tool` 注解的方法，且该方法没有设置 `description` 属性
- **THEN** 审查报告将该问题标记为 🟡 必须修改（Request Changes）

### Requirement: AI 调用必须有异常处理或降级逻辑
The system SHALL verify that all AI ChatClient / StreamingChatClient 调用包含 try-catch 异常处理或降级（fallback）逻辑。

#### Scenario: AI 调用缺少异常处理
- **WHEN** 审查调用 ChatClient 的代码，且该方法没有 try-catch 包裹 AI 调用
- **THEN** 审查报告将该问题标记为 🟡 必须修改

#### Scenario: AI 调用有降级逻辑
- **WHEN** AI 调用包含 catch 块并实现了 fallback 逻辑（如返回兜底数据、记录错误日志）
- **THEN** 该条视为符合规范，不触发警告

### Requirement: API Key 必须通过环境变量引用
The system SHALL verify that AI API Key 在代码中通过 `${}` 占位符引用 application.yml 中的配置项，而非硬编码字符串。

#### Scenario: API Key 硬编码
- **WHEN** 审查发现 `.env` 或代码中有硬编码的 DeepSeek / OpenAI API Key 值
- **THEN** 审查报告将该问题标记为 🟡 必须修改

### Requirement: ChatClient 必须使用 DI 注入
The system SHALL verify that ChatClient 实例通过构造函数或字段注入（@Autowired）获取，而非通过 `new ChatClient()` 或 `.builder().build()` 直接创建。

#### Scenario: ChatClient 通过 new 创建
- **WHEN** 审查发现代码中使用 `ChatClient.builder().build()` 或 `new ChatClient()` 直接创建实例
- **THEN** 审查报告将该问题标记为 🟡 必须修改

#### Scenario: ChatClient 注入正确
- **WHEN** ChatClient 通过构造函数参数或 @Autowired 字段注入
- **THEN** 该条视为符合规范，不触发警告

### Requirement: Structured Output 应使用 record
The system SHALL verify that Spring AI Structured Output 的响应类型使用 Java `record` 而非 `class`。

#### Scenario: Structured Output 使用 class
- **WHEN** 审查发现 Structured Output 的 response 类型定义为 `class` 而非 `record`
- **THEN** 审查报告将该问题标记为 🟡 必须修改（原因：class 的可变性可能导致反序列化不一致）

### Requirement: AI 调用应记录日志
The system SHOULD verify that AI ChatClient 调用记录了输入参数和输出结果，便于调试和审计。

#### Scenario: AI 调用缺少日志
- **WHEN** 审查 ChatClient 调用代码，且该方法没有对 AI 请求和响应进行日志记录
- **THEN** 审查报告将该问题标记为 🟢 建议（Suggestion）

### Requirement: @Tool 返回值类型应明确
The system SHOULD verify that `@Tool` 方法的返回值类型是明确的具体类型，而非 `Object` 或泛型擦除的类型。

#### Scenario: @Tool 返回 Object
- **WHEN** 审查发现 `@Tool` 方法的返回类型是 `Object`、`Map<String, Object>` 或其他泛型丢失的类型
- **THEN** 审查报告将该问题标记为 🟢 建议（Suggestion）
