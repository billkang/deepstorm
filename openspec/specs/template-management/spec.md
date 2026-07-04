# template-management Specification

## Purpose

Defines the template management subsystem (`deepstorm template list/init/apply/upgrade`) and the Handlebars-based rendering engine of the DeepStorm CLI. Covers template listing by tool, exporting default skill content to `.deepstorm/templates/` for user customization, applying modified templates back to `.claude/skills/`, syncing official updates while preserving user modifications, and the `config refresh` command that re-renders all `.tmpl` templates based on current config. The rendering engine migrated from regex replacement to Handlebars compilation, enabling `{{#if}}` conditional blocks, `{{#each}}` iteration, `{{> partial}}` reuse, and nested variable context via `toNested()`. Requires configVersion tracking for migration safety.
## Requirements
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

### Requirement: 同步官方更新（update --skills）

CLI SHALL 支持 `deepstorm update --skills` 将官方最新版本的 skill 同步到 `.claude/skills/`，不覆盖用户已导出到 `.deepstorm/templates/` 的修改。

#### Scenario: 同步未修改的 skill
- **WHEN** 用户运行 `deepstorm update --skills`
- **THEN** CLI 从内置的 `skills/` 源目录复制所有 skill 到 `.claude/skills/`
- **THEN** CLI 输出每个更新的 skill 名称

#### Scenario: 用户修改过的 skill 不受影响
- **WHEN** 用户已通过 `template init` 导出并在 `.deepstorm/templates/` 中修改了某个 skill
- **THEN** CLI 不自动覆盖 `.claude/skills/` 中对应的 skill（用户需手动运行 `template apply` 同步）
- **THEN** CLI 提示"{skillId}：检测到用户修改，跳过。如需同步请运行 `deepstorm template apply {skillId}`"

### Requirement: 渲染引擎变更

CLI 的模板渲染引擎 SHALL 从纯正则替换改为 Handlebars 编译渲染。

#### Scenario: 原有 `{{var}}` 替换
- **WHEN** `.tmpl` 文件中使用 `{{reef.frontend.framework.label}}`
- **THEN** Handlebars 渲染结果与 regex 替换完全一致
- **THEN** 无需修改现有 `.tmpl` 文件

#### Scenario: 新增条件渲染
- **WHEN** `.tmpl` 文件中添加 `{{#if varName}}...{{/if}}`
- **THEN** 渲染引擎根据 `varName` 的布尔值正确控制输出

### Requirement: 模板渲染函数更新

`renderTemplate` 函数签名 SHALL 保持向后兼容但内部实现改为使用 `Handlebars.compile()` 编译模板。

#### Scenario: 函数签名不变
- **WHEN** CLI 其他代码调用 `renderTemplate(tmplPath, variables, outputPath)`
- **THEN** 调用方式不变，返回值和行为一致

#### Scenario: 未匹配变量
- **WHEN** `.tmpl` 文件中引用的变量不在 `variables` 上下文中
- **THEN** Handlebars 默认输出空字符串
- **THEN** 开发模式下可追踪未定义变量

### Requirement: 模板 partial 支持

CLI SHALL 支持通过 Handlebars partial 机制复用模板片段。

#### Scenario: 注册公共 partial
- **WHEN** CLI 入口初始化渲染
- **THEN** SHALL 自动注册指定目录下的所有 `.hbs` 文件为 Handlebars partials
- **THEN** 所有 `.tmpl` 文件可通过 `{{> partialName}}` 引用这些片段

### Requirement: 非交互配置刷新

CLI SHALL 支持 `deepstorm config refresh` 重新渲染所有已安装的 `.tmpl` 模板（基于当前配置），无需用户重新执行完整的 setup 流程。

#### Scenario: 刷新模板
- **WHEN** 用户运行 `deepstorm config refresh`
- **THEN** CLI 读取当前 `deepstorm` 命名空间中的全部配置
- **THEN** SHALL 遍历所有已安装 skill 对应的 `.tmpl` 文件并重新渲染
- **THEN** CLI 输出 "✔ N 个模板已刷新"

