## 1. Setup

- [x] 1.1 Create `skills/reef-gen-backend/variants/python/` 目录
- [x] 1.2 Create `skills/reef-style-backend/variants/python/` 目录
- [x] 1.3 Create `skills/reef-style-backend/fragments/python/` 目录
- [x] 1.4 Create `skills/reef-style-backend/variants/python/examples/` 目录
- [x] 1.5 Create `agents/reef-review-backend/variants/python/` 目录
- [x] 1.6 阅读现有 `variants/java/` 内容作为结构参考

## 2. Python 编码规范（reef-style-backend）

- [x] 2.1 创建 `variants/python/quick-reference.md`：FastAPI 项目结构、命名规范、Pydantic Schema、SQLAlchemy 模型、Alembic 迁移、pytest 测试、ruff/black/mypy 配置
- [x] 2.2 创建 `fragments/python/fastapi-quick-reference.md`：FastAPI 最佳实践 fragment（依赖注入、异常处理、路由组织）
- [x] 2.3 创建 `fragments/python/sqlalchemy-orm.md`：SQLAlchemy v2.0 style 使用规范 fragment（async_session、Mapped/mapped_column）
- [x] 2.4 创建 `fragments/python/alembic-migration.md`：Alembic 迁移实践 fragment（autogenerate、revision 管理）
- [x] 2.5 创建 `fragments/python/pytest-testing.md`：pytest 测试规范 fragment（fixture、mark、async test）
- [x] 2.6 创建 `fragments/python/ruff-mypy-toolchain.md`：ruff + mypy 配置规范 fragment
- [x] 2.7 创建 `variants/python/examples/` 示例代码（FastAPI CRUD router、SQLAlchemy Model、Pydantic Schema、pytest fixture）

## 3. Python 后端代码生成（reef-gen-backend）

- [x] 3.1 创建 `variants/python/steps.md`：Python（FastAPI）后端代码生成流程步骤

## 4. Python 后端代码审查（reef-review-backend agent）

- [x] 4.1 创建 `variants/python/reef-review-backend.md`：Python 后端代码审查 checklist（安全、性能、架构、规范合规）

## 5. Python 开发工具链集成

- [x] 5.1 修改 `hooks/reef-auto-format.sh.tmpl`：增加 Python 文件格式化分支（ruff format / black）
- [x] 5.2 修改 `hooks/reef-run-tests.sh`：增加 Python 测试运行分支（python -m pytest）
- [x] 5.3 修改 `wizard.json`：后端语言增加 Python 选项及对应技术栈维度（FastAPI / SQLAlchemy / Alembic / pytest / mypy / ruff / LangChain）

## 6. 验证

- [x] 6.1 确认 `variants/python/` 目录结构与 `variants/java/` 对等
- [x] 6.2 确认所有模板引用路径正确
- [x] 6.3 确认 wizard.json 中 Python 选项维度完整
