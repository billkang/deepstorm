# Spring Boot 规范

按需加载。仅当需要编写对应组件类型时阅读相关章节。

> **完整示例代码见 `examples/` 目录**（controller.md、service-entity.md、dto-mapper.md、testing.md、infrastructure.md）。

## 速查

| 场景 | 决策 |
| --- | --- |
| 新建 Controller | `@RestController` + `@RequestMapping("/api/v1/apps/{appId}/...")` + `@RequiredArgsConstructor` |
| 新建 Service | `@Service` + `@Transactional` + `@RequiredArgsConstructor`，字段 `private final` |
| 新建 Repository | 继承 `JpaRepository<Entity, Long>` |
| 新建立方 DTO | 继承 `AbstractDto` 等基类或使用 `@Value` |
| 新建写请求 | 独立 `record CreateRequest` / `UpdateRequest` |
| 对象映射 | MapStruct `@Mapper(config = MapStructConfig.class)` |
| 异常处理 | 使用项目自定义异常（`NotFoundException` 等） |
| 多租户查询 | 禁止裸 `findById`，使用 `findByIdAndAppId`；禁止 `createNativeQuery` |
| Controller 权限 | 写操作接口加 `@PreAuthorize("hasAuthority('...')")` |
| 密码存储 | `BCryptPasswordEncoder` |
| 弃用 API | 编译警告中的 `@Deprecated` API 在同一次 PR 中替换为新 API |

## 核心规范

### Controller 层

- `@RestController` + `@RequestMapping("/api/v1/apps/{appId}/...")` + `@AllArgsConstructor`
- 标准 CRUD：list / get / create / update / delete
- 自定义方法用 AIP-136 冒号语法：`@PostMapping("/{id}:publish")`
- 写操作 DTO 加 `@Valid`，嵌套对象加 `@Valid`
- API 版本策略：非破坏性变更停留在当前版本；破坏性变更创建新 API 版本

### Service 层

- `@Service` + `@AllArgsConstructor`，依赖 `private final`
- 提取 `getEntity()` 复用查找 + 异常抛出
- 写操作加 `@Transactional`
- 多租户查询：`repository.findByIdAndAppId(id, appId)` — 禁止裸 `findById`
- 级联清理通过事件驱动（`eventPublisher.publishEvent(event)`）

### Repository 层

继承 `JpaRepository<Entity, Long>`。多租户实体提供 `findAllByAppId` 和 `findByIdAndAppId`。`@TenantId` 由 Hibernate 自动过滤，禁止 `createNativeQuery`。

### DTO / MapStruct

DTO 继承基类，写请求用独立 CreateRequest/UpdateRequest record。MapStruct：

- `@Mapper(config = MapStructConfig.class, uses = { ... })`
- 声明 `INSTANCE = Mappers.getMapper(...)`
- 子映射通过 `uses` 组合
- 映射方法命名区分：`toSummary()` / `toDetail()`

### 异常处理

| 异常 | HTTP | 场景 |
| --- | --- | --- |
| `NotFoundException` | 404 | 资源不存在 |
| `AlreadyExistsException` | 409 | 重复创建 |
| `InvalidArgumentException` | 400 | 参数校验失败 |
| `PermissionDeniedException` | 403 | 无权限 |
| `FailedPreconditionException` | 400 | 前置条件不满足 |

所有自定义异常通过 `@RestControllerAdvice` `GlobalExceptionHandler` 统一处理，返回 AIP-193 兼容的 `CustomError` 结构：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(NOT_FOUND).body(new ErrorResponse(ex.getMessage()));
  }
}
```

### 安全编码规范

- Controller 写操作接口必须加 `@PreAuthorize("hasAuthority('PERMISSION_NAME')")`，禁止在方法内硬编码权限字符串
- 请求体参数加 `@Valid`，嵌套对象加 `@Valid`
- DTO 中密码/token 用 `@JsonIgnore` 或从响应 DTO 中排除
- 密码使用 `BCryptPasswordEncoder`
- 禁止 `createNativeQuery`（绕过多租户 + SQL 注入风险）
- `@Query` 始终使用命名参数（`:paramName`），不用 `?1` 位置参数
