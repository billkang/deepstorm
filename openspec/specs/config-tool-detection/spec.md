# Config Tool Detection

## ADDED Requirements

### Requirement: 通过配置前缀检测已安装 tool
`syncToolAssets()` SHALL 在 `skillIdsToTools()` 之外，额外从 `deepstorm.*` 扁平配置的 key 前缀中检测已安装的 tool。两次检测结果 SHALL 合并去重后作为最终处理的 tool 列表。

#### Scenario: 配置中有 reef.* 但 installedSkills 无 reef skill
- **WHEN** 用户在 `deepstorm.reef.techs` 中配置了 `"frontend,backend"`，且 `installedSkills` 中没有 reef 的任何 skill
- **THEN** `syncToolAssets()` SHALL 通过配置前缀检测到 reef 为已安装 tool
- **THEN** update 命令 SHALL 同步 reef 的 hooks、agents 和 skills

#### Scenario: installedSkills 和配置中同时检测到同一 tool
- **WHEN** `installedSkills` 包含 `reef-commit` 且配置中有 `reef.techs`
- **THEN** 合并去重后 reef 只出现一次
- **THEN** 资产正常同步，无重复操作

#### Scenario: 既无 installedSkills 也无 deepstorm.* 配置
- **WHEN** `.claude/settings.json` 没有 `installedSkills` 且没有 `deepstorm.*` 命名空间
- **THEN** `allTools` 为空列表
- **THEN** 显示提示并跳过资产同步

### Requirement: detectToolsFromConfig 的实现规范
新增的 `detectToolsFromConfig(config, registry)` 函数 SHALL 遵循以下规范。

#### Scenario: 正确识别已知 tool 前缀
- **WHEN** 配置 key 为 `"reef.techs": "frontend,backend"` 且 `registry.tools` 包含 `"reef"`
- **THEN** 函数 SHALL 返回 `["reef"]`

#### Scenario: 跳过未知前缀的 key
- **WHEN** 配置 key 为 `"unknownTool.setting": "value"`
- **THEN** 函数 SHALL 忽略该 key，不返回未知 tool

#### Scenario: 跳过不含点的 key
- **WHEN** 配置 key 为 `"installedSkills"`（没有 `.` 分隔符）
- **THEN** 函数 SHALL 对该 key 调用 `indexOf('.')` 返回 -1，安全跳过

### Requirement: 不影响 setup 命令和已有功能
此变更 SHALL NOT 影响 `deepstorm setup` 的行为，且 SHALL NOT 引入对现有已正确安装项目的回归问题。

#### Scenario: 已正确安装的完整项目不受影响
- **WHEN** 项目已通过 setup 正确安装了 reefs skills 并记录在 `installedSkills` 中
- **THEN** `skillIdsToTools()` 正常返回 reef，`detectToolsFromConfig()` 补充检测不会改变结果
- **THEN** 资产同步行为与修改前一致
