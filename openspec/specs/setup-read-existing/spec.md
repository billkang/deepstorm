# setup-read-existing Specification

## Purpose
TBD - created by archiving change cli-install-ux-improve. Update Purpose after archive.
## Requirements
### Requirement: setup 启动时读取已有配置跳过已配问卷

`deepstorm setup` 启动后，SHALL 读取 `.claude/settings.json` 中 `deepstorm` 命名空间的已有配置，将其中值不为 `'none'` 的所有 key 拍平后加入 `configuredKeys`，使 `runQuestionnaire` 跳过这些 key。

#### Scenario: 已有完整 reef 配置时跳过整组问题
- **WHEN** `settings.json` 的 `deepstorm.reef` 下已有完整的 `techs`、`frontend.*`、`backend.*` 字段（由 init 写入）
- **THEN** `setup` 运行到 reef 工具的问卷循环时，SHALL 打印"⏭ reef 技术方案已在 init 中配置，跳过"并跳过整个 reef 的问卷循环，不展示任何 reef 问题

#### Scenario: 只有部分配置时只跳过已有 key
- **WHEN** `settings.json` 的 `deepstorm.reef` 下只有 `techs: "frontend"` 和 `frontend.framework: "angular"`
- **THEN** `setup` 的问卷 SHALL 跳过 `reef.techs` 和 `reef.frontend.framework`，但 SHALL 继续询问 `reef.frontend.uiLibrary`、`reef.frontend.css` 等尚未配置的字段

#### Scenario: 无已有配置时行为不变
- **WHEN** `.claude/settings.json` 不存在或 `deepstorm` 命名空间为空
- **THEN** `setup` SHALL 像现在一样运行全部问卷，无任何变化

### Requirement: MCP 选择隐藏已装服务

`deepstorm setup` 的 MCP 选择流程 SHALL 读取 `deepstorm.installedMcpServers` 列表，配合 `.env` key 完整性检查，隐藏已装且 key 完整的 MCP 服务。

#### Scenario: 完全隐藏已装且 key 完整的 MCP
- **WHEN** `settings.json` 中 `installedMcpServers` 包含 `"jira"`，且 `.env` 中 jira 对应的所有 key 都有非默认值
- **THEN** MCP 选择列表中 SHALL NOT 包含 jira 这个选项，并在选择前打印一行日志："ℹ jira 已安装且环境变量已配置，跳过选择"

#### Scenario: 已装但 key 不完整的 MCP 隐藏但标注注意
- **WHEN** `settings.json` 中 `installedMcpServers` 包含 `"github"`，但 `.env` 中缺少 `GH_TOKEN`
- **THEN** MCP 选择列表中 SHALL NOT 包含 github 选项，但在最终 guide 中针对 github SHALL 显示 ⚠️ 状态并列出缺失的 key

#### Scenario: 未装过且未配 key 的 MCP 正常展示
- **WHEN** MCP 服务不在 `installedMcpServers` 中，且 `.env` 中没有对应 key
- **THEN** MCP 选择列表中 SHALL 正常展示该选项，与当前行为一致

