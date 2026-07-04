# Spring AI 开发规范

## 概述

Spring AI 是 Spring 生态中的 AI 集成框架，提供统一的 API 来调用 LLM、管理对话、构建 RAG 应用。

## 核心概念

### ChatClient
Spring AI 的中央 API，用于与大语言模型交互。

```java
@Bean
ChatClient chatClient(ChatClient.Builder builder) {
    return builder.defaultSystem("你是一个专业的 Java 开发者助手").build();
}
```

**最佳实践：**
- `ChatClient` 声明为 `@Bean` 并注入使用，不直接创建实例
- `defaultSystem()` 设置默认系统提示词
- `builder.clone()` 创建独立的客户端实例（需要不同配置时）

### Tool（函数调用）

AI 模型调用外部工具的能力。

```java
@Tool(description = "获取用户订单信息")
public List<Order> getOrders(@ToolParam(description = "用户 ID") String userId) {
    return orderRepository.findByUserId(userId);
}
```

**最佳实践：**
- 每个 `@Tool` 方法加 `description` 描述，帮助模型选择正确的工具
- `@ToolParam` 的 `description` 帮助模型理解参数含义
- 工具方法放在 `@Service` 类中，统一管理
- 返回值类型明确，避免 `Object` 或泛型丢失

### Advisor（对话链）

构建多步骤的 AI 处理流程。

```java
ChatClientResponse response = chatClient.prompt()
    .advisors(new QuestionAnswerAdvisor(vectorStore, SearchRequest.defaults()))
    .user("查询文档")
    .call()
    .content();
```

**常见 Advisor：**
- `QuestionAnswerAdvisor` — RAG 支持
- `MessageChatMemoryAdvisor` — 对话记忆
- `LoggingAdvisor` — 日志记录

### VectorStore

向量数据库抽象，用于 RAG（检索增强生成）。

```java
@Service
public class DocumentService {
    private final VectorStore vectorStore;

    public DocumentService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public void storeDocuments(List<Document> documents) {
        vectorStore.accept(documents);
    }

    public List<Document> searchSimilar(String query) {
        return vectorStore.similaritySearch(SearchRequest.query(query)
            .withTopK(5));
    }
}
```

**最佳实践：**
- VectorStore 通过 Spring DI 注入，不同实现（PGVector、Redis、Chroma）切换只需改配置
- 文档入库时保留 metadata（来源、更新时间、权限）

### Structured Output（结构化输出）

将 AI 响应映射为 Java 对象。

```java
record WeatherResponse(String city, double temperature, String unit) {}

WeatherResponse weather = chatClient.prompt()
    .user("北京今天天气怎么样？")
    .call()
    .entity(WeatherResponse.class);
```

**最佳实践：**
- 使用 `record` 而非 class 定义输出结构
- 字段类型明确，避免 `String` 滥用

## 配置

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4o
          temperature: 0.7
```

**最佳实践：**
- API Key 始终通过 `${}` 环境变量引用，不硬编码
- 敏感配置放在 `.env` 文件中，不提交到 Git

## DeepSeek

DeepSeek 是一个高性能的国产大语言模型，通过 `spring-ai-starter-model-deepseek` 集成。

### 配置

```yaml
spring:
  ai:
    deepseek:
      api-key: ${DEEPSEEK_API_KEY}
      chat:
        options:
          model: deepseek-chat
          temperature: 0.7
          max-tokens: 2048
```

**可用模型：**
- `deepseek-chat` — 通用对话模型，适用于日常问答、代码生成、内容创作
- `deepseek-reasoner` — 推理模型，适用于复杂推理、数学问题、逻辑分析（通过 API 调用，Spring AI Starter 暂未直接封装）

### 使用示例

```java
@Service
public class AiService {
    private final ChatClient chatClient;

    public AiService(ChatClient.Builder builder) {
        this.chatClient = builder
            .defaultSystem("你是一个专业的 Java 开发者助手")
            .build();
    }

    public String chat(String message) {
        try {
            return chatClient.prompt()
                .user(message)
                .call()
                .content();
        } catch (Exception e) {
            log.error("DeepSeek 调用失败", e);
            return "抱歉，服务暂时不可用";
        }
    }
}
```

### 依赖

```groovy
// build.gradle
implementation 'org.springframework.ai:spring-ai-starter-model-deepseek'
```

或 Maven：
```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-deepseek</artifactId>
</dependency>
```

## 依赖管理

```groovy
// build.gradle
implementation 'org.springframework.ai:spring-ai-openai-spring-boot-starter'
// 如需 RAG
implementation 'org.springframework.ai:spring-ai-pgvector-store-spring-boot-starter'
```

或 Maven：
```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>
```

## 错误处理

```java
try {
    String response = chatClient.prompt().user("查询数据").call().content();
    // 处理响应
} catch (AiException e) {
    log.error("AI 调用失败", e);
    // 降级处理
}
```

**注意事项：**
- AI 调用可能失败或超时，必须有降级逻辑
- 记录 AI 调用的输入和输出，便于调试和审计

## 参考资料

- [Spring AI 官方文档](https://docs.spring.io/spring-ai/reference/)
- 示例文件见 `examples/` 目录
