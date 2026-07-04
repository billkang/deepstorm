# Spring AI ChatClient 示例

## 基础用法

```java
@Configuration
public class AiConfig {

  @Bean
  ChatClient chatClient(ChatClient.Builder builder) {
    return builder
      .defaultSystem("你是一个专业的 Java 后端开发助手")
      .defaultFunctions("getCurrentTime")  // 注册默认工具
      .build();
  }
}
```

## Service 层集成

```java
@Service
public class AiAssistantService {

  private final ChatClient chatClient;

  public AiAssistantService(ChatClient.Builder builder) {
    this.chatClient = builder
      .defaultSystem("""
        你是企业应用开发助手。
        回答问题时：
        1. 引用代码规范
        2. 提供完整的代码示例
        3. 说明设计理由
        """)
      .build();
  }

  /**
   * 生成代码建议
   */
  public String generateSuggestion(String question) {
    return chatClient.prompt()
      .user(u -> u.text("""
        问题是: {question}
        请用 Java + Spring Boot 实现。
        """)
        .param("question", question))
      .call()
      .content();
  }
}
```

## 多轮对话

```java
@Service
public class ConversationService {

  private final ChatClient chatClient;

  public ConversationService(ChatClient.Builder builder) {
    this.chatClient = builder.build();
  }

  public ChatResponse chat(String sessionId, String message) {
    return chatClient.prompt()
      .user(message)
      .advisors(new MessageChatMemoryAdvisor(
        new InMemoryChatMemory(), sessionId, 10  // 保留最近 10 轮
      ))
      .call()
      .chatResponse();
  }
}
```

## 流式响应

```java
@RestController
@RequestMapping("/api/ai")
public class AiController {

  private final ChatClient chatClient;

  @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<String> streamResponse(@RequestBody @Valid ChatRequest request) {
    return chatClient.prompt()
      .user(request.message())
      .stream()
      .content();  // 返回 Flux<String>
  }
}
```
