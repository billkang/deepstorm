## ADDED Requirements

### Requirement: Node.js 项目结构规范
NestJS 项目 SHALL 遵循分层模块化结构，每个业务模块独立为一个 NestJS Module，包含 Controller、Service、DTO/Entity 文件。

#### Scenario: 标准 NestJS 模块结构
- **WHEN** 用户新建一个 NestJS 业务模块（如 `users`）
- **THEN** 模块目录结构 SHALL 为：`src/modules/users/users.module.ts`、`src/modules/users/users.controller.ts`、`src/modules/users/users.service.ts`
- **THEN** DTO 文件 SHALL 放在 `src/modules/users/dto/` 下
- **THEN** Entity 文件 SHALL 放在 `src/modules/users/entities/` 下

#### Scenario: Prisma 集成模块
- **WHEN** 项目启用了 Prisma
- **THEN** `PrismaModule` SHALL 作为全局模块（`@Global()`），在 `src/prisma/prisma.module.ts` 中定义
- **THEN** `PrismaService` SHALL 继承 `PrismaClient` 并实现 `OnModuleInit` 接口

### Requirement: ESLint + Prettier 代码格式规范
NestJS 项目 SHALL 使用 ESLint + Prettier 作为代码格式化和 linting 工具，配置作为 fragment 提供给用户。

#### Scenario: ESLint 配置
- **WHEN** 用户启用 ESLint
- **THEN** ESLint 配置 SHALL 继承 `@nestjs/eslint-config` 和 `eslint-config-prettier`
- **THEN** ESLint SHALL 包含 TypeScript 规则（`@typescript-eslint`）
- **THEN** ESLint SHALL 禁用与 Prettier 冲突的格式规则

#### Scenario: Prettier 配置
- **WHEN** 用户启用 Prettier
- **THEN** Prettier 配置 SHALL 包含：`semi: true`、`singleQuote: true`、`tabWidth: 2`、`trailingComma: 'all'`
- **THEN** Prettier SHALL 配置为 `.prettierrc` 文件，而非在 `package.json` 中内联

### Requirement: Node.js 命名规范
NestJS 项目 SHALL 遵循 TypeScript 社区和 NestJS 框架的命名约定。

#### Scenario: 文件命名
- **WHEN** 创建新的模块文件
- **THEN** 类文件 SHALL 使用 PascalCase（`UserService.ts`）
- **THEN** 非类文件 SHALL 使用 kebab-case（`user.middleware.ts`）
- **THEN** Prisma Schema 文件 SHALL 使用 snake_case 表名和字段名

#### Scenario: Module/Controller/Service 命名
- **WHEN** 创建 NestJS 组件
- **THEN** Controller 类名 SHALL 以 `Controller` 结尾（`UsersController`）
- **THEN** Service 类名 SHALL 以 `Service` 结尾（`UsersService`）
- **THEN** Module 类名 SHALL 以 `Module` 结尾（`UsersModule`）

### Requirement: Prisma Schema 设计规范
Prisma Schema SHALL 遵循统一的设计模式，确保可维护性和可扩展性。

#### Scenario: Schema 组织
- **WHEN** 项目包含多个数据模型
- **THEN** Prisma Schema SHALL 使用 `prisma/schema.prisma` 单一文件（小型项目）或 `prisma/schema/` 目录拆分（大型项目）
- **THEN** 模型字段 SHALL 使用 `camelCase` 命名
- **THEN** 表名 SHALL 使用 `snake_case`（通过 `@@map("table_name")` 映射）

#### Scenario: 关联关系定义
- **WHEN** 模型之间存在关联
- **THEN** 关联关系 SHALL 显式使用 `@relation` 装饰器标注
- **THEN** 级联删除 SHALL 使用 `onDelete: Cascade`
