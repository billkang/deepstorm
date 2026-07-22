## ADDED Requirements

### Requirement: NestJS Module 代码生成
reef-gen-backend 技能 SHALL 支持 NestJS Module 的按需生成，包含完整的 CRUD 模板。

#### Scenario: 生成 NestJS 模块骨架
- **WHEN** 用户请求生成一个新模块（如 `products`）
- **THEN** 生成器 SHALL 输出以下 NestJS 标准文件结构：
  - `products.module.ts` — NestJS Module 定义
  - `products.controller.ts` — REST Controller
  - `products.service.ts` — 业务逻辑 Service
  - `dto/create-product.dto.ts` — 创建 DTO
  - `dto/update-product.dto.ts` — 更新 DTO
  - `entities/product.entity.ts` — Prisma Entity（非 Prisma 模式则使用 TypeScript interface）

#### Scenario: 带 Prisma Service 的模块生成
- **WHEN** 项目启用了 Prisma
- **AND** 用户请求生成模块
- **THEN** Controller SHALL 依赖 PrismaService 而非内存存储
- **THEN** Service SHALL 使用 PrismaService 实现 CRUD 操作
- **THEN** 生成代码 SHALL 包含 Prisma 查询优化提示（`include`、`select`、`where` 条件构造）

### Requirement: DTO 验证规范
生成的 DTO SHALL 使用 `class-validator` 和 `class-transformer` 装饰器实现输入验证。

#### Scenario: DTO 验证装饰器
- **WHEN** 生成 CreateUserDto
- **THEN** 必填字段 SHALL 使用 `@IsNotEmpty()` 装饰器
- **THEN** 字符串字段 SHALL 使用 `@IsString()` 装饰器
- **THEN** 数字字段 SHALL 使用 `@IsNumber()` 装饰器
- **THEN** 可选字段 SHALL 使用 `@IsOptional()` 装饰器

#### Scenario: Swagger/OpenAPI 装饰器
- **WHEN** 生成 DTO 和 Controller
- **THEN** DTO 字段 SHALL 添加 `@ApiProperty()` 装饰器
- **THEN** Controller 方法 SHALL 添加 `@ApiTags()`、`@ApiOperation()` 装饰器
- **THEN** Controller SHALL 使用 `@ApiBearerAuth()` 标记需要认证的端点

### Requirement: 代码生成 Skill 变体步骤
reef-gen-backed/skills 的 Node.js 变体 SHALL 在 `variants/nodejs/steps.md` 中定义独特的编码顺序和构建命令。

#### Scenario: Node.js 编码顺序
- **WHEN** 用户选择了 Node.js 后端
- **THEN** code-gen skill 的编码顺序 SHALL 为：Prisma Schema → DTO → Entity → Service → Controller → Module
- **THEN** 构建命令 SHALL 使用 `pnpm`（或用户选择的包管理器）

#### Scenario: 模板变量注入
- **WHEN** 渲染 gen-backend skill 模板
- **THEN** `{{reef.backend.nodejs.buildTool}}` SHALL 替换为 `pnpm`/`npm`/`yarn`
- **THEN** `{{reef.backend.nodejs.sourcePath}}` SHALL 替换为 `src/`
- **THEN** `{{reef.backend.nodejs.testFramework}}` SHALL 替换为 `jest` 或 `vitest`
