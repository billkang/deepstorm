## MODIFIED Requirements

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
- **THEN** Handlebars 默认输出空字符串（当前行为为保留 `{{var}}` 原文）
- **THEN** CLI SHALL 在渲染前注入空字符串兜底，确保开发模式下可追踪未定义变量

## ADDED Requirements

### Requirement: 模板 partial 支持

CLI SHALL 支持通过 Handlebars partial 机制复用模板片段。

#### Scenario: 注册公共 partial
- **WHEN** CLI 入口（`renderAllTemplates`）初始化渲染
- **THEN** SHALL 自动注册 `cli/templates/partials/` 目录下的所有 `.hbs` 文件为 Handlebars partials
- **THEN** 所有 `.tmpl` 文件可通过 `{{> partialName}}` 引用这些片段

### Requirement: 非交互配置刷新

CLI SHALL 支持 `deepstorm config refresh` 重新渲染所有已安装的 `.tmpl` 模板（基于当前配置），无需用户重新执行完整的 setup 流程。区别于 `config set` 的单个配置项修改后刷新，refresh 覆盖所有已安装模板的全量重新渲染。

#### Scenario: 刷新模板
- **WHEN** 用户运行 `deepstorm config refresh`
- **THEN** CLI 读取当前 `deepstorm` 命名空间中的全部配置
- **THEN** SHALL 遍历所有已安装 skill 对应的 `.tmpl` 文件并重新渲染
- **THEN** CLI 输出 "✔ N 个模板已刷新"
