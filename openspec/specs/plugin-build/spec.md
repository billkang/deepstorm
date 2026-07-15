## ADDED Requirements

### Requirement: 用户可以通过向导配置 plugin 构建参数
系统 SHALL 提供交互式向导，引导用户输入构建 plugin 所需的配置信息。

#### Scenario: 向导第一步要求输入市场名
- **WHEN** 用户运行 `deepstorm plugin build` 且未提供非交互参数
- **THEN** 系统首先提示用户输入 marketplace name（如 "example-org"），用于生成 `.claude-plugin/marketplace.json` 中的 `name` 字段

#### Scenario: 向导复用 setup 的 MCP 服务选择
- **WHEN** 用户完成市场名输入
- **THEN** 系统展示 MCP 服务列表供用户多选，流程与 `setup` 命令的 MCP 选择完全一致

#### Scenario: 向导复用 setup 的工具套件选择
- **WHEN** 用户完成 MCP 服务选择
- **THEN** 系统展示工具套件列表（Tide/Reef/Sweep/Atoll）供用户选择，流程与 `setup` 命令的工具选择完全一致

#### Scenario: 向导复用 setup 的语言/框架配置
- **WHEN** 用户完成工具套件选择
- **THEN** 系统根据所选工具套件展示对应的语言/框架/测试框架等配置问题，流程与 `setup` 命令的配置一致

### Requirement: 构建产出物为完整 Claude Plugin 目录
系统 SHALL 根据用户配置构建一个完整的、可安装的 Claude Plugin 目录。

#### Scenario: 产出物包含 .claude-plugin/ 元数据
- **WHEN** 系统完成构建
- **THEN** 产出物 MUST 包含 `.claude-plugin/marketplace.json` 和 `.claude-plugin/plugin.json`
- **THEN** `plugin.json` 中 `name` MUST 为 `"deepstorm"`
- **THEN** `plugin.json` 中 `version` MUST 从 root `package.json` 的 `version` 字段读取
- **THEN** `plugin.json` 中 `author` MUST 为 `{"name": "deepstorm"}`
- **THEN** `plugin.json` 中 `description` MUST 从 root `package.json` 的 `description` 字段读取
- **THEN** `marketplace.json` 中 `plugins[0].name` MUST 为 `"deepstorm"`

#### Scenario: 产出物包含渲染后的 skills
- **WHEN** 用户选择了某个工具套件（如 Reef）
- **THEN** 产出物 MUST 包含该工具套件对应的 skills/ 目录，模板文件（.tmpl）SHALL 根据用户选择的语言/框架渲染为最终内容
- **THEN** 未选择的工具套件对应的技能 SHALL NOT 出现在产出物中

#### Scenario: 产出物包含 agents
- **WHEN** 用户选择的工具套件包含 agents
- **THEN** 产出物 MUST 包含对应的 agents/ 目录，模板文件 SHALL 根据配置渲染

#### Scenario: 产出物包含 hooks
- **WHEN** 用户选择的工具套件包含 hooks
- **THEN** 产出物 MUST 包含对应的 hooks/ 目录及 `hooks.json`
- **THEN** `plugin.json` MUST 包含 `"hooks": "./hooks/hooks.json"` 字段声明，使 Claude Code 能够识别并加载插件的 hooks

#### Scenario: 产出物包含 .mcp.json
- **WHEN** 用户选择了 MCP 服务
- **THEN** 产出物 MUST 包含 `.mcp.json`，仅包含用户选中的 MCP 服务配置

#### Scenario: 产出物包含 settings.json
- **WHEN** 系统完成构建
- **THEN** 产出物 MUST 包含 `settings.json`，内容为 `{"enabledMcpjsonServers": [...]}`，列出用户选中的 MCP 服务名称

#### Scenario: 产出物包含 .env
- **WHEN** 用户选择了任何 MCP 服务
- **THEN** 产出物 MUST 包含 `.env`，包含所选 MCP 服务所需的环境变量模板

#### Scenario: 产出物包含 README.md
- **WHEN** 系统完成构建
- **THEN** 产出物 MUST 包含 `README.md`，内容包括 DeepStorm 介绍和用户选定的工具套件信息

#### Scenario: 产出物包含 CHANGELOG.md
- **WHEN** 系统完成构建
- **THEN** 产出物 MUST 包含 `CHANGELOG.md`

### Requirement: 构建目录管理和 .gitignore
系统 SHALL 管理构建产出目录并确保其不被提交到 Git。

#### Scenario: 构建输出到 .deepstorm/plugins/deepstorm/
- **WHEN** 用户运行 `deepstorm plugin build`
- **THEN** 构建产出物 MUST 输出到 `.deepstorm/plugins/deepstorm/` 目录

#### Scenario: 已存在构建目录时先删除再重建
- **WHEN** `.deepstorm/plugins/deepstorm/` 目录已存在
- **THEN** 系统 SHALL 先删除该目录，再创建新的构建产出

#### Scenario: .gitignore 包含 .deepstorm/ 忽略规则
- **WHEN** 系统完成构建
- **THEN** 项目根目录的 `.gitignore` MUST 包含 `.deepstorm/` 忽略规则（如已存在则跳过）
