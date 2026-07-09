## ADDED Requirements

### Requirement: 后端抽象基类使用 @JsonTypeInfo 定义 discriminator

当后端需要根据类型字段分发到不同子类时，MUST 使用 Jackson `@JsonTypeInfo` 定义抽象基类作为 discriminator 入口。

- 使用 `use = JsonTypeInfo.Id.SIMPLE_NAME` 以子类名作为 discriminator value
- 使用 `property = "type"` 作为 JSON 中 discriminator 字段名（简短通用，不与具体业务命名冲突）
- 抽象基类 MUST 使用 `@JsonSubTypes` 列出所有已注册的子类
- 每个 `@JsonSubTypes.Type.value` 为子类 class，`name` 为子类简名（如 `"MetricCardView"`）

#### Scenario: 定义图表视图抽象基类

- **WHEN** 系统需要定义一组可视化图表的多态类型
- **THEN** 创建抽象基类 `ChartView`，标注 `@JsonTypeInfo(use = Id.SIMPLE_NAME, property = "type")` 和 `@JsonSubTypes`，列出所有子类

#### Scenario: 新增子类类型

- **WHEN** 需要新增一种图表类型
- **THEN** 开发者新建子类继承抽象基类，并在基类的 `@JsonSubTypes` 中注册新子类
- **THEN** 无需修改枚举或 switch 分发逻辑

### Requirement: 后端子类通过继承实现具体视图

每个具体视图 MUST 继承自抽象基类，使用构造器注入（或 builder）初始化不可变字段。字段命名满足 Code Style 要求时优先不标注 `@JsonProperty`，格式需要解耦时使用 `@JsonProperty` 指定 JSON 字段名。

#### Scenario: 定义指标卡视图

- **WHEN** 需要定义一个指标卡视图 `MetricCardView`
- **THEN** 创建 `MetricCardView extends ChartView`，定义 `title`、`value`、`unit` 等字段
- **THEN** 无需在类级别额外标注类型标识

#### Scenario: JSON 字段名与 Java 字段名不同

- **WHEN** JSON 字段名 `xAxisName` 不符合 Java 字段命名规范（如 Checkstyle `ParameterNameCheck`）
- **THEN** 使用 `@JsonProperty("xAxisName") private String categoryAxisLabel` 解耦
- **THEN** getter 名可以为 `getCategoryAxisLabel()`，保持 Java Bean 规范合规

### Requirement: 前端定义匹配的 Discriminated Union 类型

前端 MUST 定义与后端 discriminator value 严格对应的 Discriminated Union 类型，以支持 TypeScript 的类型窄化。

- 联合类型 SHOULD 通过 `type` 字段作为 discriminator property
- 每个接口的 `type` MUST 是字符串 literal type，值为后端 `@JsonSubTypes.Type.name` 完全一致

#### Scenario: 定义图表视图联合类型

- **WHEN** 后端定义了 `ChartView` 基类及子类
- **THEN** 前端创建 `type ChartView = MetricCardView | LineChartView | BarChartView | PieChartView`
- **THEN** 每个子接口使用 `type: 'MetricCardView'` 等 literal type

#### Scenario: 使用联合类型消费接口数据

- **WHEN** Angular 模板需要根据 `answer.chartView.type` 分发渲染组件
- **THEN** 使用 `@switch (answer.chartView.type)` + `@case ('MetricCardView')` 模式
- **THEN** TypeScript 编译器自动窄化联合类型，提供正确的类型提示

### Requirement: 前后端 discriminator value 严格一致

后端 `@JsonSubTypes.Type.name` 与前端 TypeScript 接口的 `type` literal value MUST 完全相同（大小写敏感）。

#### Scenario: 维护前后端一致性

- **WHEN** 后端注册 `@JsonSubTypes.Type(value = PieChartView.class, name = "PieChartView")`
- **THEN** 前端 `interface PieChartView` 的 `type` MUST 为 `'PieChartView'`
- **THEN** 两者字符串完全匹配，大小写敏感

### Requirement: 共享 DTO 提取为独立类型

当多个子类复用同一数据结构时，SHOULD 将共享类型提取为独立的 `record` 或类定义，避免重复定义。

#### Scenario: 提取图表数据点

- **WHEN** `LineChartView` 和 `BarChartView` 都需要 `List<ChartDataPoint> dataPoints`
- **THEN** 定义 `public record ChartDataPoint(String name, Number value)` 为独立类型
- **THEN** 子类中引用该共享类型

### Requirement: Decoder 接口字段替换为多态字段

当接口响应中包含类型分发的字段时，MUST 使用多态抽象基类替换原有的枚举类型字段。

#### Scenario: 替换 chartType 枚举字段

- **WHEN** `MetricAnswer` record 中原有 `ChartType chartType` 字段
- **THEN** 替换为 `ChartView chartView`，类型从枚举改为多态抽象基类
- **THEN** 序列化时自动产出 `"chartView": {"type": "MetricCardView", ...}` 结构

### Requirement: 空值安全保护

当接口响应中多态字段可能为 null（如错误响应场景）时，MUST 在前端模板中判空保护，允许后端返回 null。

#### Scenario: 前端判空

- **WHEN** 后端错误响应导致 `chartView` 为 null
- **THEN** 前端模板使用 `@if (answer.chartView)` 包裹 `@switch` 分发
- **THEN** `chartView` 为 null 时不会触发渲染异常

### Requirement: 保留旧数据层，多态字段为增量视图抽象

多态字段（`chartView`）SHOULD 作为增量视图抽象存在，不替代现有的数据层 DTO 字段。旧的数据结构（如 `chartData`、`gridResults`、`singleResults`）SHOULD 保留不动。

#### Scenario: 向后兼容

- **WHEN** 前端已有基于 `chartData` 的渲染逻辑
- **THEN** `chartData`、`gridResults`、`singleResults` 等字段保持原有结构和语义
- **THEN** `chartView` 仅作为视图层分发抽象，不影响数据层

### Requirement: 删除枚举类型前确认无引用

删除原有枚举类型前 MUST 确认项目范围内无其他引用（包括但不限于 Java 源码、Switch 语句、测试文件、前端类型定义）。

#### Scenario: 枚举迁移前确认

- **WHEN** 决定删除 `ChartType` 枚举文件
- **THEN** 搜索所有 Java 文件、TypeScript 文件中该枚举的引用
- **THEN** 仅当 0 个跨模块引用时才可删除
