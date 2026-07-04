```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private UserService userService;

    // ──────── GET ────────

    @Test
    void should_returnAllUsers() throws Exception {
        when(userService.findAll()).thenReturn(List.of(
            new UserDTO(1L, "a@test.com", "Alice"),
            new UserDTO(2L, "b@test.com", "Bob")));

        mockMvc.perform(get("/api/v1/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].email").value("a@test.com"));
    }

    @Test
    void should_return404_when_userNotFound() throws Exception {
        when(userService.findById(999L)).thenThrow(new NotFoundException("User", 999L));

        mockMvc.perform(get("/api/v1/users/{id}", 999L))
            .andExpect(status().isNotFound());
    }

    // ──────── POST ────────

    @Test
    @WithMockUser(authorities = "USER_CREATE")
    void should_createUser() throws Exception {
        when(userService.create(any())).thenReturn(new UserDTO(3L, "carol@test.com", "Carol"));

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateUserRequest("carol@test.com", "Carol"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(3L));
    }

    @Test
    void should_return403_when_notAuthorized() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateUserRequest("carol@test.com", "Carol"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void should_return400_when_invalidInput() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateUserRequest("", ""))))
            .andExpect(status().isBadRequest());
    }
}
```
