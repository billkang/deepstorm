## 1. 测试维度配置

- [x] 1.1 wizard.json 后端维表中新增 `backend.java.test` 子维度，定义 junit5、spring-mvc-test、spring-service-test、data-jpa-test 四个 option
- [x] 1.2 wizard.json 前端 `frontend.test` 补充 vitest 子选项的定义（已有）
- [x] 1.3 wizard.json 中定义自动推导规则：根据 framework/orm 选择自动关联测试 option
- [x] 1.4 config-schema.json 中注册 `backend.java.test` 配置路径（已有）

## 2. 后端 L2 fragment：junit5

- [x] 2.1 创建 `fragments/java/test/junit5/quick-reference.md`，包含：
  - L1 语言约定（测试文件命名、目录结构、方法命名）
  - JUnit5 基本注解用法及示例
  - AssertJ 断言风格标准及常见断言示例
  - 参数化测试模式
  - 异常测试模式
  - Mockito mock 策略
- [x] 2.2 创建 `fragments/java/test/junit5/examples/` 示例代码文件

## 3. 后端 L3 fragment：spring-mvc-test

- [x] 3.1 创建 `fragments/java/test/spring-mvc-test/quick-reference.md`，包含：
  - @WebMvcTest + MockMvc 基础用法
  - Controller 测试模式（请求/响应/状态码）
  - @MockitoBean 注入 mock Service
  - 安全上下文 mock（@WithMockUser）
  - 异常处理器测试
- [x] 3.2 创建 `fragments/java/test/spring-mvc-test/examples/` 示例代码文件

## 4. 后端 L3 fragment：spring-service-test

- [x] 4.1 创建 `fragments/java/test/spring-service-test/quick-reference.md`，包含：
  - @SpringBootTest + @Transactional 基础用法
  - 纯业务逻辑测试（Mockito 模拟 Repository）
  - 数据库交互测试（真实 Repository 调用）
  - 事务回滚行为说明
- [x] 4.2 创建 `fragments/java/test/spring-service-test/examples/` 示例代码文件

## 5. 后端 L3 fragment：data-jpa-test

- [x] 5.1 创建 `fragments/java/test/data-jpa-test/quick-reference.md`，包含：
  - @DataJpaTest 基础用法
  - Testcontainers 集成方式
  - JPA 查询方法测试模式
  - @Query 自定义查询测试
  - @Modifying 写操作测试
  - 测试数据准备（@Sql）
- [x] 5.2 创建 `fragments/java/test/data-jpa-test/examples/` 示例代码文件

## 6. 前端 fragment：vitest 增强

- [x] 6.1 更新 `fragments/test/vitest/quick-reference.md`，追加：
  - L1 语言约定（文件命名、目录、describe/it 中文描述）
  - 异步测试写法
  - Signal 组件测试方式
  - 覆盖率要求说明（保留现有门槛）
- [x] 6.2 更新 `fragments/test/vitest/examples/testing.md`，补充：
  - 带依赖注入的 Service 测试
  - 异步操作测试
  - Mock 外部依赖测试

## 7. SKILL.md.tmpl 更新

- [x] 7.1 后端 `reef-style-backend/SKILL.md.tmpl` 加入 L0 测试通用原则（测试金字塔、FIRST、AAA），加入 `{{#if reef.backend.java.test.styleRef}}` 条件引用测试 fragment
- [x] 7.2 前端 `reef-style-frontend/SKILL.md.tmpl` 加入 L0 测试通用原则，加入 `{{#if reef.frontend.test.styleRef}}` 条件引用测试 fragment

## 8. 验证

- [x] 8.1 运行 `deepstorm setup` 选择 JUnit5 + Spring Boot + Hibernate，确认测试 fragment 自动加载
- [x] 8.2 运行 `deepstorm setup` 选择 Vitest，确认前端测试 fragment 自动加载
- [x] 8.3 验证 L0 通用原则在 SKILL.md 中正确渲染
- [x] 8.4 验证现有 Angular + JUnit5 + Spring Boot 用户升级后配置不丢失
