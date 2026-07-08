# API 规范

## 速查

| 场景 | 决策 |
| --- | --- |
| 资源路径 | 英文复数 kebab-case：`/api/v1/user-roles`，不是 `/api/v1/userRoles` 或 `/api/v1/user_role` |
| 自定义动作 | AIP-136 冒号语法：`@PostMapping("/{id}:publish")` |
| 查询参数 | `?status=active&page=0&size=20&sort=name,asc` |
| 统一响应体 | `ApiResponse<T>` / `PageResponse<T>` / `ErrorResponse` |
| 版本策略 | URL path 前缀 `/api/v1/`；非破坏性变更不升级，破坏性变更 +1 |
| 错误响应 | AIP-193 兼容 `ErrorResponse`：`{ "code": "USER_001", "message": "...", "detail": {} }` |
| 分页 | Spring `Pageable` → `PageResponse` |
| OpenAPI | `@Operation(summary = "...")` + `@ApiResponse` + `@Tag(name = "users")` |

## 核心规范

### 资源命名

- **资源用复数名词**：`/users`、`/orders`、`/line-items`
- **嵌套资源**：`/apps/{appId}/users/{userId}`
- **自定义方法用冒号**：`/users/{id}:activate`（AIP-136）
- **查询参数用 snake_case**：`created_before`、`sort_by`

### 统一响应体

使用泛型包装所有响应：

```java
// ✅ 单资源响应
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
    UserResponse user = userService.getUser(id);
    return ResponseEntity.ok(ApiResponse.success(user));
}

// ✅ 分页响应
@GetMapping
public ResponseEntity<PageResponse<UserResponse>> listUsers(Pageable pageable) {
    Page<UserResponse> page = userService.listUsers(pageable);
    return ResponseEntity.ok(PageResponse.from(page));
}

// ❌ 坏：直接返回实体或裸 List
@GetMapping
public List<UserResponse> listUsers() { ... }  // ← 缺少分页和包装
```

响应体结构：

```java
// ApiResponse — 单资源或操作响应
public record ApiResponse<T>(boolean success, T data, String message) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, null, message);
    }
}

// PageResponse — 分页响应
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}

// ErrorResponse — 错误响应
public record ErrorResponse(String code, String message, Map<String, Object> detail) {
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, Map.of());
    }
}
```

### OpenAPI 文档

```java
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "users", description = "用户管理")
public class UserController {

    @Operation(summary = "获取用户列表")
    @ApiResponse(responseCode = "200", description = "成功返回用户分页列表")
    @GetMapping
    public ResponseEntity<PageResponse<UserResponse>> listUsers(Pageable pageable) {
        // ...
    }

    @Operation(summary = "创建用户")
    @ApiResponse(responseCode = "201", description = "创建成功")
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
        @Valid @RequestBody CreateUserRequest request
    ) {
        // ...
    }
}
```

**规范：**
- 每个 Controller 类加 `@Tag(name = "...", description = "...")`
- 每个接口方法加 `@Operation(summary = "...")`
- 非 200 响应（400/403/404）加 `@ApiResponse(responseCode = "4XX", description = "...")`
- 避免在 `application.yml` 中暴露 OpenAPI 端点到生产环境

### 版本策略

- **非破坏性变更**（新增字段、新增可选参数）：停留在当前版本
- **破坏性变更**（重命名字段、删除字段、改变类型）：创建新版本 `/api/v2/...`
- **废弃端点**：保留旧版本，加 `@Deprecated` 注解，同时在类或方法 Javadoc 中注明废弃原因和迁移目标版本
- **过渡期**：旧版本至少维护 2 个发布周期

### 分页约定

- 列表接口**必须**支持分页
- 入参：Spring 自动解析 `?page=0&size=20&sort=name,asc`
- `page` 从 0 开始
- `size` 默认 20，最大值 200
- 响应：`PageResponse<T>` 包含 `content`、`page`、`size`、`totalElements`、`totalPages`

### 错误码命名

```
{MODULE}_{NNN}

MODULE: 2-4 个大写字母标识模块
示例：USER_001 / ORDER_002 / AUTH_003 / APP_004
```

- `_001`-`_099`：输入验证错误
- `_100`-`_199`：资源状态错误（不存在、已存在、冲突）
- `_200`-`_299`：权限错误
- `_300`-`_399`：系统内部错误

## DTO 多态序列化

当接口中的 DTO 需要根据类型字段分发到不同子类时（如多种图表类型、多种数据源类型），参考 [DTO 多态序列化规范](jackson-polymorphism.md)：

- 后端使用 Jackson `@JsonTypeInfo` + `@JsonSubTypes` 实现多态序列化
- 前端使用 TypeScript Discriminated Union 对应消费
- discriminator value 前后端严格一致
