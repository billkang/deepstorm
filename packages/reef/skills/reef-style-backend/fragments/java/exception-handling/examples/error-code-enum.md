# 错误码枚举示例

## 完整 ErrorCode 枚举

```java
package com.example.app.common;

/**
 * 全局错误码枚举。
 *
 * 编码规则：{MODULE}_{NNN}
 *   MODULE = 2-4 个大写字母
 *   NNN   = 三位数字
 *     001-099 输入验证
 *     100-199 资源状态
 *     200-299 权限
 *     300-399 系统内部
 */
public enum ErrorCode {

    // ── User ──────────────────────────────────────────────
    USER_001("USER_001", "用户名已存在"),
    USER_002("USER_002", "邮箱格式无效"),
    USER_003("USER_003", "手机号格式无效"),
    USER_004("USER_004", "密码不符合安全策略"),

    USER_100("USER_100", "用户不存在"),
    USER_101("USER_101", "用户已禁用"),
    USER_102("USER_102", "用户邮箱未验证"),
    USER_103("USER_103", "用户已删除"),

    USER_200("USER_200", "无权操作该用户"),
    USER_201("USER_201", "不能操作自身账号"),

    // ── Order / App ──────────────────────────────────────
    APP_001("APP_001", "应用名称为空"),
    APP_002("APP_002", "应用名称超长"),
    APP_100("APP_100", "应用不存在"),
    APP_101("APP_101", "应用已下架"),
    APP_200("APP_200", "无权操作该应用"),

    // ── Auth ──────────────────────────────────────────────
    AUTH_001("AUTH_001", "Token 已过期"),
    AUTH_002("AUTH_002", "Token 无效"),
    AUTH_003("AUTH_003", "Token 签名验证失败"),
    AUTH_004("AUTH_004", "Refresh Token 无效"),
    AUTH_201("AUTH_201", "无权限访问"),
    AUTH_202("AUTH_202", "角色权限不足"),
    AUTH_203("AUTH_203", "需要 Root Tenant 权限"),

    // ── Validating ────────────────────────────────────────
    VALIDATION_001("VALIDATION_001", "参数校验失败"),
    VALIDATION_002("VALIDATION_002", "请求体格式无效"),

    // ── Generic ───────────────────────────────────────────
    GENERIC_001("GENERIC_001", "系统内部错误"),
    GENERIC_002("GENERIC_002", "服务暂时不可用"),
    GENERIC_404("GENERIC_404", "接口不存在"),
    GENERIC_429("GENERIC_429", "请求频率过高");

    private final String code;
    private final String defaultMessage;

    ErrorCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String code() { return code; }
    public String defaultMessage() { return defaultMessage; }

    @Override
    public String toString() { return code + ": " + defaultMessage; }
}
```

## 异常 + 错误码对照表

| 异常类 | HTTP | 错误码示例 | 典型场景 |
|--------|------|-----------|---------|
| `ResourceNotFoundException` | 404 | `USER_100` | 用户不存在 |
| `AlreadyExistsException` | 409 | `USER_001` | 用户名重复 |
| `InvalidArgumentException` | 400 | `ORDER_001` | 金额无效 |
| `PermissionDeniedException` | 403 | `AUTH_201` | 无权操作 |
| `FailedPreconditionException` | 400 | `ORDER_101` | 订单状态不允许 |

## 映射逻辑

```java
// 推荐：在子类构造时注入 ErrorCode，GlobalExceptionHandler 从异常中读取
public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(ErrorCode errorCode, Object... args) {
        super(errorCode.code(), HttpStatus.NOT_FOUND,
              String.format(errorCode.defaultMessage(), args));
    }
}

// Service 使用
throw new ResourceNotFoundException(ErrorCode.USER_100);
throw new ResourceNotFoundException(ErrorCode.USER_100, userId);
```
