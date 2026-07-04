## ADDED Requirements

### Requirement: Python 自动格式化 Hook
`reef-auto-format.sh.tmpl` SHALL 在检测到 Python 文件变更时，使用 ruff 进行格式化，而非 Java 的 `google-java-format`。

#### Scenario: Python 文件格式化
- **WHEN** 用户编辑 `.py` 文件后触发 `PostToolUse` hook
- **THEN** hook 脚本 MUST 对修改过的 `.py` 文件运行 `ruff format`，且只在 `ruff` 命令可用时执行

#### Scenario: 语言自动识别
- **WHEN** hook 被触发
- **THEN** MUST 根据文件扩展名（`.py` → ruff / black，`.java` → google-java-format）自动选择对应的格式化工具，避免对 Java 文件误用 Python 工具

#### Scenario: 格式化工具不存在时的降级
- **WHEN** `ruff` 命令不可用
- **THEN** hook SHOULD 尝试 `black` 作为替代，两者都不可用时 SHALL 静默跳过而非报错退出

### Requirement: Python 测试运行 Hook
`reef-run-tests.sh` SHALL 在检测到 Python 代码变更时，运行 pytest 而非 gradle 测试。

#### Scenario: Python 测试触发
- **WHEN** 用户编辑 `.py` 文件，触发 `PostToolUse` 或 `Stop` hook
- **THEN** hook 脚本 MUST 检查 `pytest` 是否可用，可用时运行 `python -m pytest`，不可用时静默跳过

#### Scenario: 无测试文件时的行为
- **WHEN** 项目没有 `tests/` 目录或 `pytest.ini` / `pyproject.toml` 中未配置 pytest
- **THEN** hook SHALL 静默跳过，不报错

#### Scenario: 测试超时
- **WHEN** pytest 运行时间超过 30 秒
- **THEN** hook 的行为与现有 Java 分支一致：超时后放行，不阻塞用户

### Requirement: CLI 安装向导增加 Python 选项
`wizard.json` SHALL 在后端技术栈中增加 Python 作为可选语言，包含对应的技术栈维度选项。

#### Scenario: Python 语言维度
- **WHEN** 用户运行 `npx @deepstorm/cli setup` 并选择后端技术
- **THEN** 语言选项 MUST 同时包含 `Java` 和 `Python` 作为可选项

#### Scenario: Python 特有的技术栈维度
- **WHEN** 用户选择 Python 作为后端语言
- **THEN** 以下维度 MUST 出现并允许用户配置：
  - Web 框架（默认 `fastapi`）
  - ORM（默认 `sqlalchemy`）
  - 数据库迁移工具（默认 `alembic`）
  - AI 框架（可选 `langchain` / `llamaindex`）
  - 测试框架（默认 `pytest`）
  - 类型检查器（默认 `mypy`）
  - 格式化工具（默认 `ruff`）

#### Scenario: affectedTemplates 注册
- **WHEN** 用户在 setup 中选择了 Python 作为后端语言
- **THEN** `affectedTemplates` MUST 包含 `skills/reef-gen-backend/SKILL.md.tmpl`、`skills/reef-style-backend/SKILL.md.tmpl` 和 `agents/reef-review-backend.md.tmpl`

#### Scenario: Python 选项的 fragments
- **WHEN** 用户在 setup 中选择了 Python
- **THEN** `fragments` MUST 包含以下文件引用：
  - `skills/reef-style-backend/fragments/python/fastapi-quick-reference.md`
  - `skills/reef-style-backend/fragments/python/sqlalchemy-orm.md`
  - `skills/reef-style-backend/fragments/python/alembic-migration.md`
  - `skills/reef-style-backend/fragments/python/pytest-testing.md`
  - `skills/reef-style-backend/fragments/python/ruff-mypy-toolchain.md`
