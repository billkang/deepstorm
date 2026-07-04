# code-style-fragments Specification

## Purpose

Defines the fragment-based code-style architecture for Reef. Each dimension (framework, TS config, CSS, test, backend sub-dimensions) produces independent markdown files. At setup time, fragments are combined based on user selections to form the complete SKILL.md.

## Requirements

### Requirement: Fragment 式 code-style 架构

Code-style skill SHALL 由多个独立的维度片段（fragment）文件组合而成。每个维度（如 framework、tsConfig、css、orm、ai）产出独立的一个或多个 markdown 文件和示例文件，setup 时根据用户的选择组合成完整的 SKILL.md。

#### Scenario: 维度独立定义
- **WHEN** 新增一个维度（如 `frontend.css`）
- **THEN** 开发者在 `reef-style-frontend/fragments/css/` 下创建独立的 `quick-reference.md` 和 `examples/` 目录
- **THEN** 已有维度不受影响，不需要修改

#### Scenario: 片段轮询选择
- **WHEN** 用户选择 `tailwind` 作为 CSS 方案
- **THEN** `fragments/css/tailwind/` 的内容被复制到 `dimensions/` 目录
- **THEN** `fragments/css/scss/` 和 `fragments/css/css-modules/` 的内容不被包含

### Requirement: 主 SKILL.md 使用条件引用展示

`reef-style-frontend/SKILL.md.tmpl` SHALL 使用 `{{#if}}` 条件标签控制每个维度的引用链接或内容块是否展示。

#### Scenario: 条件展示
- **WHEN** `wizard.json` 中 `reef.frontend.framework` 的 styleRef 不为空
- **THEN** SKILL.md.tmpl 中 `{{#if reef.frontend.framework.styleRef}}...{{/if}}` 的内容被渲染
- **THEN** 未选中的维度 styleRef 为空字符串，对应内容被隐藏

### Requirement: Section 级合并规则

当多个选中的维度片段包含同名 section 时，CLI SHALL 按预定义顺序拼接，不做覆盖。

#### Scenario: 合并顺序
- **WHEN** 多个维度被选中
- **THEN** CLI SHALL 按 wizard.json 中 questions 定义的顺序从前往后合并

### Requirement: 维度片段目录结构

每个 code-style skill 的 fragment 文件 SHALL 遵循统一目录结构。

#### Scenario: 目录结构
- **WHEN** 安装完成
- **THEN** skill 目录结构为 `fragments/{category}/{option}/quick-reference.md`，安装时复制到 `dimensions/{category}/{option}/`

### Requirement: 旧格式向后兼容

已有 Angular + Java 配置的用户升级后，SKILL.md 内容不能丢失。

#### Scenario: 升级不破坏
- **WHEN** 用户升级后运行 `deepstorm setup --reconfigure`
- **THEN** Angular 和 Java 的 code-style 内容与原来一致（即使底层架构改为 fragment 模式）
