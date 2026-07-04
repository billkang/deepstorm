# 异常处理规范

## 速查

| 场景 | 决策 |
| --- | --- |
| 业务异常 | 继承 `BusinessException` → 按场景选子类：`ResourceNotFoundException` / `AlreadyExistsException` / `InvalidArgumentException` / `PermissionDeniedException` / `FailedPreconditionException` |
| 全局捕获 | `@RestControllerAdvice` + `GlobalExceptionHandler` |
| 错误响应 | `ErrorResponse(code, message, detail)` — AIP-193 兼容 |
| 错误码 | `{MODULE}_{NNN}` 枚举：`ErrorCode` enum 统一管理 |
| 参数校验失败 | `MethodArgumentNotValidException` → `InvalidArgumentException` 统一处理 |
| 未知异常 | 兜底 500 — `GENERIC_001`，记录完整堆栈 |

## 核心规范

### 业务异常继承层次

```
RuntimeException
└── BusinessException          ← 抽象基类，含 errorCode + httpStatus
    ├── ResourceNotFoundException       (404)
    ├── AlreadyExistsException          (409)
    ├── InvalidArgumentException        (400)
    ├── PermissionDeniedException       (403)
    └── FailedPreconditionException     (400)
```

```java
// 基类
public abstract class BusinessException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus httpStatus;
    private final Map<String, Object> detail;

    protected BusinessException(String errorCode, HttpStatus httpStatus, String message) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.detail = Map.of();
    }

    protected BusinessException(String errorCode, HttpStatus httpStatus,
                                String message, Map<String, Object> detail) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
        this.detail = detail;
    }

    public String getErrorCode() { return errorCode; }
    public HttpStatus getHttpStatus() { return httpStatus; }
    public Map<String, Object> getDetail() { return detail; }
}

// 子类示例
public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String errorCode, String resourceType, Object id) {
        super(errorCode, HttpStatus.NOT_FOUND,
              resourceType + " not found: " + id,
              Map.of("resourceType", resourceType, "id", id));
    }
}
```

**规范：**
- 业务异常**必须**继承 `BusinessException`，不得直接抛 `RuntimeException` 或 `ResponseStatusException`
- 每个构造函数传入 `ErrorCode` 枚举值，而非硬编码字符串
- 可选的 `detail` map 携带上下文信息（如资源 ID、字段名）用于调试

### 错误码枚举

```java
public enum ErrorCode {
    // User module — 001~099 输入验证, 100~199 资源状态, 200~299 权限
    USER_001("USER_001", "用户名已存在"),
    USER_002("USER_002", "邮箱格式无效"),
    USER_100("USER_100", "用户不存在"),
    USER_101("USER_101", "用户已禁用"),
    USER_200("USER_200", "无权操作该用户"),

    // Order module
    ORDER_001("ORDER_001", "订单金额无效"),
    ORDER_100("ORDER_100", "订单不存在"),
    ORDER_101("ORDER_101", "订单状态不允许操作"),

    // Auth module
    AUTH_001("AUTH_001", "Token 已过期"),
    AUTH_002("AUTH_002", "Token 无效"),
    AUTH_201("AUTH_201", "无权限访问"),

    // Generic
    GENERIC_001("GENERIC_001", "系统内部错误");

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String code() { return code; }
    public String defaultMessage() { return defaultMessage; }
}
```

### @RestControllerAdvice 全局处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 业务异常
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        return ResponseEntity
            .status(ex.getHttpStatus())
            .body(ErrorResponse.of(ex.getErrorCode(), ex.getMessage(), ex.getDetail()));
    }

    // 参数校验失败
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
            .toList();
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of("VALIDATION_001", "参数校验失败", Map.of("errors", errors)));
    }

    // 404 未命中路由
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoHandlerFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of("GENERIC_404", "接口不存在: " + ex.getRequestURL()));
    }

    // 兜底：未捕获异常 → 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);  // 完整堆栈只打日志，不返回客户端
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of("GENERIC_001", "系统内部错误"));
    }
}
```

**规范：**
- 不要在每个 Controller 中写 try-catch
- 不要吞异常后返回 null 或空集合
- 兜底 handler 必须 `log.error` 记录完整堆栈

### 异常使用示例

```java
// Service 层
@Service
public class UserService {
    public UserResponse getUser(Long id) {
        return userRepository.findById(id)
            .map(UserResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException(
                ErrorCode.USER_100.code(), "User", id));
    }
}

// Controller 层不需要 try-catch
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUser(id)));
    }
}
```
