# Brainstorming Session

- **日期**：2026-06-25
- **主题**：Reef Python 后端支持 — 为 reef 增加 Python（FastAPI）后端代码编写、规范和审查能力
- **参与角色**：用户（Bill Kang）、AI 助手

## 讨论过程

### 初始需求

用户提出："后端代码需要支持 Python，为 reef 增加相应能力。"

### 现状分析

Reef 当前仅支持 Java 后端（Spring Boot 体系），包括：
- `reef-gen-backend` → `variants/java/steps.md`
- `reef-style-backend` → `variants/java/quick-reference.md` + examples
- `reef-review-backend` (agent) → `variants/java/reef-review-backend.md`
- `reef-auto-format` (hook) → 仅 google-java-format / spotlessApply
- `reef-run-tests` (hook) → 仅 gradlew test
- `wizard.json` → 后端语言仅 Java

### 关键澄清回合

**第一轮（技术栈选型）：** 询问 Python Web 框架倾向，用户选择 **FastAPI 主导**。

| 维度 | 选择 |
|------|------|
| Web 框架 | FastAPI |
| ORM | SQLAlchemy |
| 数据库迁移 | Alembic |
| 测试框架 | pytest |
| 格式化/检查 | ruff + black |
| 类型检查 | mypy / pyright |
| AI 集成 | LangChain / LlamaIndex |

**第二轮（实现范围）：** 用户选择 **全量支持**，一次性覆盖所有相关组件：
- gen-backend steps.md
- style-backend quick-reference + examples
- review-backend checklist
- auto-format / run-tests hooks
- wizard.json

### 需求要点

1. Python 后端代码生成流程（reef-gen-backend）
2. Python 后端编码规范（reef-style-backend）
3. Python 后端代码审查 checklist（reef-review-backend agent）
4. Python 自动格式化 hook（ruff）
5. Python 测试运行 hook（pytest）
6. CLI 安装向导增加 Python 后端选项（wizard.json）

### 边界范围

- **第一版不做**：Python 前端支持（如有需要后续独立变更）
- **明确不做的**：不影响现有 Java 变体；Java 支持维持不变；不引入新的第三方依赖

## 关键决策

1. Python 变体结构和 Java 变体保持对等（`variants/python/`）
2. 编码规范覆盖八个维度：语言/平台 → Web 框架(FastAPI) → ORM(SQLAlchemy) → 数据库迁移(Alembic) → AI 框架(LangChain) → 测试(pytest) → 类型检查(mypy) → 格式化(ruff)
3. 模板渲染沿用现有 `.tmpl` 机制，通过 `wizard.json` 的 `affectedTemplates` 控制
4. 全量并行实现，不分阶段

## 后续步骤

- Step 2: 创建 OpenSpec change
- Step 3: Proposal（完整的需求描述和 Capabilities）
- Step 4: Specs（WHEN/THEN 场景规范）
- Step 5: Design（技术决策）
- Step 6: Tasks（实现任务分解）
- → superpowers → apply → verify → archive

## 变更名前瞻

`reef-py-backend`（英文 kebab-case，3-6 词）
