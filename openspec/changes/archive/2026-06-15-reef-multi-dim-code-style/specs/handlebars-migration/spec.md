## ADDED Requirements

### Requirement: 引入 Handlebars 模板引擎

CLI SHALL 使用 Handlebars 作为模板渲染引擎，替换当前的纯正则替换（`content.replace(/\{\{(\S+?)\}\}/g, ...)`）。

#### Scenario: 保持向后兼容
- **WHEN** `.tmpl` 文件中仅使用 `{{varName}}` 形式的占位符
- **THEN** Handlebars 模式下的渲染结果与原有正则替换完全一致

#### Scenario: 支持条件分支
- **WHEN** `.tmpl` 文件中使用 `{{#if condition}}...{{/if}}`
- **THEN** 模板引擎根据 `condition` 的真值决定是否输出该块内容

#### Scenario: 支持条件分支 with else
- **WHEN** `.tmpl` 文件中使用 `{{#if condition}}A{{else}}B{{/if}}`
- **THEN** `condition` 为真时输出 A，为假时输出 B

#### Scenario: 支持循环迭代
- **WHEN** `.tmpl` 文件中使用 `{{#each list}}...{{/each}}`
- **THEN** 模板引擎遍历 `list` 数组并输出每项渲染结果

#### Scenario: 支持模板引用（partial）
- **WHEN** `.tmpl` 文件中使用 `{{> partialName}}`
- **THEN** 模板引擎注册并渲染对应的 partial 模板

### Requirement: 编译模式支持

CLI SHALL 支持 Handlebars 的预编译模式，避免重复编译相同模板。

#### Scenario: 模板缓存
- **WHEN** `renderTemplate` 多次渲染同一模板文件
- **THEN** CLI SHALL 缓存编译后的模板函数，避免每次重新编译

#### Scenario: 渲染后清理
- **WHEN** `renderTemplate` 完成渲染
- **THEN** CLI SHALL 写入输出文件

### Requirement: 错误处理

CLI SHALL 在模板渲染出错时提供明确的错误信息，不静默失败。

#### Scenario: 模板语法错误
- **WHEN** `.tmpl` 文件中包含无效的 Handlebars 语法（如未闭合的 `{{#if}}`）
- **THEN** CLI SHALL 抛出带有错误位置和描述的错误信息
- **THEN** CLI SHALL 提示文件路径和大致行号
- **THEN** 渲染过程中止，不写入输出文件

#### Scenario: 未定义变量访问
- **WHEN** `.tmpl` 文件中引用了一个不在变量上下文中的 `{{varName}}`
- **THEN** Handlebars 默认行为为输出空字符串
- **THEN** CLI SHALL 在开发模式下（`NODE_ENV=development`）输出警告信息

### Requirement: 变量上下文架构

`buildTemplateVariables` SHALL 输出嵌套结构，以便配合 Handlebars 的路径解析。

#### Scenario: 嵌套路径
- **WHEN** 变量上下文为 `{ reef: { frontend: { framework: { label: "Angular" } } } }`
- **THEN** 模板中的 `{{reef.frontend.framework.label}}` 正确解析为 `"Angular"`

#### Scenario: 无需修改模板语法
- **WHEN** 现有 `.tmpl` 文件使用 `{{reef.backend.language.label}}` 等已有路径格式
- **THEN** Handlebars 模式下的嵌套结构保持相同路径，无需修改模板内容
