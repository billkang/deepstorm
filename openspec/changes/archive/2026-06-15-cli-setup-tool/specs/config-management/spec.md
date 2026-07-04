## ADDED Requirements

### Requirement: 配置查看（config view）

CLI SHALL 支持通过 `deepstorm config view` 命令查看当前项目的完整 DeepStorm 配置。

#### Scenario: 查看全部配置
- **WHEN** 用户运行 `deepstorm config view`
- **THEN** CLI 读取并格式化输出 `.claude/settings.json` 中 `deepstorm` 命名空间的内容
- **THEN** CLI 输出完整的配置结构，包含已安装 skill 列表

#### Scenario: 配置不存在
- **WHEN** `.claude/settings.json` 中不存在 `deepstorm` 命名空间或文件不存在
- **THEN** CLI 输出提示"尚未配置 DeepStorm，请运行 `deepstorm setup`"

### Requirement: 配置修改（config set）

CLI SHALL 支持通过 `deepstorm config set <key>=<value>` 修改单项配置。

#### Scenario: 修改单项配置
- **WHEN** 用户运行 `deepstorm config set reef.frontend.framework=vue`
- **THEN** CLI 读取 `.claude/settings.json`，将 `deepstorm.reef.frontend.framework` 的值改为 `"vue"`
- **THEN** CLI 写回文件，保留其他字段
- **THEN** CLI 输出 "✔ reef.frontend.framework 已更新为 vue"
- **THEN** CLI 提示"注意：skill 未同步，请运行 `setup --reconfigure` 更新 skill"

#### Scenario: 配置 key 不存在
- **WHEN** 用户运行 `deepstorm config set invalid.key=value`
- **THEN** CLI 使用 `config-schema.json` 校验 key 是否合法
- **THEN** 如果 key 不在 schema 中，CLI 输出错误"未知配置项：invalid.key"并打印合法配置项列表，不执行写入
- **THEN** `deepstorm doctor` 也会在诊断时使用 config-schema.json 检查已有配置中的异常 key

### Requirement: 配置重置（config reset）

CLI SHALL 支持 `deepstorm config reset` 将 `deepstorm` 命名空间恢复到初始状态。

#### Scenario: 重置全部配置
- **WHEN** 用户运行 `deepstorm config reset`
- **THEN** CLI 使用 `@clack/prompts` 的 `confirm`**交互式询问**"此操作将清除所有 DeepStorm 配置，是否继续？"
- **THEN** 用户确认后，CLI 删除 `.claude/settings.json` 中的整个 `deepstorm` 命名空间
- **THEN** CLI 提示"✔ 配置已清除，请运行 deepstorm setup 重新配置"
- **THEN** 用户取消时输出"已取消"

### Requirement: 诊断（doctor）

CLI SHALL 支持 `deepstorm doctor` 诊断项目状态。

#### Scenario: 正常状态
- **WHEN** 用户运行 `deepstorm doctor`
- **THEN** CLI 检查并输出：
  - CLI 版本号
  - `.claude/settings.json` 是否存在及 `deepstorm` 命名空间是否完整
  - `.claude/skills/` 中各 skill 的 frontmatter 是否有效
  - `.mcp.json` 中 DeepStorm 合并的 MCP 是否完整
  - 缺少的依赖 skill
- **THEN** 所有检查通过时输出 "✔ 一切正常"

#### Scenario: 发现异常
- **WHEN** `deepstorm` 命名空间中记录的某个 skill 在 `.claude/skills/` 中不存在
- **THEN** CLI 输出警告 "⚠ 缺少 skill：reef-react-lint（已记录但未安装）"
- **THEN** CLI 建议 "请运行 `deepstorm setup --reconfigure` 修复"

### Requirement: 卸载（uninstall）

CLI SHALL 支持 `deepstorm uninstall` 清理所有 DeepStorm 生成的内容。

#### Scenario: 完整卸载
- **WHEN** 用户运行 `deepstorm uninstall`
- **THEN** CLI 读取 `deepstorm.installedSkills` 删除 `.claude/skills/` 中对应 skill 目录
- **THEN** CLI 读取 `deepstorm.installedMcpServers` 以 `deepstorm-` 前缀清理 `.mcp.json` 中对应条目
- **THEN** CLI 删除 `.claude/settings.json` 中的 `deepstorm` 命名空间
- **THEN** 如果 `.deepstorm/templates/` 目录存在，CLI 使用 `@clack/prompts` 的 `confirm`**交互式询问**"是否删除 .deepstorm/templates/ 目录？"
- **THEN** 用户确认后直接删除，否则保留
- **THEN** agent 和 hooks 不做精准清理（当前实现不追踪 installedAgents/installedHooks）

#### Scenario: 未安装时运行 uninstall
- **WHEN** 用户运行 `deepstorm uninstall` 且 `.claude/settings.json` 中没有 `deepstorm` 命名空间
- **THEN** CLI 输出提示"DeepStorm 尚未配置，无需卸载"
