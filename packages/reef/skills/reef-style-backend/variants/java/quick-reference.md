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
| 多行字符串 | 用 Text Block `"""..."""` + `formatted()` 嵌入 JSON/SQL/XML，禁止 `+` 拼接 |

## 代码风格

### LLM 常犯错误

> 📌 以下规则仅约束 LLM 容易跑偏的地方。LLM 天然写对的内容（命名、代码空行分隔等）不再列出。

- 局部变量优先用 `var`，避免冗余的类型声明
- 字符串格式化用 `formatted()` / Text Block，不用 `+` 拼接
- 用多态 / Abstract Method 替代 `instanceof` 链做类型分发
- 所有控制流语句（`if`/`else`/`for`/`while`/`do`）必须使用大括号 `{}`，禁止省略大括号的单行体（对应 Checkstyle `NeedBraces` 规则）
- 不声明未被使用的局部变量；switch 模式匹配中未被使用的模式变量用 `_`（匿名模式变量）替代命名变量（如 `case UserMessage _ ->`）
- 局部变量声明必须靠近首次使用处（相距 ≤ 3 行）；从方法调用返回值赋值的局部变量用 `final var` 修饰（如 `final var axisDimList = buildAxisDimMapping(...)`），禁止在调用前提前声明可变变量

### Lombok 使用规范

| 组件类型 | 必用注解 | 说明 |
|---------|---------|------|
| 领域事件 / POJO | `@Getter @AllArgsConstructor` | `private final` 不可变，不手写 getter/constructor（见下方示例） |
| JPA Entity | `@Getter @NoArgsConstructor(access = PROTECTED)` + `@SuperBuilder`（按需） | 详见 [Hibernate 规范](hibernate.md) |
| Service / Controller | `@AllArgsConstructor` / `@RequiredArgsConstructor` | 构造函数注入，不用 `@Autowired` 字段注入 |
| 只读 DTO / Record 替代 | `@Value` | 不可变对象，自动生成 equals/hashCode/toString。Record 更简洁时优先用 record |

**禁止事项：**
- `@Data` — 自动生成 `@Setter` 破坏不可变性，且 `@EqualsAndHashCode` 在有 JPA 代理时行为不可预期
- `@Setter` on Entity — 破坏封装，业务状态变更应通过行为方法表达
- `@Autowired` 字段注入 — 必须用构造函数注入

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

## 注释规则

| 文件类型 | 注释要求 |
|---------|---------|
| **Entity** | 类 Javadoc `/** 实体描述 */`；每个字段 `/** 字段含义 */` |
| **DTO / Record** | 类 Javadoc `/** 用途说明 */`；字段不加 `/** */` 注释 |
| **Repository** | 自定义查询方法加 `/** 查询意图、参数含义 */`；简单 CRUD 方法可不加 |
| **Service** | 每个 public 方法加 Javadoc `/** 功能、@param、@return */` |
| **Controller** | 每个端点加 `@Operation(summary=, description=)` 或等价 Javadoc |

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
