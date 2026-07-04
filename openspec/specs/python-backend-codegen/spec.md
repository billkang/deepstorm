## ADDED Requirements

### Requirement: Python 后端代码生成工作流
`reef-gen-backend` 的 Python 变体 SHALL 提供 FastAPI 后端代码的生成步骤指导，包括 API 路由、Schema、Service、Model、Migration 的编码顺序。

#### Scenario: Python 变体包含 FastAPI 特有步骤
- **WHEN** 用户在 setup 中选择了 Python（FastAPI）作为后端语言
- **THEN** `variants/python/steps.md` 必须被复制到安装后的 `reef-gen-backend/` 目录中，包含 Python 特有的编码顺序（Schema → Model → Migration → Service → Router）和构建命令（`uv pip install` / `poetry add`）

#### Scenario: Python 变体的编码步骤包含 FastAPI 规范
- **WHEN** 开发者使用 `reef-gen-backend` 生成 Python 后端代码
- **THEN** 生成的步骤 MUST 包含：定义 Pydantic Schema → 创建 SQLAlchemy Model → 生成 Alembic migration → 实现 Service 层 → 定义 FastAPI Router → 注册到主应用

#### Scenario: 通用工作流骨架复用
- **WHEN** 渲染 `SKILL.md.tmpl` 且后端语言为 Python
- **THEN** 「找参考实现」「查阅规范」「运行验证」「提交前自检」等通用步骤必须保留，SMH 不需要复制到 `variants/python/` 中

### Requirement: Python 变体的模板变量映射
`wizard.json` 中 Python 选项的维度配置 SHALL 正确映射到 `SKILL.md.tmpl` 模板变量。

#### Scenario: 构建工具变量
- **WHEN** 用户选择了 Python(FastAPI) 作为后端语言
- **THEN** `{{reef.backend.language.buildTool}}` 必须替换为 `uv`（或用户在 setup 中选择的包管理器），`{{reef.backend.language.sourcePath}}` 必须替换为 `app/`

#### Scenario: 迁移工具变量
- **WHEN** 用户选择了 Alembic 作为迁移工具
- **THEN** `SKILL.md.tmpl` 渲染后必须在迁移章节中指导使用 `alembic revision --autogenerate` 和 `alembic upgrade head`

### Requirement: 生成后验证步骤
Python 变体的验证步骤 SHALL 包含 Python 特有的验证命令。

#### Scenario: 运行 lint 和类型检查
- **WHEN** 开发者完成代码生成后执行验证步骤
- **THEN** 步骤 MUST 包含运行 `ruff check .`、`mypy .` 和 `pytest` 的指引

#### Scenario: FastAPI 应用可启动
- **WHEN** 开发者按照生成步骤完成编码
- **THEN** 步骤 MUST 包含使用 `uv run uvicorn app.main:app --reload` 启动开发服务器的指引
