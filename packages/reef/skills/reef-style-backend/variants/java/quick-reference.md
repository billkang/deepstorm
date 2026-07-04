# 后端编码快速参考

按需加载。仅当你需要编写对应组件类型时阅读相关章节。

> 已安装子维度的规范，通过该维度的 `{value}.md` 文件阅读。本页只包含语言通用的核心规范。
>
> **跨维度规范（适用所有后端代码）：**
> - [API 规范](api-spec.md) — RESTful 命名、统一响应体、OpenAPI、版本策略
> - [依赖管理规范](dependency-management.md) — Version Catalog、版本一致性、CVE
> - [异常处理深度规范](exception-handling.md) — 异常层次、错误码、全局处理
> - [安全红线](security-redlines.md) — P0/P1 安全规则（必须遵守）

## 速查

| 场景 | 决策 |
| --- | --- |
| 字符串格式化 | 用 `formatted()`，不用 `+` 拼接 |
| 类型分发 | 用多态，不用 `instanceof` 链 |
| 控件能力查询 | 基类声明 `abstract boolean supportsXxx()`，子类按能力返回 `true/false` |
| 领域事件 / POJO | `@Getter @AllArgsConstructor`，不手写 getter/constructor |
| 参数顺序 | `appId` → 父级 ID → 自身 ID → name/描述 |
| 字段注释 | Model/Entity/Event 加 `/** */`，DTO/Record 不加 |
| 日志实体 | 继承 `LogEntry`（SINGLE_TABLE），不直接继承基类 |
| 弃用 API | 编译警告中的 `@Deprecated` API 在同一次 PR 中替换为新 API |
| 多行字符串 | 用 Text Block `"""..."""` + `formatted()` 嵌入 JSON/SQL/XML，禁止 `+` 拼接；详见 [code-wrapping.md](examples/code-wrapping.md) |

## 代码风格

### 通用约定

- 变量命名有意义，禁止单字母（循环计数器 `i`/`j`/`k` 除外）
- 局部变量用 `var`
- 字符串格式化用 `formatted()`，不用 `+` 拼接
- 多态替代 `instanceof` 链做类型分发
- 100 列折行，运算符/`.`/`::` 放行首。适用范围如下：
  - **代码结构**（方法调用、签名、表达式）严格执行 100 列
  - **Javadoc / 注释文本**以可读性优先，不硬断中文句子；仅单行 `/** ... */` 标记超长时拆成多行
- **方法调用参数换行**：所有参数能在列宽内一行放完则一行，放不完则每个参数独立一行（不混合分组）；详见 [code-wrapping.md](examples/code-wrapping.md)「方法调用参数换行」
- 类内字段按用途逻辑分组，组间空行分隔，**禁止使用 `// ======`（或其他重复符号装饰）做视觉分隔线注释**。例如应避免 `// ========== 维度信息 ==========` 这种写法
- 注释与代码逻辑块之间：相邻的两个 `// 注释 + 代码块` 之间用空行分隔，使每个逻辑块保持独立。
  ```java
  // ✅ 正确：逻辑块之间有空行
  // PROPORTION → 饼图
  if (queryIntent == QueryIntent.PROPORTION) {
    return ChartType.PIE_CHART;
  }

  // GROUP_BY → 柱状图
  if (queryIntent == QueryIntent.GROUP_BY) {
    return ChartType.BAR_CHART;
  }
  ```
  ```java
  // ❌ 错误：缺少分隔空行，两个逻辑块粘连
  // PROPORTION → 饼图
  if (queryIntent == QueryIntent.PROPORTION) {
    return ChartType.PIE_CHART;
  }
  // GROUP_BY → 柱状图
  if (queryIntent == QueryIntent.GROUP_BY) {
    return ChartType.BAR_CHART;
  }
  ```

### 控件能力声明模式（Capability Pattern）

当实体层次（如 `FormControl` → `TextControl` / `NumberControl` / ...）需要按子类暴露能力时，在抽象基类中声明抽象方法，各子类返回 `true` / `false`：

```java
// FormControl.java — 基类声明
public abstract boolean supportsImporting();

// TextControl.java — 子类声明能力
@Override public boolean supportsImporting() { return true; }

// 其他子类按需返回 false 或 true
@Override public boolean supportsImporting() { return false; }
```

**适用场景：** 基类有多个子类，且某个操作只在部分子类上有意义。
**替代方案：** 用 `instanceof` 判断 → ✗ 不推荐，违反开闭原则，每加一个子类就要改判断链。
**优势：** 开闭原则 — 新增子类只需在自己的类中覆盖方法；新增能力只需在基类加方法 + 各子类实现。

## 字段注释规则

| 文件类型 | 需要 `/** */` 字段注释 |
|---------|----------------------|
| Model / Entity / Event | ✓ 是 |
| DTO / Record | ✗ 否 |

## 领域事件 / POJO

### 规则

- 使用 Lombok `@Getter @AllArgsConstructor`，不手写 getter/constructor
- `private final` 字段，保持不可变
- 参数顺序：`appId` → 父级 ID → 自身 ID → name/描述
- 事件配合 `@EventListener` 实现解耦，Service 层 `publishEvent(event)` 而不是直接调用 Repository

### 示例

```java
@Getter @AllArgsConstructor
public class FormDeletedEvent {
  private final Long appId;
  private final Long formId;
  private final String formTitle;
}
```

## 常见坑

| 场景 | 问题 | 正确做法 |
|------|------|---------|
| `instanceof` 分发 | Service 层用 `instanceof` 链判断所有子类型 | 优先在实体/领域模型中用多态 |
| 控件能力硬编码 | 用 `if (control instanceof TextControl)` 判断是否支持某能力 | 基类加 `abstract boolean supportsXxx()`，子类按能力覆盖 |
| 弃用 API | 编译出现 `@Deprecated` 警告但不处理 | 同一次 PR 中替换为新 API |
