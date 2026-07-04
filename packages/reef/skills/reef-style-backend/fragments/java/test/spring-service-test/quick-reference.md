# Spring Service 测试规范

`@SpringBootTest` + `@Transactional`：加载完整上下文，每个测试结束后事务回滚，互不影响。

## 基础结构

```java
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class UserServiceTest {
    @Autowired private UserService userService;
    @Autowired private TestEntityManager entityManager;      // 直接操作数据库准备数据
}
```

> **⚠️ 何时用 `@SpringBootTest` vs `@ExtendWith(MockitoExtension.class)`**
> - **数据库交互**（Repository / 事务）→ `@SpringBootTest`
> - **纯业务逻辑**（计算、校验、映射）→ `MockitoExtension`（更快）

## 测试模式

### 读操作

```java
@Test
void should_returnUser_when_findById() {
    User user = entityManager.persistAndFlush(new User("test@test.com", "Test"));
    UserDTO result = userService.findById(user.getId());
    assertThat(result).extracting(UserDTO::id, UserDTO::email)
        .containsExactly(user.getId(), "test@test.com");
}
```

### 写操作

```java
@Test
void should_createUser() {
    UserDTO result = userService.create(new CreateUserRequest("new@test.com", "New"));
    assertThat(result.id()).isNotNull();
    // 验证数据库真实写入
    User saved = entityManager.find(User.class, result.id());
    assertThat(saved).isNotNull();
}
```

### 异常路径

```java
@Test
void should_throw_when_duplicateEmail() {
    entityManager.persistAndFlush(new User("dup@test.com", "Existing"));
    assertThatThrownBy(() -> userService.create(
        new CreateUserRequest("dup@test.com", "Duplicate")))
        .isInstanceOf(AlreadyExistsException.class);
}
```

### 事务回滚

```java
@Test
void should_rollback_on_failure() {
    userService.create(new CreateUserRequest("a@test.com", "A"));
    assertThatThrownBy(() ->
        userService.create(new CreateUserRequest("a@test.com", "A2")))
        .isInstanceOf(AlreadyExistsException.class);
    // @Transactional 自动回滚，数据库只有一条 a@test.com
}
```

## 关键规则

| 场景 | 做法 |
|------|------|
| 需要数据库交互 | `@SpringBootTest` + `TestEntityManager` |
| 纯业务逻辑 | `@ExtendWith(MockitoExtension.class)` |
| 测试隔离 | `@Transactional`（自动回滚） |
| 测试配置 | `@ActiveProfiles("test")` |
| 数据准备 | `entityManager.persistAndFlush()` 或 `@Sql` |

> **注意：** `@Transactional` 不回滚 `@PostConstruct` 和异步操作（`@Async`）中的操作。
