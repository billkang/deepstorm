# setup-incremental Specification

## Purpose
TBD - created by archiving change cli-install-ux-improve. Update Purpose after archive.
## Requirements
### Requirement: selectTools 支持默认勾选已有工具

`deepstorm setup` 的工具多选界面 SHALL 支持传入初始值列表。首次运行时初始值为空列表；二次运行时读取 `deepstorm.installedSkills` 反向推导已安装的工具套件，作为初始值传入 `selectTools`。`selectTools` 的 `@clack/prompts` multiselect SHALL 使用 `initialValues` 参数实现默认勾选。

#### Scenario: 首次运行无初始值
- **WHEN** `deepstorm setup` 首次在项目中运行，`settings.json` 中无 `installedSkills`
- **THEN** `selectTools` SHALL 不传入 `initialValues`，展示的 multiselect 与当前行为一致（全未选）

#### Scenario: 二次运行已有工具默认勾选
- **WHEN** `settings.json` 的 `installedSkills` 包含 `["tide-discuss", "reef-commit", ...]`，表明 tide 和 reef 已安装
- **THEN** `selectTools` SHALL 将 tide、reef 作为 `initialValues` 传入，multiselect 中 tide、reef 默认已选中，并显示提示文字"已有工具默认勾选，取消勾选不会卸载"

#### Scenario: 用户取消勾选已有工具
- **WHEN** 二次运行时用户手动取消了 tide 的勾选
- **THEN** `setup` SHALL NOT 卸载 tide（用户需使用 `deepstorm setup --reconfigure` 或 `deepstorm uninstall` 来移除）

### Requirement: 二次运行时仅对新工具展示问卷

`deepstorm setup` 二次运行时，SHALL 遍历已选工具列表。对于 `installedSkills` 已经包含的工具，跳过其对应 wizard 问卷；仅对尚未安装的工具执行完整的问卷流程。

#### Scenario: 已有 reef+tide，追加 sweep
- **WHEN** 用户在原已安装 tide + reef 的项目中二次运行 `setup`，并额外勾选 sweep
- **THEN** `setup` SHALL 的问卷阶段 SHALL 跳过 tide 和 reef 的所有问题，仅对 sweep 展示 e2eFramework 选择问题

#### Scenario: 勾选的全是已有工具
- **WHEN** 用户二次运行 `setup`，勾选的工具列表与 `installedSkills` 完全一致（如只选了已安装的 tide+reef）
- **THEN** `setup` SHALL 的问卷阶段 SHALL 跳过所有工具的问卷，MCP 选择列表隐藏已装服务，然后直接进入资产安装阶段（重新渲染 templates）

