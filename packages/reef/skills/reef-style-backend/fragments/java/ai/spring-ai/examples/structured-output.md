# Spring AI 结构化输出示例

## 简单 Record

```java
public record WeatherResponse(String city, double temperature, String unit) {}

// 使用
WeatherResponse weather = chatClient.prompt()
  .user("北京今天天气怎么样？")
  .call()
  .entity(WeatherResponse.class);

log.info("城市: {}, 温度: {}{}", weather.city(), weather.temperature(), weather.unit());
```

## 嵌套结构

```java
public record CodeReviewResult(
  String file,
  List<Issue> issues,
  int score
) {
  public record Issue(
    int line,
    Severity severity,
    String message,
    String suggestion
  ) {
    enum Severity { CRITICAL, WARNING, SUGGESTION }
  }
}

// 使用
CodeReviewResult result = chatClient.prompt()
  .user("""
    审查以下代码:
    ```java
    public class Test {
      public void run() { }
    }
    ```
    """)
  .call()
  .entity(CodeReviewResult.class);
```

## 列表输出

```java
public record TaskList(List<TaskItem> tasks) {
  public record TaskItem(String title, String description, Priority priority) {
    enum Priority { HIGH, MEDIUM, LOW }
  }
}

TaskList tasks = chatClient.prompt()
  .user("将用户需求拆解为开发任务")
  .call()
  .entity(TaskList.class);
```
