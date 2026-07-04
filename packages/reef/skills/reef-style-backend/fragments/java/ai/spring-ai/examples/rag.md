# Spring AI RAG 示例

## 向量存储配置

```java
@Configuration
public class VectorStoreConfig {

  @Bean
  VectorStore pgVectorStore(JdbcTemplate jdbcTemplate) {
    return new PgVectorStore(jdbcTemplate, new VectorStoreConfig());
  }
}
```

## 文档入库

```java
@Service
public class DocumentIngestionService {

  private final VectorStore vectorStore;

  @PostConstruct
  public void init() {
    // 应用启动时加载知识库
    loadDocuments("classpath:/docs/coding-standards/");
  }

  public void loadDocuments(String path) {
    var reader = new JsonReader(new FileSystemResource(path));
    List<Document> documents = reader.get();

    // 添加元数据
    documents.forEach(doc -> {
      doc.getMetadata().put("source", "coding-standards");
      doc.getMetadata().put("version", "1.0");
    });

    vectorStore.accept(documents);
    log.info("已加载 {} 份规范文档", documents.size());
  }
}
```

## RAG 查询

```java
@Service
public class RagQueryService {

  private final ChatClient chatClient;
  private final VectorStore vectorStore;

  public String query(String question) {
    return chatClient.prompt()
      .user(question)
      .advisors(new QuestionAnswerAdvisor(
        vectorStore,
        SearchRequest.defaults().withTopK(3)  // 检索 top-3 文档
      ))
      .call()
      .content();
  }
}
```

## 自定义 Advisor

```java
@Component
public class ContextFilterAdvisor implements CallAroundAdvisor {

  @Override
  public String getName() {
    return "ContextFilterAdvisor";
  }

  @Override
  public int getOrder() {
    return 0;
  }

  @Override
  public ChatClientResponse aroundCall(AdvisedRequest request, CallAroundAdvisorChain chain) {
    // 在调用前过滤或增强上下文
    AdvisedRequest filtered = AdvisedRequest.from(request)
      .withSystemText(request.systemText() + "\n注意：仅基于现有文档回答问题，不要编造信息。")
      .build();

    return chain.nextAroundCall(filtered);
  }
}
```
