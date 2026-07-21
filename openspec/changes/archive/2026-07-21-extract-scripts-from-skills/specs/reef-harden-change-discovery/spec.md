## ADDED Requirements

### Requirement: Change 目录自动发现
reef-harden 的上下文约定部分 SHALL 通过 `find-change-dir.mjs` 自动定位当前活跃的 OpenSpec change 目录。

#### Scenario: 分支名与 change 目录匹配
- **WHEN** 当前分支名匹配 `openspec/changes/<name>/` 中的一个目录
- **THEN** 脚本输出 `{ "changeName": "<name>", "changeDir": "openspec/changes/<name>/", "files": [...] }`

#### Scenario: 分支名不匹配但有活跃 change
- **WHEN** 当前分支名不匹配任何 change 目录
- **THEN** 脚本按文件修改时间排序，返回最近活跃的 change 信息，附带可选列表

#### Scenario: 无任何 OpenSpec change
- **WHEN** `openspec/changes/` 目录不存在，或其中只有 `archive/` 子目录
- **THEN** 脚本输出 `{ "noMatch": true, "branch": "<current>", "suggestion": null }`，exit code 0

### Requirement: 文档列表收集
`find-change-dir.mjs` SHALL 额外提供 `--files` 模式，输出指定 change 目录下的所有 SDD 文档路径。

#### Scenario: 列出 change 下的文档
- **WHEN** 调用 `find-change-dir.mjs --change <name> --files`
- **THEN** 输出包含 `changeName` 和 `files[]` 数组（所有 `.md` 文件路径）
