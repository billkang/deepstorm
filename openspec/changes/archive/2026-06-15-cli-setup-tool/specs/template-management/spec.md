## ADDED Requirements

### Requirement: 查看可用模板（template list）

CLI SHALL 支持 `deepstorm template list [工具]` 查看所有可用的 skill 模板。

#### Scenario: 列出所有模板
- **WHEN** 用户运行 `deepstorm template list`
- **THEN** CLI 读取 `registry.json`，输出所有技能的名称、所属工具和描述
- **THEN** 格式如 "reef-react-lint（Reef）- React 代码规范检查"

#### Scenario: 按工具过滤
- **WHEN** 用户运行 `deepstorm template list reef`
- **THEN** CLI 只输出 reef 相关的 skill 列表

### Requirement: 导出模板（template init）

CLI SHALL 支持 `deepstorm template init [工具] [能力]` 将 skill 的默认内容导出到 `.deepstorm/templates/` 供用户修改。

#### Scenario: 导出单个 skill
- **WHEN** 用户运行 `deepstorm template init reef react-lint`
- **THEN** CLI 从源 `skills/reef-react-lint/` 复制整个目录到 `.deepstorm/templates/reef-react-lint/`
- **THEN** CLI 输出 "✔ 模板已导出到 .deepstorm/templates/reef-react-lint/"
- **THEN** CLI 提示"修改完成后运行 `deepstorm template apply reef react-lint` 应用更改"

#### Scenario: 导出已存在的模板
- **WHEN** `.deepstorm/templates/reef-react-lint/` 已存在
- **THEN** CLI 询问"模板已存在，是否覆盖？[y/N]"

#### Scenario: 导出指定工具的 skill 模板
- **WHEN** 用户运行 `deepstorm template init reef`
- **THEN** CLI 导出所有 reef 相关的 skill 到 `.deepstorm/templates/`
- **THEN** 每个 skill 单独一个子目录

### Requirement: 应用模板（template apply）

CLI SHALL 支持 `deepstorm template apply [工具] [能力]` 将用户修改后的模板应用到 `.claude/skills/`。

#### Scenario: 应用修改后的模板
- **WHEN** 用户修改了 `.deepstorm/templates/reef-react-lint/SKILL.md` 后运行 `deepstorm template apply reef react-lint`
- **THEN** CLI 从 `.deepstorm/templates/reef-react-lint/` 复制到 `.claude/skills/reef-react-lint/`
- **THEN** CLI 输出 "✔ 模板已应用"

#### Scenario: 模板不存在
- **WHEN** 用户运行 `deepstorm template apply reef react-lint` 但 `.deepstorm/templates/` 中不存在对应的模板
- **THEN** CLI 提示"模板不存在，请先运行 `deepstorm template init reef react-lint`"

### Requirement: 同步官方更新（template upgrade）

CLI SHALL 支持 `deepstorm template upgrade` 将官方最新版本的 skill 同步到 `.claude/skills/`，不覆盖用户已导出到 `.deepstorm/templates/` 的修改。

#### Scenario: 同步未修改的 skill
- **WHEN** 用户运行 `deepstorm template upgrade`
- **THEN** CLI 从内置的 `skills/` 源目录复制所有 skill 到 `.claude/skills/`
- **THEN** CLI 输出每个更新的 skill 名称

#### Scenario: 用户修改过的 skill 不受影响
- **WHEN** 用户已通过 `template init` 导出并在 `.deepstorm/templates/` 中修改了某个 skill
- **THEN** CLI 不自动覆盖 `.claude/skills/` 中对应的 skill（用户需手动运行 `template apply` 同步）
- **THEN** CLI 提示"reef-react-lint：检测到用户修改，跳过。如需同步请运行 `deepstorm template apply reef react-lint`"
