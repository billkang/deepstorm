## ADDED Requirements

### Requirement: MCP 外部服务选择

CLI SHALL 在工具套件选择之前，先让用户选择要集成的 MCP 外部服务（如 Jira、GitHub、Figma、钉钉云文档）。

#### Scenario: 选择 MCP 外部服务
- **WHEN** 用户运行 `npx @deepstorm/cli setup`
- **THEN** CLI 首先展示所有可用的 MCP 外部服务列表，按 domain 分组展示（项目管理、知识管理、代码托管、设计工具）
- **THEN** 用户按空格选中服务，回车确认
- **THEN** 选中的服务合并 MCP server 配置到 `.mcp.json`（以 `deepstorm-{name}` 命名避免冲突）
- **THEN** 选中的服务对应的 `mcp-skills/` 使用指南 skill 安装到 `.claude/skills/`
- **THEN** 选中的服务对应的环境变量 stub 追加到 `.env`
- **THEN** 全部不选则跳过 MCP 配置，不影响后续安装流程
- **THEN** `setup --non-interactive` 模式下通过 `--mcp-tools` 参数传递（如 `--mcp-tools jira,github`）

### Requirement: 用户可选择要安装的工具套件

CLI SHALL 在 MCP 外部服务选择之后，展示所有可用工具套件的多选列表，用户通过空格切换选中、回车确认。

#### Scenario: 正常选择多个工具
- **WHEN** 用户运行 `npx @deepstorm/cli setup`
- **THEN** CLI 展示工具列表（tide / reef / sweep / atoll），每项带描述
- **THEN** 用户按空格选中 reef 和 tide，回车确认
- **THEN** CLI 进入 reef 的配置问答流程，完成后进入 tide 的配置问答流程

#### Scenario: 全部不选直接退出
- **WHEN** 用户运行 `setup` 且未选择任何工具直接回车
- **THEN** CLI SHALL 直接退出，不做任何操作，不创建任何文件

### Requirement: 每个工具按 wizard.json 引导配置

每个工具的配置项由该工具包下的 `wizard.json` 定义，CLI SHALL 读取该文件并渲染问答。

#### Scenario: 工具专属配置引导
- **WHEN** 用户选择了 reef 工具
- **THEN** CLI 读取 `registry.json` 中 reef 的 `wizard` 定义
- **THEN** CLI 按 `questions` 数组顺序逐个展示问题
- **THEN** 每个问题的选项来自 `options` 列表

#### Scenario: 已在前置工具中配过的公共能力跳过
- **WHEN** tide 已配置了 Jira 集成
- **THEN** CLI 进入 atoll 配置时，跳过 Jira 相关的问题
- **THEN** CLI 提示 "Jira 已在 tide 中配置，跳过"

### Requirement: 全量安装（无动态依赖解析）

CLI SHALL 根据用户选择的工具全量安装所有 skill，不做按 configKey+configValue 的动态匹配。skill 的 `dependencies` 字段在 registry.json 中存储但安装时不做自动递归解析。

#### Scenario: 全量安装
- **WHEN** 用户选择了 reef 工具
- **THEN** CLI 安装 reef 下注册的**所有** skill
- **THEN** 不做基于配置值的精确Skill匹配筛选
- **THEN** 不执行 dependencies 的自动递归解析（预留扩展）

### Requirement: 安装文件复制

CLI SHALL 将匹配的 skill、agent、MCP、hooks 从 `skills/`、`agents/`、`mcp/`、`hooks/` 源目录复制到用户项目的 `.claude/` 对应位置。

#### Scenario: 复制 skill
- **WHEN** 安装列表包含 `reef-react-lint`
- **THEN** CLI 从本地 `skills/reef-react-lint/` 复制整个目录到 `.claude/skills/reef-react-lint/`

#### Scenario: 复制 agent
- **WHEN** 安装列表包含 reef 的 agent
- **THEN** CLI 从 `agents/` 复制对应 agent 目录到 `.claude/agents/`

#### Scenario: 合并 MCP JSON
- **WHEN** Jira MCP 在安装列表中
- **THEN** CLI 读取 `.mcp.json`（不存在则创建 `{}`）
- **THEN** CLI 将 Jira MCP 配置合并到 `.mcp.json` 的 `mcpServers` 字段
- **THEN** MCP 中敏感字段使用 `${VAR}` 环境变量引用，不硬编码 token

#### Scenario: 合并 hooks
- **WHEN** 工具包包含 hooks 配置
- **THEN** CLI 读取 `.claude/hooks/hooks.json`（不存在则创建 `{}`）
- **THEN** CLI 将 hooks 内容合并写入

### Requirement: 配置写入 `.claude/settings.json`

CLI SHALL 将用户配置和安装记录写入 `.claude/settings.json` 的 `deepstorm` 命名空间，不破坏已有字段。

#### Scenario: 首次写入
- **WHEN** `.claude/settings.json` 不存在
- **THEN** CLI 创建该文件和 `deepstorm` 命名空间
- **THEN** 写入用户配置（如 `reef.frontend.framework: "react"`）
- **THEN** 写入安装记录（`installedSkills`、`installedMcpServers`、`installedAt`）

#### Scenario: 合并已有配置
- **WHEN** `.claude/settings.json` 已存在并包含其他配置（如 `mcpServers`）
- **THEN** CLI 读取 → 注入 `deepstorm` 命名空间 → 写回
- **THEN** 已有字段完全保留、不受影响

### Requirement: `.env` 文件创建

CLI SHALL 在项目根目录创建或追加 `.env` 文件，写入 DeepStorm 所需环境变量占位和注释说明。

#### Scenario: `.env` 不存在
- **WHEN** 项目根目录没有 `.env` 文件
- **THEN** CLI 创建 `.env` 文件
- **THEN** 写入 DeepStorm 环境变量，每项附带注释说明获取方式和用途
- **THEN** 变量值留空，提示用户手动填写

#### Scenario: `.env` 已存在
- **WHEN** `.env` 文件已存在
- **THEN** CLI 追加 DeepStorm 相关环境变量和注释
- **THEN** 不覆盖 `.env` 中已有的环境变量

### Requirement: 安装完成后的引导

CLI SHALL 在安装完成后输出已安装的 skill 清单和下一步指引。

#### Scenario: 输出引导信息
- **WHEN** setup 所有步骤完成
- **THEN** CLI 输出 "✔ 配置已保存到 .claude/settings.json"
- **THEN** CLI 输出已安装的 skill 个数和名称列表
- **THEN** CLI 输出 "下一步：运行 Claude Code，输入 /help 查看所有可用命令"
- **THEN** 如果 `.git` 目录存在，CLI 使用 `@clack/prompts` 的 `confirm`**交互式询问**"是否将 .claude/ 配置提交到 Git？"
- **THEN** 用户确认后，检查 `.gitignore` 是否有 `.claude/` 忽略规则，输出对应的提示文字
- **THEN** `.git` 不存在时，跳过 Git 相关询问

### Requirement: `--reconfigure` 清空重来

CLI SHALL 支持 `setup --reconfigure`，读取安装记录清理旧内容后重新运行向导。

#### Scenario: reconfigure 清空并重来
- **WHEN** 用户运行 `setup --reconfigure`
- **THEN** CLI 读取 `deepstorm.installedSkills` 删除对应 skill 目录
- **THEN** CLI 清理 `deepstorm.installedMcpServers` 在 `.mcp.json` 中的条目（以 `deepstorm-` 前缀匹配删除）
- **THEN** CLI **不清理 agent 和 hooks**（当前实现只追踪 installedSkills 和 installedMcpServers）
- **THEN** CLI 重新运行完整的向导流程
- **THEN** `.deepstorm/templates/` 中用户的修改原封不动

### Requirement: `--non-interactive` 非交互模式

CLI SHALL 支持 `setup --non-interactive`，通过命令行参数传递配置，不在终端显示问答。

#### Scenario: 非交互模式参数传递
- **WHEN** 用户运行 `deepstorm setup --non-interactive --tools reef --set reef.frontend.framework=react`
- **THEN** CLI SHALL 跳过交互式问答，直接按参数配置执行安装
- **THEN** 输出结果与交互模式一致

### Requirement: 空项目目录支持

CLI SHALL 在 `.claude/`、`.claude/skills/` 不存在的项目中正常创建这些目录。

#### Scenario: 全新项目
- **WHEN** 用户在空目录（无 `.claude/`、无 `.git/`、无 `package.json`）运行 `setup`
- **THEN** CLI 自动创建 `.claude/`、`.claude/skills/`
- **THEN** CLI 完成完整安装流程
- **THEN** 不输出 Git 提交相关的提示（因 `.git` 不存在）
