# 后端代码折行示例（100 列限制）

Checkstyle 配置行宽 110，折行目标 100 列。

## 方法签名

一行放得下就一行，放不下则每个参数独立一行（4 格缩进）。不与「同行放多个参数」的混合分组混淆：

```java
public FormDetailsDto getForm(Long appId, Long formId) { ... }

public FormDetailsDto publishForm(
    Long appId, Long formId, PublishFormRequest request) { ... }

public FormResponseDto updateFormResponse(
    @PathVariable Long appId,
    @PathVariable Long formId,
    @PathVariable Long responseId,
    @RequestBody UpdateFormResponseRequest request,
    @AuthenticationPrincipal User user) { ... }
```

## Stream 管道

每个算子一行，行首 `.`，4 格缩进（相对方法体 8 格）：

```java
var forms = formRepository.findAllByAppId(appId.getId()).stream()
    .map(FormMapper.INSTANCE::mapToSummary)
    .toList();

var options = response.getRecords().stream()
    .limit(FormExcelUtils.DATASET_PAGE_SIZE)
    .collect(Collectors.toMap(
        record -> String.valueOf(record.get(labelField)),
        record -> new Option(...),
        (existing, _) -> existing));
```

## Builder 模式

每个 `.method()` 一行，4 格缩进（相对方法体 8 格）：

```java
var templateContext = TemplateContext.builder()
    .context(formulaContext)
    .urlQueryParams(request.getUrlQueryParams())
    .build();

var csvMapper = CsvMapper.builder()
    .enable(CsvParser.Feature.TRIM_SPACES)
    .addModule(new SimpleModule().addDeserializer(
        boolean.class, new CsvBooleanDeserializer()))
    .build();
```

## 注解

单属性一行。多属性 `uses` 每个一行：

```java
@Pattern(
    regexp = "[a-zA-Z_][a-zA-Z0-9_]*",
    message = "字段名称只能包含字母、数字和下划线")

@Mapper(
    config = MapStructConfig.class,
    uses = { FormRevisionMapper.class, FormItemMapper.class, PrintConfigMapper.class })
```

## Constructor / new 调用

参数放不下则每行一个（4 格缩进）：

```java
var user = new InternalUser(
    request.getUsername(),
    passwordEncoder.encode(request.getPassword()),
    request.getFullName(),
    request.getRole());

var items = importedItems.stream()
    .map(item -> new DictionaryItem(
        null, item.getCode(), item.getValue(), item.isDisabled(), dict.getId()))
    .toList();
```

## 方法调用参数换行

所有参数在 100 列内能一行放完则一行，放不完则每个参数独立一行。不与 Google 风格的「混合分组」（几个参数一行、最后一个另起一行）混淆：

```java
// ✓ 正确：参数少，一行放得下
var result = MetricAnswer.found("急诊人次", "C001", "急诊人次", 1500, "人次", dateRange);

// ✓ 正确：参数较多且一行放不下，每个参数独立一行
var result = MetricAnswer.foundWithGrid(
    query.metricName(),
    matched.code(),
    name,
    apiGridResults,
    apiLastGridResults,
    apiChainGridResults,
    dateRange,
    chartType,
    unresolvedDimensions);

// ✓ 正确：静态工厂方法同理
return MetricAnswer.foundWithComparison(
    query.metricName(),
    matched.code(),
    name,
    result.getValue(),
    result.getUnit(),
    lastResults,
    chainResults,
    dateRange,
    chartType);

// ✗ 错误：混合分组，一行的结尾参数和后续参数混在一起
return MetricAnswer.foundWithGrid(
    query.metricName(), matched.code(), name,      // ← 混在同一行
    apiGridResults, apiLastGridResults, apiChainGridResults,  // ← 混在同一行
    dateRange, chartType);                           // ← 混在同一行
```

## `new ResponseEntity<>()` 换行 / `if` 条件

```java
return new ResponseEntity<>(
    new CustomError(Status.NOT_FOUND, ex.getMessage(), ex.getResourceInfo()),
    HttpStatus.NOT_FOUND);

if (control instanceof ChoiceControl choiceControl
    && choiceControl.getOptionsSource() instanceof DatasetOptionsSource source) {
```

## `.orElseThrow()` / `formatted()`

```java
return repository.findByIdAndAppId(id, appId).orElseThrow(
    () -> new NotFoundException("资源不存在", new ResourceInfo("MyEntity", id)));

return "jdbc:oracle:thin:@//%s:%d/%s?connectTimeout=%d".formatted(
    getHost(), getPort(),
    URLEncoder.encode(getDbName(), StandardCharsets.UTF_8),
    TIMEOUT_SECONDS * 1000);
```

## Try-with-resources / Lambda

```java
try (var inputStream = file.getInputStream();
    var reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8)) {
  ...
}

Function<FieldAssignment, TextValue> valueMapper =
    assignment -> new TextValue(TemplateEngines.SIMPLE.evaluate(...));

components.forEach(component -> {
  if (!existingKeys.add(component.getKey())) {
    throw new InvalidArgumentException("key 必须唯一");
  }
});
```

## 链式调用（MockMvc / Mockito）

```java
var result = mvc.perform(get("/api/v1/apps")
        .contentType(MediaType.APPLICATION_JSON))
    .andExpect(status().isOk())
    .andReturn();

when(service.publishForm(
    eq(1L), eq(2L), any(PublishFormRequest.class)))
    .thenReturn(FormMapper.INSTANCE.mapToDetails(form));
```

## Text Block（三引号多行字符串）

Java 15+ 的 Text Block 用于嵌入 JSON / SQL / XML / 模板等 DSL。缩进规则依赖 `closing """` 的位置：

```java
// ✅ opening """ 后直接换行，内容相对 opening 行缩进 4 格
// ✅ closing """ 决定 stripIndent() 的公共缩进基线
var json = """
    {
      "name": "example",
      "value": 42,
      "items": [1, 2, 3]
    }
    """;

// ✅ 嵌入 SQL：closing """ 与 SQL 内容的公共缩进最左列对齐
var sql = """
    SELECT u.id, u.name, r.role_name
    FROM users u
    JOIN user_roles r ON r.user_id = u.id
    WHERE u.status = 'ACTIVE'
    ORDER BY u.name
    """;

// ✅ 配合 formatted() 做变量替换
var message = """
    Hello %s,
    Your order #%d has been confirmed.
    """.formatted(userName, orderId);

// ✅ 空行可用 \s 占位避免 stripIndent 清空：
var json = """
    {
      "title": "test",
    \s
      "description": ""
    }
    """;
```

**规范：**
- `"""` 必须后跟换行，**禁止在同行放内容**
- `closing """` 的缩进决定公共缩进基线，放在最后一行内容之下，与之缩进对齐
- 禁止 text block 与 `+` 拼接混用；需要变量替换统一用 `formatted()`
- 短字符串（≤ 100 列单行）不使用 text block，直接使用普通字符串
- `\s` 用于显式保留 text block 中的空行（避免 `stripIndent()` 把空行清空）
```
