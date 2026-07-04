# 安全红线

## 🔴 红线速查

| 红线 | 禁止行为 | 正确做法 | 违反后果 |
|------|---------|---------|---------|
| 密码存储 | 明文存储密码 | `BCryptPasswordEncoder`（Spring Security） | P0 — 安全漏洞 |
| SQL 拼接 | 字符串拼接 SQL | JPA `@Query` + 命名参数，或 QueryDSL/JPA Criteria | P0 — SQL 注入 |
| 危险初始化 | `@PostConstruct` 中触发写操作 | 延迟到首次调用或独立 `@EventListener(ApplicationReadyEvent.class)` | P1 — 非预期行为 |
| 硬编码密钥 | 代码中硬编码 API Key / Secret | 环境变量或 `application-{profile}.yml`（.env 不提交） | P0 — 凭据泄露 |
| 敏感信息打印 | `System.out.println` 敏感数据 | 用 SLF4J，生产日志级别过滤敏感字段 | P1 — 信息泄露 |
| 文件上传验证 | 无限制的文件上传 | 限制类型 + 大小 + 重命名 + 非 webroot 存储 | P1 — 任意文件上传 |
| 不安全的反序列化 | 信任外部反序列化数据 | 验证输入类型 + 数字签名 + 白名单 | P1 — 远程代码执行 |

## 🔴 红线详情

### 1. 密码存储 — 禁止明文 （P0）

```java
// ❌ 坏：明文存储
user.setPassword(plainPassword);

// ✅ 好：使用 BCryptPasswordEncoder
@Service
public class UserService {
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User createUser(CreateUserRequest request) {
        User user = new User();
        user.setPassword(passwordEncoder.encode(request.password()));
        return userRepository.save(user);
    }
}

// ✅ 验证密码
boolean matches = passwordEncoder.matches(rawPassword, user.getPassword());
```

### 2. SQL 拼接 — 禁止字符串拼接 （P0）

```java
// ❌ 坏：字符串拼接 — SQL 注入
@Query("SELECT u FROM User u WHERE u.name = '" + name + "'")
List<User> findByName(String name);

// ✅ 好：命名参数
@Query("SELECT u FROM User u WHERE u.name = :name")
List<User> findByName(@Param("name") String name);

// ✅ 好：Spring Data 派生查询（简单场景）
List<User> findByName(String name);

// ❌ 坏：原生 SQL 拼接
@Query(value = "SELECT * FROM users WHERE name = '" + name + "'", nativeQuery = true)
List<User> findByRawSQL(String name);

// ✅ 好：原生 SQL + 命名参数
@Query(value = "SELECT * FROM users WHERE name = :name", nativeQuery = true)
List<User> findByRawSQL(@Param("name") String name);
```

**红线规则：**
- Repository 中禁止使用 `+ name +` 拼接查询条件
- 禁止 `createNativeQuery`（也绕过多租户过滤）
- `@Query` 必须使用命名参数 `:paramName`，禁止使用 `?1` 位置参数
- Service 层禁止 `entityManager.createQuery(sqlString)` 传参拼接字符串

### 3. 危险初始化 — 禁止 @PostConstruct 触发写操作 （P1）

```java
// ❌ 坏：@PostConstruct 中操作数据库
@Component
public class DataInitializer {
    @PostConstruct  // ← 启动时必然执行，测试和回滚场景无法控制
    public void init() {
        userRepository.save(new User("admin", "admin"));
    }
}

// ✅ 好：按需初始化或 EventListener（可控制执行时机）
@Component
public class DataInitializer {
    @EventListener(ApplicationReadyEvent.class)  // ← 应用完全启动后执行
    @Profile("!test")                              // ← 测试环境跳过
    public void init() {
        log.info("Initializing default data...");
        if (userRepository.count() == 0) {
            userRepository.save(new User("admin", encodePassword("admin")));
        }
    }
}

// 或者更安全的模式：显式调用 + 幂等检查
@Component
public class DataInitializer {
    private boolean initialized = false;

    public synchronized void initializeIfNeeded() {
        if (!initialized && userRepository.count() == 0) {
            userRepository.save(new User("admin", encodePassword("admin")));
            initialized = true;
        }
    }
}
```

### 4. 硬编码密钥 — 禁止代码中内联 （P0）

```java
// ❌ 坏：硬编码 API Key
private static final String API_KEY = "sk-abc123...";

// ✅ 好：环境变量
@Value("${app.api-key}")
private String apiKey;

// ✅ 好：Spring Cloud Config / Vault
@Value("${app.api-key}")
private String apiKey;
```

```yaml
# ❌ 坏：提交到 Git
api-key: sk-abc123...

# ✅ 好：application.yml 中只声明占位
app:
  api-key: ${APP_API_KEY}
```

```properties
# ✅ .env 本地开发（不提交 Git）
APP_API_KEY=sk-abc123...
```

### 5. 敏感脱敏 — 日志中禁止打印敏感信息 （P1）

```java
// ❌ 坏：直接打印敏感信息
log.info("User login: {} {}", user.getEmail(), user.getPassword());   // ← 密码泄露
log.info("Token: {}", authToken);                                      // ← Token 泄露

// ✅ 好：脱敏后打印
log.info("User login: {}", maskEmail(user.getEmail()));
log.info("User [id={}] logged in", user.getId());

// 脱敏工具方法
public static String maskEmail(String email) {
    int at = email.indexOf('@');
    if (at <= 1) return email;
    return email.charAt(0) + "***" + email.substring(at);
}

public static String maskPhone(String phone) {
    if (phone == null || phone.length() < 7) return phone;
    return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
}
```

**红线规则：**
- 禁止打印密码、Token、完整手机号、完整身份证号
- DTO 中密码字段加 `@JsonIgnore` 或从响应 DTO 中排除
- 禁止 `System.out.println` — 必须通过 SLF4J 日志框架

### 6. 文件上传验证 （P1）

```java
// ✅ 好：文件上传安全检查
public class FileUploadService {
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_SIZE = 10 * 1024 * 1024;  // 10MB
    private static final Path UPLOAD_DIR = Path.of("/var/data/uploads");  // ← 非 webroot

    public void upload(MultipartFile file) {
        // 1. 校验文件类型
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new InvalidArgumentException(ErrorCode.VALIDATION_001, "不支持的文件类型");
        }

        // 2. 校验文件大小
        if (file.getSize() > MAX_SIZE) {
            throw new InvalidArgumentException(ErrorCode.VALIDATION_001, "文件大小超限");
        }

        // 3. 重命名防止路径穿越
        String safeName = UUID.randomUUID() + "-" + cleanFileName(file.getOriginalFilename());

        // 4. 存储到非 webroot 目录
        file.transferTo(UPLOAD_DIR.resolve(safeName).toFile());
    }

    private String cleanFileName(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
```
