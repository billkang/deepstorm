## ADDED Requirements

### Requirement: 后端 fragment quick-reference 文件合并
reef-style-backend 技能的 fragments 目录中，`quick-reference/` 子目录下的碎片文件 SHALL 合并为单个 `quick-reference.md`，碎片源文件删除。

#### Scenario: spring-boot quick-reference 合并
- **WHEN** 用户在 `fragments/java/framework/spring-boot/` 下查看
- **THEN** `quick-reference/` 子目录及其中 9 个碎片文件（`_index.md`、`controller.md`、`service.md`、`repository.md`、`dto.md`、`mapstruct.md`、`exception.md`、`security.md`、`testing.md`）不存在，内容合并到 `quick-reference.md` 中

#### Scenario: hibernate quick-reference 合并
- **WHEN** 用户在 `fragments/java/orm/hibernate/` 下查看
- **THEN** `quick-reference/` 子目录中 3 个碎片文件（`_index.md`、`entity.md`、`entity-hierarchy.md`）不存在，内容合并为 `quick-reference.md`

#### Scenario: junit5 占位文件
- **WHEN** 用户在 `fragments/java/test/junit5/` 下查看
- **THEN** `quick-reference.md` 文件存在（之前该目录为空）

### Requirement: 前端 fragment quick-reference 文件合并
reef-style-frontend 技能的 fragments 目录中，`quick-reference/` 子目录下的碎片文件 SHALL 合并为单个 `quick-reference.md`。

#### Scenario: primeng quick-reference 合并
- **WHEN** 用户在 `fragments/ui-lib/primeng/` 下查看
- **THEN** `quick-reference/` 中 3 个碎片文件（`_index.md`、`primeng.md`、`ui-best-practices.md`）不存在，内容合并为 `quick-reference.md`

#### Scenario: vitest quick-reference 合并
- **WHEN** 用户在 `fragments/test/vitest/` 下查看
- **THEN** `quick-reference/` 中 2 个碎片文件（`_index.md`、`testing.md`）不存在，内容合并为 `quick-reference.md`

### Requirement: 变体 quick-reference 文件合并
variants 目录中 `quick-reference/` 子目录下的碎片文件 SHALL 合并为单个 `quick-reference.md`。

#### Scenario: java 变体文件合并
- **WHEN** 用户在 `variants/java/` 下查看
- **THEN** `quick-reference/` 子目录及其中 4 个碎片文件（`_index.md`、`code-style.md`、`field-comment.md`、`domain-event.md`）不存在，内容合并为 `quick-reference.md`

#### Scenario: angular 变体文件合并
- **WHEN** 用户在 `variants/angular/` 下查看
- **THEN** `quick-reference/` 子目录及其中碎片文件不存在，内容合并为 `quick-reference.md`
