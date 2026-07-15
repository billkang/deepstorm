# post-task-verification Specification

## Purpose
TBD - created by archiving change reef-start-lattice-adaptation. Update Purpose after archive.
## Requirements
### Requirement: 每个 task 完成前强制验证

reef-start SHALL 在阶段四每个 task 标记完成前，增加 build + lint + test 的强制验证步骤。任何一步失败，该 task SHALL NOT 被标记为完成。

#### Scenario: plan mode 的后置验证
- **WHEN** Agent 在 plan mode 下完成一个 task 的实现
- **THEN** Agent SHALL 依次执行 build、lint、test（关联用例）
- **AND** 三步全部通过后，方可将 task 标记为 ✅ 已完成

#### Scenario: tdd mode 的后置验证
- **WHEN** Agent 在 tdd mode 下完成一个 task 的 REFACTOR 步骤
- **THEN** Agent SHALL 再次执行 build、lint、test（完整测试套件）
- **AND** 三步全部通过后，方可将 task 标记为 ✅ 已完成

#### Scenario: build 失败阻止标记完成
- **WHEN** `npm run build`（或等效构建命令）返回非零退出码
- **THEN** Agent SHALL NOT 将 task 标记为完成
- **AND** Agent SHALL 输出构建错误信息并进入修复流程

#### Scenario: lint 失败阻止标记完成
- **WHEN** `npm run lint`（或等效 lint 命令）返回非零退出码
- **THEN** Agent SHALL NOT 将 task 标记为完成
- **AND** Agent SHALL 自动修复可自动修复的 lint 问题，剩余问题输出供人工处理

#### Scenario: test 失败阻止标记完成
- **WHEN** `npm test -- --related`（或等效测试命令）存在失败用例
- **THEN** Agent SHALL NOT 将 task 标记为完成
- **AND** Agent SHALL 输出失败用例详情并进入修复流程

### Requirement: 框架自适应的验证命令

后置验证 SHALL 根据项目技术栈自动选择对应的 build/lint/test 命令。

#### Scenario: Spring Boot 项目验证命令
- **WHEN** 项目技术栈为 Java Spring Boot
- **THEN** 验证命令 SHALL 使用 `mvn compile`（build）、`mvn checkstyle:check`（lint）、`mvn test`（test）

#### Scenario: FastAPI 项目验证命令
- **WHEN** 项目技术栈为 Python FastAPI
- **THEN** 验证命令 SHALL 使用 `ruff check` 或 `pylint`（lint）、`pytest`（test），build 检查 pip install 或 poetry install 的 dry-run

#### Scenario: 验证命令不存在时的兜底
- **WHEN** 无法自动推断或项目尚未搭建对应工具链
- **THEN** Agent SHALL 询问用户当前可用的验证命令
- **AND** 将结果写入 SKILL.md 当前的 task 笔记中复用

