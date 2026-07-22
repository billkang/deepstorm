## ADDED Requirements

### Requirement: NestJS 架构审查
reef-review-backend agent 的 Node.js 变体 SHALL 包含 NestJS 特有的架构审查规则。

#### Scenario: Module 设计审查
- **WHEN** 审查 NestJS 代码
- **THEN** 审查 agent SHALL 检查每个 Module 是否遵循单一职责原则
- **THEN** 审查 agent SHALL 报告 `providers` 数组中的 Service 是否在模块外部被引用而未导出
- **THEN** 审查 agent SHALL 报告跨模块的循环依赖（circular dependency）

#### Scenario: Controller 审查
- **WHEN** 审查 NestJS Controller
- **THEN** 审查 agent SHALL 检查路由路径命名规范（kebab-case）
- **THEN** 审查 agent SHALL 检查 HTTP 方法映射是否正确（GET/POST/PUT/DELETE）
- **THEN** 审查 agent SHALL 报告未使用 `@HttpCode()`、`@ApiResponse()` 装饰器的方法

#### Scenario: Service 层审查
- **WHEN** 审查 NestJS Service
- **THEN** 审查 agent SHALL 检查业务逻辑是否在 Service 层而非 Controller 层
- **THEN** 审查 agent SHALL 报告未捕获的异步异常（缺少 try/catch 或全局异常过滤器）
- **THEN** 审查 agent SHALL 检查事务处理是否正确（Prisma `$transaction`）

### Requirement: Prisma 查询审查
审查 agent SHALL 检查 Prisma 查询中的常见性能问题和反模式。

#### Scenario: N+1 查询检测
- **WHEN** 审查包含 Prisma 查询的代码
- **THEN** 审查 agent SHALL 标记未使用 `include` 或 `select` 进行关联查询的地方
- **THEN** 审查 agent SHALL 建议使用 `include` 替代循环中的逐条查询

#### Scenario: 批量操作审查
- **WHEN** 审查批量数据库操作
- **THEN** 审查 agent SHALL 建议在循环中逐条 `create` 时改用 `createMany`
- **THEN** 审查 agent SHALL 建议在循环中逐条 `update` 时改用 `$transaction` + `updateMany`

#### Scenario: Schema 设计审查
- **WHEN** 审查 Prisma Schema
- **THEN** 审查 agent SHALL 标记缺少 `@unique` 或 `@@unique` 约束的字段
- **THEN** 审查 agent SHALL 标记缺少索引的关联字段
- **THEN** 审查 agent SHALL 检查 `@relation` 是否显式声明了 `onDelete` 行为

### Requirement: TypeScript 代码审查
审查 agent SHALL 包含 TypeScript 相关的代码质量规则。

#### Scenario: 类型安全审查
- **WHEN** 审查 TypeScript 代码
- **THEN** 审查 agent SHALL 报告显式使用 `any` 类型的地方，建议使用 `unknown` 或具体类型
- **THEN** 审查 agent SHALL 报告未使用的类型参数和变量
- **THEN** 审查 agent SHALL 检查 `strict` 模式下的常见类型错误
