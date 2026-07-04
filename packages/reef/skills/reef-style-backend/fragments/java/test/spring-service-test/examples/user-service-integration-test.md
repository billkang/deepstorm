```java
@SpringBootTest
@Transactional
@ActiveProfiles("test")
@Testcontainers
class UserServiceIntegrationTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired private UserService userService;

    // ──── 读 ────

    @Test @Sql("/user-service-test-data.sql")
    void should_returnAllUsers() {
        assertThat(userService.findAll())
            .extracting(UserDTO::email)
            .containsExactlyInAnyOrder("alice@test.com", "bob@test.com");
    }

    @Test
    void should_throw_when_userNotFound() {
        assertThatThrownBy(() -> userService.findById(999L))
            .isInstanceOf(NotFoundException.class);
    }

    // ──── 写 ────

    @Test
    void should_createUser() {
        UserDTO result = userService.create(new CreateUserRequest("new@test.com", "New User"));
        assertThat(result.id()).isNotNull();
        assertThat(result.email()).isEqualTo("new@test.com");
    }

    @Test
    void should_throw_when_duplicateEmail() {
        userService.create(new CreateUserRequest("dup@test.com", "First"));
        assertThatThrownBy(() ->
            userService.create(new CreateUserRequest("dup@test.com", "Second")))
            .isInstanceOf(AlreadyExistsException.class);
    }

    // ──── 事务 ────

    @Test
    void should_rollback_on_failure() {
        userService.create(new CreateUserRequest("a@test.com", "A"));
        assertThatThrownBy(() ->
            userService.create(new CreateUserRequest("a@test.com", "A Duplicate")))
            .isInstanceOf(AlreadyExistsException.class);
        // @Transactional 自动回滚，数据库只有一条 a@test.com
    }
}
```
