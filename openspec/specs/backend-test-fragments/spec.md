# backend-test-fragments Specification

## Purpose

Defines the requirements for backend test code-style fragments: JUnit5 (L2), Spring MVC Test (L3), Spring Service Test (L3), and DataJPA Test (L3). Each fragment produces a `quick-reference.md` and optional `examples/`.
## Requirements
### Requirement: 每个后端 fragment 的通用结构

每个后端测试 fragment SHALL 包含一个 `quick-reference.md` 文件，可选的 `examples/` 目录。

#### Scenario: quick-reference.md 结构
- **WHEN** 创建或更新后端测试 fragment 的 quick-reference.md
- **THEN** 文件 SHALL 以标题和简短概述开头
- **THEN** 文件 SHALL 包含技术选型理由（"为什么用这个而不是替代方案"）
- **THEN** 内容 SHALL 以完整代码示例为主，规则说明为辅
- **THEN** L1 语言相关约定（文件命名、目录结构、断言风格）SHALL 放在 L2 fragment（junit5）的 quick-reference.md 开头

### Requirement: junit5 fragment（L2）

junit5 fragment SHALL 覆盖 JUnit 5 作为单元测试框架的核心用法。

#### Scenario: 基础注解
- **WHEN** 编写 JUnit5 quick-reference.md
- **THEN** SHALL 包含 `@Test`、`@BeforeEach`、`@AfterEach`、`@BeforeAll`、`@AfterAll` 的用途说明和示例
- **THEN** 依赖声明在 LLM 上下文自动可推，不强制包含在 fragment 中

#### Scenario: 断言风格
- **WHEN** 编写断言部分
- **THEN** SHALL 推荐 AssertJ 的流畅断言 API（`assertThat(x).isEqualTo(y)`）优先于 JUnit 原生断言
- **THEN** SHALL 提供常见断言示例（equalTo、isNull、containsExactly、extracting、tuple）

#### Scenario: 参数化测试
- **WHEN** 需要参数化测试
- **THEN** SHALL 展示 `@ParameterizedTest` + `@ValueSource` / `@CsvSource` / `@MethodSource` 的用法
- **THEN** SHALL 包含参数化测试覆盖边界条件的示例

#### Scenario: 异常测试
- **WHEN** 测试异常场景
- **THEN** SHALL 展示 `assertThatThrownBy`（AssertJ）方式，替代 `@Test(expected=...)` 或 `@Rule ExpectedException`

#### Scenario: Mock 策略
- **WHEN** 编写 mock 相关内容
- **THEN** SHALL 推荐 Mockito 配合 `@Mock`、`@InjectMocks`、`@Captor`
- **THEN** SHALL 说明何时用 `when().thenReturn()` 替代 `doReturn().when()`
- **THEN** SHALL 包含 verify 的用法（`verify(mock, times(1))`）

#### Scenario: L1 语言相关约定
- **WHEN** junit5 fragment 加载
- **THEN** 顶部 SHALL 包含 Java 测试的通用约定：
  - 测试文件命名：`XxxTest.java`，放在 `src/test/java/` 下对应包路径
  - 测试类名以 `Test` 结尾（不使用 `Test` 前缀）
  - 方法命名：`should_expectedBehavior_when_condition` 或 `givenCondition_whenAction_thenResult`

### Requirement: spring-mvc-test fragment（L3）

spring-mvc-test fragment SHALL 覆盖使用 `@WebMvcTest` + `MockMvc` 进行 Controller 层测试的规范。

#### Scenario: 基础结构
- **WHEN** 编写 spring-mvc-test quick-reference.md
- **THEN** SHALL 展示 `@WebMvcTest` 的基本注解结构
- **THEN** SHALL 展示 `@AutoConfigureMockMvc` 和 `MockMvc` 注入
- **THEN** SHALL 说明 `@MockitoBean` 用于 mock Service 层

#### Scenario: Controller 测试模式
- **WHEN** 测试 Controller
- **THEN** SHALL 展示 `mockMvc.perform(get("/api/v1/..."))` 的完整链式调用
- **THEN** SHALL 覆盖 JSON 响应验证（`.andExpect(jsonPath("$..."))`）
- **THEN** SHALL 覆盖 HTTP 状态码验证
- **THEN** SHALL 覆盖请求体传递（`@WebMvcTest` 结合 `@MockitoBean`）

#### Scenario: 安全上下文
- **WHEN** Controller 有权限控制
- **THEN** SHALL 展示如何 mock Spring Security 上下文（`@WithMockUser` 或自定义注解）
- **THEN** SHALL 区分匿名请求和认证请求的测试方式

#### Scenario: 异常场景
- **WHEN** 测试异常路径
- **THEN** SHALL 展示 `@WebMvcTest` 下异常处理器的测试方式
- **THEN** SHALL 验证自定义错误响应结构

### Requirement: spring-service-test fragment（L3）

spring-service-test fragment SHALL 覆盖使用 `@SpringBootTest` + `@Transactional` 进行 Service 层测试的规范。

#### Scenario: 基础结构
- **WHEN** 编写 spring-service-test quick-reference.md
- **THEN** SHALL 展示 `@SpringBootTest` 的基本注解结构
- **THEN** SHALL 说明 `@Transactional` 在测试中的作用（事务回滚保证测试隔离）
- **THEN** SHALL 推荐 `@ActiveProfiles("test")` 指定测试配置

#### Scenario: Service 测试模式
- **WHEN** 测试 Service 层
- **THEN** SHALL 区分"纯业务逻辑测试"和"与数据库交互的测试"
- **THEN** 纯业务逻辑 SHALL 使用 Mockito 模拟 Repository
- **THEN** 需要数据库交互的 SHALL 使用 `@SpringBootTest` + 真实 Repository 调用

#### Scenario: 事务管理
- **WHEN** 测试写操作
- **THEN** SHALL 说明 `@Transactional` 在测试类级别自动回滚
- **THEN** SHALL 注明某些操作（如 `@PostConstruct`、异步操作）不受事务回滚影响

### Requirement: data-jpa-test fragment（L3）

data-jpa-test fragment SHALL 覆盖使用 `@DataJpaTest` + Testcontainers 进行 Repository 层测试的规范。

#### Scenario: 基础结构
- **WHEN** 编写 data-jpa-test quick-reference.md
- **THEN** SHALL 展示 `@DataJpaTest` 的基本用法
- **THEN** SHALL 推荐使用 Testcontainers 替代 H2 内存数据库进行集成测试
- **THEN** SHALL 说明 Testcontainers 的依赖声明（MySQL/PostgreSQL 容器）

#### Scenario: Repository 测试模式
- **WHEN** 测试 Repository
- **THEN** SHALL 展示 JPA 查询方法测试（`findBy*`、`existsBy*`、`countBy*`）
- **THEN** SHALL 展示 `@Query` 自定义查询的测试
- **THEN** SHALL 展示 `@Modifying` + `@Query` 写操作的测试

#### Scenario: Testcontainers 集成
- **WHEN** 使用 Testcontainers
- **THEN** SHALL 展示 `@Testcontainers` 和 `@Container` 的使用方式
- **THEN** SHALL 使用 `@ServiceConnection`（Spring Boot 3.1+）替代 `@DynamicPropertySource` 简化容器 JDBC 配置

#### Scenario: 数据准备
- **WHEN** 准备测试数据
- **THEN** SHALL 推荐使用 `@Sql` 注解加载 SQL 脚本，替代手动插入
- **THEN** SHALL 展示如何组织测试数据脚本（按测试类或测试方法维度）

