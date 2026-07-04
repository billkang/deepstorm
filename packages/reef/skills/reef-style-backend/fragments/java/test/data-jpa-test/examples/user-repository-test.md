```java
@DataJpaTest
@ActiveProfiles("test")
@Testcontainers
class UserRepositoryTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired private UserRepository userRepository;
    @Autowired private TestEntityManager entityManager;

    // ──── 基本查询 ────

    @Test
    void should_findByEmail() {
        entityManager.persistAndFlush(new User("alice@test.com", "Alice"));
        assertThat(userRepository.findByEmail("alice@test.com")).isPresent();
    }

    @Test
    void should_returnEmpty_when_notFound() {
        assertThat(userRepository.findByEmail("missing@test.com")).isEmpty();
    }

    // ──── 多租户 ────

    @Test
    void should_findByIdAndAppId() {
        User user = entityManager.persistAndFlush(
            new User("multi@test.com", "Multi").setAppId(1L));
        assertThat(userRepository.findByIdAndAppId(user.getId(), 1L)).isPresent();
        assertThat(userRepository.findByIdAndAppId(user.getId(), 999L)).isEmpty();
    }

    @Test @Sql("/user-repository-test-data.sql")
    void should_findAllByAppId() {
        assertThat(userRepository.findAllByAppId(1L)).hasSize(2);
        assertThat(userRepository.findAllByAppId(2L)).hasSize(1);
    }

    // ──── 存在性 & 计数 ────

    @Test
    void should_checkEmailExists() {
        entityManager.persistAndFlush(new User("exists@test.com", "Exists"));
        assertThat(userRepository.existsByEmail("exists@test.com")).isTrue();
        assertThat(userRepository.existsByEmail("nobody@test.com")).isFalse();
    }

    @Test
    void should_countByAppId() {
        entityManager.persistAndFlush(new User("a@test.com", "A").setAppId(1L));
        entityManager.persistAndFlush(new User("b@test.com", "B").setAppId(1L));
        assertThat(userRepository.countByAppId(1L)).isEqualTo(2);
        assertThat(userRepository.countByAppId(2L)).isZero();
    }

    // ──── @Query ────

    @Test @Sql("/user-repository-test-data.sql")
    void should_findActiveUsers() {
        assertThat(userRepository.findActiveUsers())
            .extracting(User::getEmail)
            .contains("alice@test.com", "bob@test.com")
            .doesNotContain("inactive@test.com");
    }
}
```
