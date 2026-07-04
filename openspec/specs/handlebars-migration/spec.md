# handlebars-migration Specification

## Purpose

Migrate the template rendering engine from regex-based replacement (`content.replace(/\{\{(\S+?)\}\}/g, ...)`) to Handlebars, enabling `{{#if}}`/`{{#each}}`/`{{> partial}}` capabilities while maintaining full backward compatibility with existing `.tmpl` files.

## Requirements

### Requirement: 引入 Handlebars 模板引擎

CLI SHALL 使用 Handlebars 作为模板渲染引擎，替换当前的纯正则替换。

#### Scenario: 原有 `{{var}}` 替换
- **WHEN** `.tmpl` 文件中使用 `{{reef.frontend.framework.label}}`
- **THEN** Handlebars 渲染结果与 regex 替换完全一致
- **THEN** 无需修改现有 `.tmpl` 文件

#### Scenario: 条件分支
- **WHEN** `.tmpl` 文件中使用 `{{#if reef.frontend.framework.styleRef}}`
- **THEN** 变量为 truthy 时渲染内容，为 falsy 时隐藏
- **THEN** 空字符串被视为 falsy，不渲染

#### Scenario: Partial 引用
- **WHEN** `.tmpl` 文件中使用 `{{> header}}`
- **THEN** Handlebars 从注册的 partials 中查找并渲染

### Requirement: 编译模式支持

CLI SHALL 支持 Handlebars 的编译缓存模式，避免重复编译相同模板。

#### Scenario: 编译缓存
- **WHEN** 同一模板被多次渲染
- **THEN** CLI SHALL 缓存编译后的模板函数，避免每次重新编译

### Requirement: 错误处理

CLI SHALL 在模板渲染出错时提供明确的错误信息，不静默失败。

#### Scenario: 文件不存在
- **WHEN** 指定的 `.tmpl` 文件不存在
- **THEN** CLI SHALL 抛出带有文件路径的错误信息

#### Scenario: 语法错误
- **WHEN** `.tmpl` 文件包含 Handlebars 语法错误
- **THEN** CLI SHALL 抛出带有错误位置和描述的错误信息

### Requirement: 变量上下文架构

`buildTemplateVariables` SHALL 输出扁平结构，配合 `toNested()` 转换为嵌套结构供 Handlebars 使用。

#### Scenario: 嵌套变量
- **WHEN** 变量为 `{ "reef.frontend.framework.styleRef": "→ 参考..." }`
- **THEN** `toNested()` 转换为 `{ reef: { frontend: { framework: { styleRef: "→ 参考..." } } } }`
- **THEN** 模板中使用 `{{reef.frontend.framework.styleRef}}` 解析
