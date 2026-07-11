## ADDED Requirements

### Requirement: 查找第一个 active change

系统 SHALL 提供 `findFirstActiveChange(projectDir)` 函数，扫描 `openspec/changes/` 目录，排除 `archive/` 子目录，按目录名称排序后返回第一个包含 `tasks.md` 的 change。

#### Scenario: 单个 active change

- **WHEN** `openspec/changes/` 下存在一个子目录 `my-feature/`，其中包含 `tasks.md`
- **THEN** 系统 SHALL 返回 `ActiveChange { name: "my-feature", tasksPath: ".../my-feature/tasks.md", specsDir: ".../my-feature/specs", designPath: ".../my-feature/design.md" }`

#### Scenario: 多个 active change 按名称排序

- **WHEN** `openspec/changes/` 下存在 `b-feature/` 和 `a-feature/`，均包含 `tasks.md`
- **THEN** 系统 SHALL 返回名称排序靠前的 `a-feature`

#### Scenario: 跳过不含 tasks.md 的目录

- **WHEN** `openspec/changes/` 下存在 `empty/`（无 tasks.md）和 `valid/`（有 tasks.md）
- **THEN** 系统 SHALL 跳过 `empty/`，返回 `valid/`

#### Scenario: 不扫描 archive

- **WHEN** `openspec/changes/` 下仅有 `archive/` 子目录，无其他 active change
- **THEN** 系统 SHALL 返回 null

#### Scenario: 无任何 change

- **WHEN** `openspec/changes/` 目录不存在或为空
- **THEN** 系统 SHALL 返回 null

### Requirement: 按名称查找 change

系统 SHALL 提供 `findChangeByName(projectDir, name)` 函数，在 `openspec/changes/<name>/` 下查找指定名称的 change。

#### Scenario: 找到指定 change

- **WHEN** `openspec/changes/my-feature/tasks.md` 存在
- **THEN** `findChangeByName(projectDir, "my-feature")` SHALL 返回对应的 `ActiveChange`

#### Scenario: change 不存在

- **WHEN** `openspec/changes/` 下不存在指定名称的目录
- **THEN** 系统 SHALL 返回 null

#### Scenario: 目录存在但无 tasks.md

- **WHEN** `openspec/changes/my-feature/` 目录存在但不包含 `tasks.md`
- **THEN** 系统 SHALL 返回 null

### Requirement: ActiveChange 数据模型

系统 SHALL 定义 `ActiveChange` 接口，包含以下字段：`name`（目录名）、`dir`（完整路径）、`tasksPath`（tasks.md 路径）、`specsDir`（specs/ 目录路径，可能不存在）、`designPath`（design.md 路径，可能不存在）。

#### Scenario: ActiveChange 结构完整性

- **WHEN** 调用 `findFirstActiveChange` 或 `findChangeByName` 返回结果
- **THEN** 返回的 `ActiveChange` 对象 SHALL 包含所有五个字段，即使对应的文件/目录不存在
