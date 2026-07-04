# JUnit 5 测试规范

## 文件与命名规范

- 文件位置：`src/test/java/`，包路径与被测类一致
- 类名：`XxxTest.java`（`Test` 后缀）
- 方法名：`should_expectedBehavior_when_condition`
  - 例：`should_returnUser_when_findById`

## 基本注解

| 注解 | 用途 |
|------|------|
| `@Test` | 标记测试方法，每个方法一个独立场景 |
| `@BeforeEach` | 每个测试前执行（初始化、Mock 设置） |
| `@AfterEach` | 每个测试后执行（清理资源） |
| `@BeforeAll` | 所有测试前（static） |
| `@AfterAll` | 所有测试后（static） |

## AAA 模式

```java
@Test
void should_returnUser_when_findById() {
    // Arrange
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    // Act
    UserDTO result = userService.findById(userId);
    // Assert
    assertThat(result).extracting(UserDTO::id, UserDTO::email)
        .containsExactly(1L, "test@example.com");
}
```

## 断言（AssertJ 流畅 API）

```java
// 基本
assertThat(actual).isEqualTo(expected).isNotNull();
// 集合
assertThat(list).hasSize(3).containsExactly(a, b, c);
assertThat(list).extracting(User::id).containsExactly(1L, 2L, 3L);
assertThat(list).extracting(User::id, User::email)
    .containsExactly(tuple(1L, "a@test.com"), tuple(2L, "b@test.com"));
// 异常
assertThatThrownBy(() -> service.findById(999L))
    .isInstanceOf(NotFoundException.class)
    .hasMessageContaining("User");
```

## 参数化测试

```java
@ParameterizedTest
@ValueSource(strings = {"", "  "})
void should_throw_when_nameIsBlank(String name) {
    assertThatThrownBy(() -> validator.validateName(name))
        .isInstanceOf(InvalidArgumentException.class);
}

@ParameterizedTest
@CsvSource({"user@test.com, true", "invalid-email, false"})
void should_validateEmail(String email, boolean expected) {
    assertThat(validator.isValidEmail(email)).isEqualTo(expected);
}

@ParameterizedTest
@MethodSource("invalidUserProvider")
void should_throw_when_userInvalid(CreateUserRequest request) { ... }

static Stream<CreateUserRequest> invalidUserProvider() { ... }
```

## Mock（Mockito）

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;
    @Captor private ArgumentCaptor<User> userCaptor;

    @Test
    void should_createUser() {
        when(userMapper.toEntity(request)).thenReturn(entity);
        when(userRepository.save(entity)).thenReturn(saved);
        when(userMapper.toDTO(saved)).thenReturn(expected);
        UserDTO result = userService.create(request);
        assertThat(result).isEqualTo(expected);
        verify(userRepository).save(entity);
    }

    @Test
    void should_throw_when_userNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.findById(999L))
            .isInstanceOf(NotFoundException.class);
    }
}
```
