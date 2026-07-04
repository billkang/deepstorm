# 后端基础设施示例

---

## 1. 异常定义

```java
public class NotFoundException extends RuntimeException {
  public NotFoundException(String message) {
    super(message);
  }

  public NotFoundException(String message, ResourceInfo resourceInfo) {
    super(message);
    this.resourceInfo = resourceInfo;
  }
}
```

使用：`throw new NotFoundException("资源不存在", new ResourceInfo("Form", id));`

---

## 2. Error Status 枚举

```java
public enum Status {
  OK(200),
  INVALID_ARGUMENT(400),
  FAILED_PRECONDITION(400),
  NOT_FOUND(404),
  ALREADY_EXISTS(409),
  PERMISSION_DENIED(403),
  INTERNAL(500),
  ;
}
```

---

## 3. 多租户基类

### AbstractTenantAwareEntity（无审计）

```java
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class AbstractTenantAwareEntity extends AbstractEntity {
  @Getter
  @org.hibernate.annotations.TenantId
  private Long tenantId;

  protected AbstractTenantAwareEntity(Long id) {
    super(id);
  }

  protected AbstractTenantAwareEntity(Long id, Long tenantId) {
    super(id);
    this.tenantId = tenantId;
  }
}
```

### AbstractTenantAwareAuditable（有审计字段）

审计字段来自 `AbstractAuditable`（`AbstractEntity` → `AbstractAuditable` → `AbstractTenantAwareAuditable`）：

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED, force = true)
@Getter
public abstract class AbstractAuditable extends AbstractEntity {
  @NotNull @CreatedBy  private Long createdById;
  @NotNull @LastModifiedBy  private Long lastModifiedById;

  protected AbstractAuditable(Long id, Long createdById) {
    super(id);
    this.createdById = createdById;
    this.lastModifiedById = createdById;
  }
}

@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class AbstractTenantAwareAuditable extends AbstractAuditable {
  @org.hibernate.annotations.TenantId
  private Long tenantId;

  protected AbstractTenantAwareAuditable(Long id, Long createdById) {
    super(id, createdById);
  }
}
```

- `createdById` / `lastModifiedById` 由 `AuditingEntityListener` 通过 Spring Security 自动填充
- 实体构造函数传一次 `createdById`，后续修改由 `@LastModifiedBy` 自动更新
- `AbstractTenantAwareAuditable` 同时具备审计字段 + 多租户过滤

---

## 4. 校验

### DTO 字段校验

用 `jakarta.validation` 注解声明在 DTO/record 字段上：

```java
public record CreateFormRequest(
    @NotBlank String title,

    @Size(max = 200)
    String description,

    @Valid   // 嵌套对象必须加 @Valid 才能递归校验
    PrintConfigDto printConfig,

    @NotEmpty
    List<@Valid FormActionDto> actions
) {}
```

Controller 参数加 `@Valid` 触发校验：

```java
@PostMapping
public FormDetailsDto createForm(
    @PathVariable Long appId,
    @Valid @RequestBody CreateFormRequest request) { ... }
```

### 跨字段校验

跨字段逻辑（如结束日期 ≥ 开始日期）在 Service 中显式判断：

```java
@Transactional
public void updateForm(Long appId, Long formId, UpdateFormRequest request) {
  if (request.endDate() != null && request.startDate() != null
      && request.endDate().isBefore(request.startDate())) {
    throw new InvalidArgumentException("结束日期不能早于开始日期");
  }
  ...
}
```

### 程序化校验

复杂校验注入 `jakarta.validation.Validator` 手动调用：

```java
@Service
@AllArgsConstructor
public class ImportService {
  private final Validator validator;

  public void importForms(List<ImportItem> items) {
    for (var item : items) {
      var violations = validator.validate(item);
      if (!violations.isEmpty()) {
        throw new InvalidArgumentException(
            "导入数据校验失败: " + violations.iterator().next().getMessage());
      }
    }
  }
}
```

---

## 5. 分页响应

```java
@Value
public final class PagedResponse<T extends AbstractImmutableDto> {
  List<T> items;
  long totalItems;
}
```
