## Why

Reef 当前仅支持 Java（Spring Boot）后端，而 Python（FastAPI）是业界最主流的后端技术栈之一。增加 Python 后端支持可以让 reef 覆盖更广泛的开发者群体，使 DeepStorm 在 Python 生态中具备与 Java 同等的开发体验：代码生成、规范指导、代码审查、自动格式化和测试集成都一致可用。

## What Changes

- **新增** `reef-gen-backend` 的 Python 变体（`variants/python/steps.md`）：FastAPI 后端代码生成流程
- **新增** `reef-style-backend` 的 Python 变体（`variants/python/quick-reference.md` + `examples/`）：Python 后端编码规范
- **新增** `reef-review-backend` agent 的 Python 变体（`variants/python/reef-review-backend.md`）：Python 后端代码审查
- **修改** `reef-auto-format.sh.tmpl`：增加 Python 格式化（ruff + black）
- **修改** `reef-run-tests.sh`：增加 Python 测试运行（pytest）
- **修改** `wizard.json`：后端语言增加 Python 选项及对应技术栈维度
- **不变**：所有 Java 现有变体保持不变

## Capabilities

### New Capabilities
- `python-backend-codegen`: Python 后端代码生成工作流 — FastAPI 项目的 API 路由、Service、Model、Schema、Migration 的生成步骤指南
- `python-backend-standards`: Python 后端编码规范 — 包含项目结构、命名规范、FastAPI 最佳实践、SQLAlchemy 使用规范、pytest 测试规范、ruff/black/mypy 配置规范
- `python-backend-review`: Python 后端代码审查 — 针对 FastAPI 项目的安全、性能、架构、规范合规的审查 checklist
- `python-dev-toolchain`: Python 开发工具链集成 — 自动格式化（ruff）、测试运行（pytest）、CLI 向导（wizard.json）

### Modified Capabilities
无（此变更为全新能力，不修改现有 spec）

## Impact

| 范围 | 影响 |
|------|------|
| `packages/reef/skills/reef-gen-backend/variants/` | **新增** `python/` 目录（steps.md） |
| `packages/reef/skills/reef-style-backend/variants/` | **新增** `python/` 目录（quick-reference.md + examples/） |
| `packages/reef/skills/reef-style-backend/fragments/` | **新增** Python 各维度的 fragment 文件 |
| `packages/reef/agents/reef-review-backend/variants/` | **新增** `python/reef-review-backend.md` |
| `packages/reef/hooks/reef-auto-format.sh.tmpl` | **修改** — 增加 Python 格式化分支 |
| `packages/reef/hooks/reef-run-tests.sh` | **修改** — 增加 pytest 分支 |
| `packages/reef/wizard.json` | **修改** — 后端语言增加 Python |
| Java 变体 | **无影响**（保持不变） |
