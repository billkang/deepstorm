# Spring MVC 测试规范

`@WebMvcTest` + `MockMvc`：只加载 Web 切片，不加载完整 Spring 上下文。

## 基础结构

```java
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private UserService userService;        // 注入 Mock Service
}
```

## 测试模式

### GET 列表 / 详情 / 404

```java
@Test
void should_returnAllUsers() throws Exception {
    when(userService.findAll()).thenReturn(List.of(new UserDTO(1L, "a@test.com")));

    mockMvc.perform(get("/api/v1/users"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].email").value("a@test.com"));
}

@Test
void should_return404_when_userNotFound() throws Exception {
    when(userService.findById(999L)).thenThrow(new NotFoundException("User", 999L));

    mockMvc.perform(get("/api/v1/users/{id}", 999L))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value(containsString("User")));
}
```

### POST 创建（含权限）

```java
@Test
@WithMockUser(authorities = "USER_CREATE")
void should_createUser() throws Exception {
    when(userService.create(any(CreateUserRequest.class))).thenReturn(new UserDTO(...));

    mockMvc.perform(post("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value(1L));
}

@Test
void should_return403_when_noPermission() throws Exception {
    mockMvc.perform(post("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
}
```

### 参数校验失败

```java
@Test
void should_return400_when_invalidInput() throws Exception {
    mockMvc.perform(post("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new CreateUserRequest("", ""))))
        .andExpect(status().isBadRequest());
}
```

## 关键规则

| 场景 | 做法 |
|------|------|
| Controller 测试 | `@WebMvcTest` + `MockMvc` |
| Service Mock | `@MockitoBean` |
| 权限测试 | `@WithMockUser` + `authorities` |
| JSON 验证 | `jsonPath("$.field").value(...)` |
| 请求体 | `objectMapper.writeValueAsString(dto)` |
| 异常路径 | Service 抛出异常，验证状态码 + message |
