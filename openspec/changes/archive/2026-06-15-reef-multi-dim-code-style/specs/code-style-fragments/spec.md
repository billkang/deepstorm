## ADDED Requirements

### Requirement: Fragment 式 code-style 架构

Code-style skill SHALL 由多个独立的维度片段（fragment）文件组合而成。每个维度（如 framework、tsConfig、css、orm、ai）产出独立的一个或多个 markdown 文件和示例文件，setup 时根据用户的选择组合成完整的 SKILL.md。

#### Scenario: 维度独立定义
- **WHEN** 新增一个维度（如 `frontend.css`）
- **THEN** 开发者在 `reef-style-frontend/fragments/css/` 下创建独立的 `quick-reference.md` 和 `examples/` 目录
- **THEN** 已有维度不受影响，不需要修改

#### Scenario: 片段轮询选择
- **WHEN** 用户选择 `tailwind` 作为 CSS 方案
- **THEN** `fragments/css/tailwind/` 的内容被标记为选中
- **THEN** `fragments/css/scss/` 和 `fragments/css/css-modules/` 的内容不被包含

#### Scenario: 多维度同时参与
- **WHEN** 用户同时选择了 `angular`（框架）和 `tailwind`（CSS）和 `strict`（TS 配置）
- **THEN** 三个维度的选中片段都被收集到生成的 SKILL.md 中

### Requirement: 主 SKILL.md 使用条件引用展示

`reef-style-frontend/SKILL.md.tmpl` SHALL 使用 `{{#if}}` 条件标签控制每个维度的引用链接或内容块是否展示。

#### Scenario: 条件展示
- **WHEN** `wizard.json` 中 `reef.frontend.framework` 选项的 template 字段包含 `showFrameworkRef: true`
- **THEN** SKILL.md.tmpl 中 `{{#if reef.frontend.framework.showFrameworkRef}}...{{/if}}` 的内容被渲染
- **THEN** 未选中的维度其条件变量为 `false` 或空字符串，对应内容被隐藏

#### Scenario: 展示维度片段引用
- **WHEN** 用户选择了 `angular`
- **THEN** SKILL.md 渲染后包含:
  ```markdown
  ### 框架规范
  → 参考 [Angular 规范](dimensions/framework/angular/quick-reference.md)
  ```

### Requirement: Section 级合并规则

当多个选中的维度片段包含同名 section（如 `## 命名规范`）时，CLI SHALL 按预定义顺序拼接，不做覆盖。

#### Scenario: 同名 section 拼接
- **WHEN** `angular.md` 包含 `## 命名规范` 且 `ts-strict.md` 也包含 `## 命名规范`
- **THEN** 合并时按 `[angular, ts-strict]` 顺序拼接两个内容块
- **THEN** 输出为 `## 命名规范\n[angular 内容]\n## 命名规范\n[ts-strict 内容]`

#### Scenario: 合并顺序
- **WHEN** 多个维度被选中
- **THEN** CLI SHALL 按 wizard.json 中 questions 定义的顺序从前往后合并

### Requirement: 维度片段目录结构

每个 code-style skill 的 fragment 文件 SHALL 遵循统一目录结构。

#### Scenario: 目录结构
- **WHEN** 安装完成
- **THEN** `.claude/skills/reef-style-frontend/` 结构为:
  ```
  SKILL.md                     ← 主 skill，根据选择渲染
  base/                        ← 通用规范（不依赖特定维度）
    quick-reference.md
    examples/
  dimensions/
    framework/
      angular/
        quick-reference.md
        examples/
    ts-config/
      strict/
        quick-reference.md
      standard/
        quick-reference.md
    css/
      tailwind/
        quick-reference.md
      scss/
        quick-reference.md
  ```

### Requirement: 旧格式向后兼容

已有 Angular + Java 配置的用户升级后，SKILL.md 内容不能丢失。

#### Scenario: 升级不破坏
- **WHEN** 用户升级后运行 `deepstorm setup --reconfigure`
- **THEN** Angular 和 Java 的 code-style 内容与原来一致（即使底层架构改为 fragment 模式）
