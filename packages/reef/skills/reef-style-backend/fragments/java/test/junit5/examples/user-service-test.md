```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @InjectMocks private UserService userService;

    private User userEntity;
    private UserDTO userDTO;

    @BeforeEach
    void setUp() {
        userEntity = new User(1L, "test@example.com", "Test User");
        userDTO = new UserDTO(1L, "test@example.com", "Test User");
    }

    @Test
    void should_returnUser_when_findById() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(userEntity));
        when(userMapper.toDTO(userEntity)).thenReturn(userDTO);

        UserDTO result = userService.findById(1L);

        assertThat(result)
            .extracting(UserDTO::id, UserDTO::email)
            .containsExactly(1L, "test@example.com");
    }

    @Test
    void should_throw_when_userNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(999L))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("User");
    }

    @ParameterizedTest
    @CsvSource({"''", "'   '", "null"})
    void should_throw_when_nameIsBlank(String name) {
        assertThatThrownBy(() -> userService.create(
            new CreateUserRequest(name, "a@test.com")))
            .isInstanceOf(InvalidArgumentException.class);
    }

    @Test
    void should_createUser_andReturnDTO() {
        when(userMapper.toEntity(any())).thenReturn(new User(null, "new@test.com", "New"));
        when(userRepository.save(any())).thenReturn(new User(2L, "new@test.com", "New"));
        when(userMapper.toDTO(any())).thenReturn(new UserDTO(2L, "new@test.com", "New"));

        UserDTO result = userService.create(
            new CreateUserRequest("New User", "new@test.com"));

        assertThat(result).usingRecursiveComparison()
            .isEqualTo(new UserDTO(2L, "new@test.com", "New"));
        verify(userRepository).save(any());
    }
}
```
