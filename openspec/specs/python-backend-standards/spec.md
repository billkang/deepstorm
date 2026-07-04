## ADDED Requirements

### Requirement: Python 后端编码规范覆盖八个维度
`reef-style-backend` 的 Python 变体 SHALL 提供完整的编码规范 quick-reference，覆盖以下八个维度：语言/平台 → Web 框架 → ORM → 数据库迁移 → AI 框架 → 测试规范 → 类型检查 → 格式化。

#### Scenario: 快速参考文件包含所有维度
- **WHEN** 用户在 setup 中选择了 Python(FastAPI) 作为后端语言
- **THEN** `variants/python/quick-reference.md` 必须包含 FastAPI 路由规范、SQLAlchemy 模型规范、Alembic 迁移规范、pytest 测试规范、ruff/black/mypy 配置规范

#### Scenario: 维度可按需加载
- **WHEN** 用户在 setup 中选择了 Python 但未选择 AI 框架
- **THEN** AI 框架维度的内容不应出现在安装后的 `quick-reference.md` 中

### Requirement: 项目结构规范
Python 变体 SHALL 定义 FastAPI 项目的标准目录结构规范。

#### Scenario: 推荐目录结构
- **WHEN** 开发者在 Python 项目中查阅 `reef-style-backend`
- **THEN** 规范 MUST 推荐以下目录结构：
```
app/
├── api/v1/           # FastAPI routers
├── core/             # 配置、中间件
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic schemas
├── services/         # 业务逻辑层
├── migrations/       # Alembic migrations
├── tasks/            # Celery/ARQ tasks
└── tests/            # pytest tests
```

#### Scenario: 命名规范
- **WHEN** 开发者编写 Python 后端代码
- **THEN** 规范 MUST 要求：模块和包使用 snake_case、类名使用 PascalCase、函数和变量使用 snake_case、常量使用 UPPER_SNAKE_CASE、API 路由使用 kebab-case

### Requirement: FastAPI 最佳实践
Python 变体 SHALL 包含 FastAPI 框架的关键最佳实践。

#### Scenario: Pydantic Schema 位置
- **WHEN** 创建 API Schema
- **THEN** 规范 SHOULD 建议将 Request Schema 和 Response Schema 分开定义，分别以 `*Request` / `*Response` 后缀命名

#### Scenario: 依赖注入
- **WHEN** 实现 Service 层
- **THEN** 规范 MUST 使用 FastAPI `Depends()` 进行依赖注入，而非在 Router 中直接实例化 Service

#### Scenario: 错误处理
- **WHEN** API 处理中发生业务异常
- **THEN** 规范 MUST 使用自定义 HTTPException，统一注册全局异常处理器

### Requirement: SQLAlchemy 使用规范
Python 变体 SHALL 包含 SQLAlchemy 的规范使用指导。

#### Scenario: 会话管理
- **WHEN** 使用 SQLAlchemy 进行数据库操作
- **THEN** 规范 MUST 使用 `AsyncSession` + `async_sessionmaker` 实现异步会话管理，禁止同步数据库操作

#### Scenario: 模型定义
- **WHEN** 定义数据库模型
- **THEN** 规范 MUST 要求所有模型继承自共享的 `Base`，使用 `Mapped` + `mapped_column`（v2.0 style），而非旧的 `Column` + `declarative_base()`

### Requirement: pytest 测试规范
Python 变体 SHALL 包含 pytest 测试规范。

#### Scenario: 测试组织结构
- **WHEN** 开发者编写测试
- **THEN** 测试文件 SHOULD 按照 `tests/unit/`（单元测试）和 `tests/integration/`（集成测试）组织，使用 pytest fixture 管理依赖

#### Scenario: 测试标记
- **WHEN** 运行测试
- **THEN** 集成测试 SHOULD 使用 `@pytest.mark.integration` 标记以便选择性执行

### Requirement: 工具链配置规范
Python 变体 SHALL 包含 ruff、black、mypy 的推荐配置规范。

#### Scenario: ruff 配置
- **WHEN** 配置 linter
- **THEN** ruff SHOULD 启用 `F`(Pyflakes)、`E`(pycodestyle)、`I`(isort)、`N`(pep8-naming) 规则组，禁用行长度检查将其交给 black

#### Scenario: mypy 严格模式
- **WHEN** 配置类型检查
- **THEN** mypy SHOULD 在 `strict = true` 模式下运行，或至少启用 `--check-untyped-defs`
