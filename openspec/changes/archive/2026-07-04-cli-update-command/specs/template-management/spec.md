## MODIFIED Requirements

### Requirement: 同步官方更新（template upgrade → update --skills）

CLI SHALL 支持 `update --skills` 将官方最新版本的 skill 同步到 `.claude/skills/`，不覆盖用户已导出到 `.deepstorm/templates/` 的修改。

#### Scenario: 同步未修改的 skill
- **WHEN** 用户运行 `deepstorm update --skills`
- **THEN** CLI 从内置的 `skills/` 源目录复制所有 skill 到 `.claude/skills/`
- **THEN** CLI 输出每个更新的 skill 名称

#### Scenario: 用户修改过的 skill 不受影响
- **WHEN** 用户已通过 `template init` 导出并在 `.deepstorm/templates/` 中修改了某个 skill
- **THEN** CLI 不自动覆盖 `.claude/skills/` 中对应的 skill（用户需手动运行 `template apply` 同步）
- **THEN** CLI 提示"{skillId}：检测到用户修改，跳过。如需同步请运行 `deepstorm template apply {skillId}`"

## REMOVED Requirements

### Requirement: template upgrade 子命令

**Reason**: 功能合并到 `deepstorm update --skills`，`template upgrade` 子命令不再注册
**Migration**: 使用 `deepstorm update --skills` 替代
