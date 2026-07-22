# NestJS 项目结构规范

## 顶层目录

```
src/
├── main.ts               # 入口（Bootstrap）
├── app.module.ts         # 根模块
├── app.controller.ts     # 健康检查
└── app.service.ts        # 全局服务
```

## 模块目录规范

```
src/modules/{module-name}/
├── {module-name}.module.ts         # Module 定义
├── {module-name}.controller.ts     # REST Controller
├── {module-name}.service.ts        # 业务逻辑
├── dto/
│   ├── create-{entity}.dto.ts      # 创建 DTO
│   └── update-{entity}.dto.ts      # 更新 DTO（PartialType）
└── entities/
    └── {entity}.entity.ts          # Prisma 封装类型（可选）
```

## 公共目录

```
src/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts
│   │   └── logging.interceptor.ts
│   └── guards/
│       └── auth.guard.ts
└── config/
    └── configuration.ts
```

## 命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| Module 类 | PascalCase + Module | `UsersModule` |
| Controller 类 | PascalCase + Controller | `UsersController` |
| Service 类 | PascalCase + Service | `UsersService` |
| DTO 类 | PascalCase + Dto | `CreateUserDto` |
| Module 目录 | kebab-case | `src/modules/user-roles/` |
| DTO 文件 | kebab-case | `create-user-role.dto.ts` |
| 配置键 | UPPER_SNAKE_CASE | `DATABASE_URL` |
