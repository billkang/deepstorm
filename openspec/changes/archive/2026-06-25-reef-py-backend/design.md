## Context

Reef 目前仅支持 Java（Spring Boot）后端，通过 `variants/java/` 目录提供语言特有的编码步骤、规范文档和审查清单。Python（FastAPI）作为业界主流后端技术栈，在代码生成、规范指导、代码审查、工具链集成等方面与 Java 有显著差异，需要在现有模板体系中新增 Python 变体。

当前 reef 的模板架构：
- `SKILL.md.tmpl` — 语言无关的通用工作流骨架，通过 Handlebars 渲染
- `variants/{lang}/` — 每种语言的专属内容（steps.md、quick-reference.md、agent.md 等）
- `wizard.json` — 安装向导配置，控制 `affectedTemplates` 和 `fragments`
- Hooks（`.sh.tmpl` / `.sh`）— 通过文件扩展名区分语言

## Goals / Non-Goals

**Goals:**
- 为 `reef-gen-backend`、`reef-style-backend`、`reef-review-backend` 新增 Python（FastAPI）变体
- 为 `reef-auto-format` hook 增加 Python 格式化（ruff）分支
- 为 `reef-run-tests` hook 增加 Python 测试（pytest）分支
- 在 `wizard.json` 中增加 Python 作为后端语言选项
- 技术栈覆盖：FastAPI + SQLAlchemy + Alembic + pytest + ruff/black + mypy + LangChain

**Non-Goals:**
- 不修改现有 Java 变体
- 不引入新的模板渲染机制（复用现有 Handlebars + .tmpl）
- 不改变 hook 架构（复用现有 shell script 分支逻辑）
- 不引入 Python 前端支持（非本变更范围）
- 不修改 wizard.json 中 Java 现有配置

## Decisions

### Decision 1: 变体目录镜像 Java 结构

**选择：** Python 变体使用 `variants/python/`，与 `variants/java/` 保持对等结构。

| Java 路径 | Python 路径 |
|-----------|-------------|
| `skills/reef-gen-backend/variants/java/steps.md` | `skills/reef-gen-backend/variants/python/steps.md` |
| `skills/reef-style-backend/variants/java/quick-reference.md` | `skills/reef-style-backend/variants/python/quick-reference.md` |
| `skills/reef-style-backend/variants/java/examples/` | `skills/reef-style-backend/variants/python/examples/` |
| `agents/reef-review-backend/variants/java/reef-review-backend.md` | `agents/reef-review-backend/variants/python/reef-review-backend.md` |

**备选方案：** 将 Python 变体放在独立目录 `variants/python-fastapi/`——拒绝，因为与技术栈无关，且破坏与 Java 的对等性。

### Decision 2: Hook 通过文件扩展名派发语言

**选择：** 在现有 shell hook 中添加文件扩展名判断分支。

```
if [[ "$file" == *.py ]]; then
  ruff format "$file"       # auto-format
  python -m pytest          # run-tests
elif [[ "$file" == *.java ]]; then
  google-java-format "$file" # auto-format
  ./gradlew test             # run-tests
fi
```

**备选方案：** 拆分独立的 `reef-auto-format-python.sh`——拒绝，增加维护复杂度，且与现有架构不一致。分支方式更轻量。

### Decision 3: 模板变体通过 `{{reef.backend.language.type}}` 控制

**选择：** 复用现有的 wizard.json `affectedTemplates` 机制。Python 选项的 `affectedTemplates` 包含与 Java 相同的模板集，`fragments` 指向 Python 特有的 fragment 文件。

**备选方案：** 在 SKILL.md.tmpl 中用 `{{#if_eq language 'python'}}` 条件块——拒绝，因为变体文件（steps.md 等）本身就是完整的语言专属文件，更适合在 `variants/` 中独立维护，而非混入模板条件。

### Decision 4: Python 技术栈默认值

**选择：** 在 wizard.json 中为 Python 设置以下默认值：

| 维度 | 默认值 | 可选值 |
|------|--------|--------|
| Web 框架 | fastapi | fastapi |
| ORM | sqlalchemy | sqlalchemy / django-orm |
| 数据库迁移 | alembic | alembic / django-migrations |
| AI 框架 | （不选） | langchain / llamaindex |
| 测试框架 | pytest | pytest / unittest |
| 类型检查 | mypy | mypy / pyright |
| 格式化工具 | ruff | ruff / black |

**备选方案：** 不做默认值约束，让用户自由填写——拒绝，安装向导的体验应该与 Java 一致：提供选项而非自由输入。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| Python 用户环境中未安装 ruff/pytest/mypy，hook 执行失败 | Hook 脚本先检测命令是否可用，不可用时静默跳过 |
| Python 生态版本碎片化（Python 3.9–3.13） | 编码规范中标注最低 Python 版本要求（>=3.10），建议使用 `pyproject.toml` 约束 |
| FastAPI + SQLAlchemy 异步配置复杂，初学者容易出错 | steps.md 中提供完整的异步配置参考（async_sessionmaker、AsyncSession） |
| Python 变体与 Java 变体结构不一致导致维护混乱 | 严格镜像 Java 变体的目录结构和文件命名，在 CLAUDE.md 中记录此约定 |
| wizard.json 选项膨胀，Java 和 Python 维度过长 | 选择前端/后端后，只显示所选技术栈的维度；Python 不显示 Java 特有的维度（如 Gradle/Maven） |

## Open Questions

- Python 用户的包管理器偏好如何？是使用 `uv`（推荐）、`poetry`、`pip-tools` 还是裸 `pip`？需要 wizard.json 中增加一个包管理器维度吗？
- Python AI 框架的首选：`langchain` 还是 `llamaindex`？当前两者都支持，但 examples 应该以哪个为主？
