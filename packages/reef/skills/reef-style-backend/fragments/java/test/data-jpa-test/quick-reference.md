# DataJPA 测试规范

`@DataJpaTest` + Testcontainers：只加载 JPA 切片（Repository / Entity / DataSource），不加载 Service/Controller。

## 基础结构

```java
@DataJpaTest
@ActiveProfiles("test")
@Testcontainers
class UserRepositoryTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    @Autowired private UserRepository userRepository;
    @Autowired private TestEntityManager entityManager;
}
```

> **💡 Testcontainers vs H2：** Testcontainers 使用真实数据库容器，避免 H2 与 PostgreSQL/MySQL 的方言差异。简单项目可用 H2 兼容模式：`@AutoConfigureTestDatabase(replace = ANY)`

## 测试模式

### 基本查询

```java
@Test
void should_findByEmail() {
    entityManager.persistAndFlush(new User("alice@test.com", "Alice"));
    Optional<User> result = userRepository.findByEmail("alice@test.com");
    assertThat(result).isPresent();
}

@Test
void should_returnEmpty_when_notFound() {
    assertThat(userRepository.findByEmail("missing@test.com")).isEmpty();
}
```

### `@Query` 自定义查询

```java
@Test
void should_findActiveUsers() {
    entityManager.persistAndFlush(new User("active@test.com", "Active").setActive(true));
    entityManager.persistAndFlush(new User("inactive@test.com", "Inactive").setActive(false));

    assertThat(userRepository.findActiveUsers())
        .extracting(User::getEmail)
        .containsExactly("active@test.com");
}
```

### `@Modifying` 写操作

```java
@Test
void should_deactivateUser() {
    entityManager.persistAndFlush(new User("leave@test.com", "Leaving"));
    assertThat(userRepository.deactivateByEmail("leave@test.com")).isEqualTo(1);
}
```

### 多租户查询

```java
@Test
void should_findByAppId() {
    entityManager.persistAndFlush(new User("a@test.com", "A").setAppId(1L));
    entityManager.persistAndFlush(new User("b@test.com", "B").setAppId(2L));

    assertThat(userRepository.findAllByAppId(1L)).hasSize(1);
    // 必须传 appId 过滤，禁止裸 findById
    assertThat(userRepository.findByIdAndAppId(id, 1L)).isPresent();
    assertThat(userRepository.findByIdAndAppId(id, 999L)).isEmpty();
}
```

## 数据准备

```java
// 方式一：@Sql 加载脚本（适合多数据）
@Test @Sql("/user-test-data.sql")
void should_findAll() { ... }

// 方式二：entityManager（适合少量）
@Test
void should_findByEmail() {
    entityManager.persistAndFlush(new User("test@test.com", "Test"));
    ...
}
```

## 关键规则

| 场景 | 做法 |
|------|------|
| Repository 测试 | `@DataJpaTest` |
| 测试数据库 | Testcontainers + `@ServiceConnection` |
| 数据准备 | `entityManager.persistAndFlush()` 或 `@Sql` |
| 多租户 | `findByIdAndAppId(id, appId)` **禁止裸 `findById`** |
| 写操作 | `@Modifying` + 验证 `int updated` 返回值 |
