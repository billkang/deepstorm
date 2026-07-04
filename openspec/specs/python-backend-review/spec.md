## ADDED Requirements

### Requirement: Python 后端代码审查 Checklist
`reef-review-backend` 的 Python 变体（`variants/python/reef-review-backend.md`）SHALL 提供针对 FastAPI 项目的代码审查 checklist，涵盖安全、性能、架构、规范合规四个维度。

#### Scenario: 安全审查项
- **WHEN** agent 审查 Python 后端代码
- **THEN** checklist MUST 包含以下安全审查点：
  - 输入验证：Pydantic Schema 是否使用正确类型约束
  - SQL 注入：是否使用 ORM 参数化查询而非原始 SQL
  - 认证：FastAPI 路由是否使用 `Depends(get_current_user)` 保护
  - 授权：管理员接口是否验证角色权限
  - CORS：生产环境是否限制了 `allow_origins`
  - 敏感信息：是否误将 SECRET_KEY、数据库密码硬编码在代码中

#### Scenario: 性能审查项
- **WHEN** agent 审查 Python 后端代码
- **THEN** checklist MUST 包含以下性能审查点：
  - N+1 查询：SQLAlchemy 查询是否使用 `selectinload` / `joinedload` 预加载关联
  - 异步：耗时 I/O 操作是否使用 `async/await`
  - 数据库索引：WHERE 条件和 JOIN 列是否有索引
  - API 响应分页：列表接口是否有分页参数

#### Scenario: 架构审查项
- **WHEN** agent 审查 Python 后端代码
- **THEN** checklist MUST 包含以下架构审查点：
  - 分层职责：Router 是否仅做路由和参数校验，业务逻辑在 Service 层
  - Schema 分离：Request 和 Response Schema 是否分离
  - 单一路由对应一个 Service：避免 Router 中混入业务逻辑
  - 循环导入：是否存在包间循环依赖

#### Scenario: 规范审查项
- **WHEN** agent 审查 Python 后端代码
- **THEN** checklist MUST 包含以下规范合规审查点：
  - 命名规范：snake_case、PascalCase 是否正确
  - ruff/black 合规：代码是否通过 ruff 检查和 black 格式化
  - mypy 合规：是否通过 mypy 类型检查
  - 测试覆盖：是否包含对应的 pytest 测试

### Requirement: Python 审查 agent 的路径和角色
Python 变体的 agent 文件 SHALL 使用正确的引用路径，并在审查报告中明确标记 Python 审查角色。

#### Scenario: agent 文件引用
- **WHEN** `reef-review` skill 协同调度 Python 审查
- **THEN** 引用的 agent 路径 MUST 使用 `../../agents/reef-review-backend.md`（指向 `.claude/agents/`），且通过 `{{reef.backend.language.type}}` 模板变量动态选择 Python 还是 Java 变体

#### Scenario: 审查报告标识
- **WHEN** agent 输出审查报告
- **THEN** 报告 MUST 明确标注「# Python（FastAPI）后端审查」作为标题，以便在多语言项目中区分
