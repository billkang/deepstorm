# Branch Naming Convention

## Purpose

DeepStorm 所有开发分支统一使用 Conventional Commit 类型的分支命名规范。分支名包含变更类型前缀，与提交信息类型、PR 标题类型保持一致，支持分支筛选和归类。

## Requirements

### Requirement: Branch name MUST include a Conventional Commit prefix

所有 DeepStorm 开发分支的名称必须以 Conventional Commit 类型前缀开头，后跟斜杠和 kebab-case 变更名。前缀帮助快速识别分支变更类型，支持分支筛选和归类。

#### Scenario: 创建带有效前缀的分支

- **WHEN** 开发者通过 `reef-start` 或其他分支创建入口创建一个新分支
- **THEN** 分支名格式必须为 `{prefix}/{change-name}`，其中 `{prefix}` 为允许的前缀之一，`{change-name}` 为 3-6 词英文 kebab-case

#### Scenario: 使用无效前缀创建分支

- **WHEN** 尝试使用不在允许前缀列表中的前缀创建分支（如 `update/add-user-auth`）
- **THEN** 分支创建流程 MUST 拒绝该分支名，并提示可用的前缀列表

#### Scenario: 不带前缀的纯 kebab-case 分支名

- **WHEN** 分支名以字母而非前缀开头（如 `add-user-auth`）
- **THEN** 分支创建流程 MUST 拒绝该分支名，要求添加前缀

### Requirement: 允许的前缀集

DeepStorm 支持 8 种 Conventional Commit 类型前缀，与提交信息中的类型对齐。

#### Scenario: 列举所有允许前缀

- **WHEN** 开发者需要查询可用的前缀类型
- **THEN** 系统返回以下 8 种前缀的完整列表：

  | 前缀 | 用途 | 说明 |
  |------|------|------|
  | `feat/` | 新功能 | 用户可见的新特性 |
  | `fix/` | Bug 修复 | 缺陷修复 |
  | `chore/` | 日常维护 | 配置、工具链、依赖更新 |
  | `refactor/` | 代码重构 | 不改变行为的代码结构调整 |
  | `docs/` | 文档 | 文档变更 |
  | `test/` | 测试 | 测试新增或修改 |
  | `perf/` | 性能优化 | 性能相关的改动 |
  | `style/` | 代码格式 | 格式化、空格、分号等 |

#### Scenario: 前缀选择指导

- **WHEN** 一个变更可能匹配多个前缀
- **THEN** 创建者 MUST 选择最能反映变更主要意图的前缀，避免使用 `chore/` 作为"不确定时的默认值"

### Requirement: 分支名与 OpenSpec change 目录的对应关系

分支名直接决定 `openspec/changes/` 下的目录路径。带前缀的分支名会产生分层目录结构。

#### Scenario: feat 前缀分支的目录对应

- **WHEN** 分支名为 `feat/add-user-auth`
- **THEN** OpenSpec change 目录为 `openspec/changes/feat/add-user-auth/`

#### Scenario: fix 前缀分支的目录对应

- **WHEN** 分支名为 `fix/login-error`
- **THEN** OpenSpec change 目录为 `openspec/changes/fix/login-error/`

### Requirement: 前缀的继承和传递

分支名中的前缀类型 SHOULD 在后续的工作流步骤中被沿用和传递，保持整个变更链路中的类型一致性。

#### Scenario: 从分支名到提交信息

- **WHEN** `deepstorm-commit` 生成提交信息时，当前分支为 `feat/add-user-auth`
- **THEN** 提交类型默认为 `feat`，提交信息格式为 `feat: <description>`

#### Scenario: 从分支名到 PR 标题

- **WHEN** `reef-pr` 创建 PR 时，当前分支为 `fix/login-error`
- **THEN** PR 标题 SHOULD 反映该类型标识
